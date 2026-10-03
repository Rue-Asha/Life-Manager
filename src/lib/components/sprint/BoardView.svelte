<script lang="ts">
	import type { Aspect, IsoDate, Status, Todo } from '$lib/types';
	import { STATUS_LABELS } from '../todo/StatusControl.svelte';
	import SprintCard from './SprintCard.svelte';

	let {
		todos,
		aspects,
		today,
		sprintDays
	}: { todos: Todo[]; aspects: Aspect[]; today: IsoDate; sprintDays: IsoDate[] } = $props();

	const STATUSES: Status[] = ['todo', 'doing', 'done'];
	const PLACEHOLDERS: Record<Status, string> = {
		todo: 'Nothing left to start',
		doing: 'Nothing in progress',
		done: 'Nothing done yet'
	};

	const aspectOf = (todo: Todo) => aspects.find((a) => a.id === todo.aspectId)!;
</script>

<div class="board">
	{#each STATUSES as status (status)}
		{@const cards = todos.filter((t) => t.status === status)}
		<section class="column" data-testid="board-column-{status}" aria-labelledby="column-{status}">
			<h2 id="column-{status}">{STATUS_LABELS[status]}<span class="num">{cards.length}</span></h2>
			{#each cards as todo (todo.id)}
				<SprintCard {todo} aspect={aspectOf(todo)} {today} {sprintDays} />
			{:else}
				<p class="placeholder" data-testid="column-placeholder">{PLACEHOLDERS[status]}</p>
			{/each}
		</section>
	{/each}
</div>

<style>
	.board {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-3);
		align-items: start;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-height: 180px;
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
	}

	h2 {
		display: flex;
		justify-content: space-between;
		margin-bottom: var(--space-1);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}

	h2 span {
		color: var(--ink-3);
		font-weight: var(--weight-regular);
	}

	.placeholder {
		display: grid;
		place-items: center;
		height: 64px;
		border: 1px dashed var(--line-strong);
		border-radius: var(--radius-md);
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	@media (max-width: 767px) {
		.board {
			grid-template-columns: minmax(0, 1fr);
		}

		.column {
			min-height: 0;
		}
	}
</style>
