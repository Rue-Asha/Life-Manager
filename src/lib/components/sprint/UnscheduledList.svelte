<script lang="ts">
	import { flip } from 'svelte/animate';
	import { page } from '$app/state';
	import { dropZone } from '$lib/dnd';
	import { flipOpts, receive, send } from '$lib/motion';
	import type { Aspect, IsoDate, Todo } from '$lib/types';
	import QuickAdd from '../todo/QuickAdd.svelte';
	import SprintCard from './SprintCard.svelte';
	import { dayOf, moveToDay, wideWeek } from './WeekView.svelte';

	let { todos, sprintDays, today }: { todos: Todo[]; sprintDays: IsoDate[]; today: IsoDate } = $props();

	const aspects = $derived(page.data.aspects as Aspect[]);
	const cards = $derived(todos.filter((t) => dayOf(t) === null));
	const aspectOf = (todo: Todo) => aspects.find((a) => a.id === todo.aspectId)!;
</script>

<!-- Below 1280 the week keeps Unscheduled as its own column, so the test id exists once. -->
{#if wideWeek.current}
	<section
		class="column"
		use:dropZone={{
			accepts: (p) => p.from === 'sprint',
			ondrop: (p) => moveToDay(todos.find((t) => t.id === p.id), null)
		}}
		data-testid="day-column-unscheduled"
		aria-labelledby="day-unscheduled"
	>
		<h2 id="day-unscheduled">Unscheduled<span class="count num">{cards.length || ''}</span></h2>
		{#each cards as todo (todo.id)}
			<div in:receive={{ key: todo.id }} out:send={{ key: todo.id }} animate:flip={flipOpts()}>
				<SprintCard {todo} aspect={aspectOf(todo)} {today} {sprintDays} />
			</div>
		{/each}
		<div class="add"><QuickAdd {aspects} target={{ kind: 'sprint' }} /></div>
	</section>
{/if}

<style>
	.column {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		/* Cards sit straight on the rail's stone, like they do in a day column. */
		margin: 0 calc(-1 * var(--space-2)) var(--space-7);
		padding: var(--space-2);
		border-radius: var(--radius-md);
		transition:
			background-color var(--dur-fast) var(--ease-out),
			box-shadow var(--dur-fast) var(--ease-out);
	}

	/* The drop slot is a hairline, not a filled target. */
	.column:global([data-over]) {
		background: var(--accent-soft);
		box-shadow: inset 0 0 0 1px var(--accent);
	}

	h2 {
		display: flex;
		align-items: center;
		height: 26px;
		margin-bottom: var(--space-1);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}

	.count {
		margin-left: auto;
		color: var(--ink-3);
		font-weight: var(--weight-regular);
	}

	.add {
		margin: 0 calc(-1 * var(--space-1));
	}
</style>
