<script lang="ts">
	import { canDrag, draggableTodo } from '$lib/dnd';
	import type { Aspect, IsoDate, Todo } from '$lib/types';
	import TodoRow from '../todo/TodoRow.svelte';

	let {
		todo,
		aspect,
		today,
		sprintDays,
		variant = 'card'
	}: { todo: Todo; aspect: Aspect; today: IsoDate; sprintDays: IsoDate[]; variant?: 'card' | 'chip' | 'row' } =
		$props();

	// Inside a draggable element a mouse selection in the editor's fields would start a drag.
	let typing = $state(false);
</script>

<div
	class="card"
	class:chip={variant === 'chip'}
	data-testid="sprint-card"
	role="group"
	aria-label={todo.title}
	use:draggableTodo={{ id: todo.id, from: 'sprint', recurring: todo.recurring }}
	draggable={canDrag.current && !typing}
	onfocusin={(e) => (typing = (e.target as Element).matches('input, textarea'))}
	onfocusout={() => (typing = false)}
>
	<ul><TodoRow {todo} {aspect} {today} context="sprint" {sprintDays} {variant} /></ul>
</div>

<style>
	.card {
		border-radius: var(--radius-md);
		background: var(--surface);
		box-shadow: var(--shadow-card);
	}

	/* Week chips sit on the white week sheet, so they take the canvas grey instead of a lift. */
	.chip {
		border-radius: 8px;
		background: var(--canvas);
		box-shadow: none;
	}

	.card[draggable='true'] {
		cursor: grab;
	}

	/* Lifted, not tilted: the browser snapshots the card with its shadow for the drag image. */
	.card:global([data-dragging]) {
		box-shadow: var(--shadow-float);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* A removed recurring instance waits behind its undo toast; only the toast is left of the card. */
	.card:has(:global(.removed)) {
		display: contents;
	}
</style>
