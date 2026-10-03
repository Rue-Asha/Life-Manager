<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { dropZone } from '$lib/dnd';
	import type { Aspect, Id, IsoDate, Placement, Status, Todo } from '$lib/types';
	import { STATUS_LABELS } from '../todo/StatusControl.svelte';
	import { submit } from '../todo/form';
	import SprintCard from './SprintCard.svelte';

	let {
		todos,
		aspects,
		today,
		sprintDays,
		onadd
	}: {
		todos: Todo[];
		aspects: Aspect[];
		today: IsoDate;
		sprintDays: IsoDate[];
		onadd?: (id: Id, placement: Placement) => void;
	} = $props();

	const STATUSES: Status[] = ['todo', 'doing', 'done'];
	const PLACEHOLDERS: Record<Status, string> = {
		todo: 'Nothing left to start',
		doing: 'Nothing in progress',
		done: 'Nothing done yet'
	};

	const aspectOf = (todo: Todo) => aspects.find((a) => a.id === todo.aspectId)!;

	// A dropped card sits in its new column while the move saves, instead of springing back.
	let moved = $state<{ id: Id; status: Status } | null>(null);
	let moveForm = $state<HTMLFormElement>();
	const statusOf = (todo: Todo) => (moved?.id === todo.id ? moved.status : todo.status);

	async function drop(id: Id, status: Status) {
		if (todos.find((t) => t.id === id)?.status === status) return;
		moved = { id, status };
		await tick();
		moveForm?.requestSubmit();
	}

	const settle = () => (moved = null);
</script>

<form
	bind:this={moveForm}
	method="POST"
	action="/todos?/setStatus"
	hidden
	use:enhance={submit({ onsuccess: settle, onerror: settle })}
>
	<input type="hidden" name="id" value={moved?.id} />
	<input type="hidden" name="status" value={moved?.status} />
</form>

<div class="board">
	{#each STATUSES as status (status)}
		{@const cards = todos.filter((t) => statusOf(t) === status)}
		<section
			class="column"
			use:dropZone={{
				accepts: (p) => p.from === 'sprint' || !!onadd,
				ondrop: (p) => (p.from === 'sprint' ? drop(p.id, status) : onadd?.(p.id, { status }))
			}}
			data-testid="board-column-{status}"
			aria-labelledby="column-{status}"
		>
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
		transition: background-color var(--dur-fast) var(--ease-out);
	}

	.column:global([data-over]) {
		background: var(--accent-soft);
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
