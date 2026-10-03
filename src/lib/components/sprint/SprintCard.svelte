<script lang="ts">
	import { canDrag, draggableTodo } from '$lib/dnd';
	import type { Aspect, IsoDate, Todo } from '$lib/types';
	import TodoRow from '../todo/TodoRow.svelte';
	import AspectTag from '../ui/AspectTag.svelte';

	let {
		todo,
		aspect,
		today,
		sprintDays
	}: { todo: Todo; aspect: Aspect; today: IsoDate; sprintDays: IsoDate[] } = $props();

	// Inside a draggable element a mouse selection in the editor's fields would start a drag.
	let typing = $state(false);
</script>

<div
	class="card"
	data-testid="sprint-card"
	role="group"
	aria-label={todo.title}
	use:draggableTodo={{ id: todo.id, from: 'sprint', recurring: todo.recurring }}
	draggable={canDrag.current && !typing}
	onfocusin={(e) => (typing = (e.target as Element).matches('input, textarea'))}
	onfocusout={() => (typing = false)}
>
	<ul><TodoRow {todo} {aspect} {today} context="sprint" {sprintDays} /></ul>
	<span class="tag" data-testid="aspect-tag">
		<AspectTag name={aspect.name} color={aspect.color} icon={aspect.icon} />
	</span>
</div>

<style>
	.card {
		padding: var(--space-1) var(--space-3) var(--space-3);
		border-radius: var(--radius-md);
		background: var(--paper);
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

	.tag {
		display: block;
		margin-top: var(--space-1);
	}

	/* The row opened into its editor card; the tag would hang below it. */
	.card:has(:global(.expanded)) .tag {
		display: none;
	}

	/* A removed recurring instance waits behind its undo toast; only the toast is left of the card. */
	.card:has(:global(.removed)) {
		display: contents;
	}

	.card:has(:global(.removed)) .tag {
		display: none;
	}
</style>
