<script lang="ts">
	import { canDrag, draggableTodo } from '$lib/dnd';
	import type { Aspect, IsoDate, Todo } from '$lib/types';
	import TodoRow from '../todo/TodoRow.svelte';

	let {
		todo,
		aspect,
		today,
		sprintDays,
		variant = 'card',
		named = true,
		mixed = false
	}: {
		todo: Todo;
		aspect: Aspect;
		today: IsoDate;
		sprintDays: IsoDate[];
		variant?: 'card' | 'chip' | 'row';
		// A By-aspect row is only a draggable wrapper; a board card or week chip is a group named by its todo.
		named?: boolean;
		// Names the aspect in the row's meta line (a day's list mixes aspects).
		mixed?: boolean;
	} = $props();

	// Inside a draggable element a mouse selection in the editor's fields would start a drag.
	let typing = $state(false);
</script>

<div
	class="hs-drag"
	role={named ? 'group' : 'presentation'}
	aria-label={named ? todo.title : undefined}
	use:draggableTodo={{ id: todo.id, from: 'sprint', recurring: todo.recurring }}
	draggable={canDrag.current && !typing}
	onfocusin={(e) => (typing = (e.target as Element).matches('input, textarea'))}
	onfocusout={() => (typing = false)}
>
	<ul><TodoRow {todo} {aspect} {today} context="sprint" {sprintDays} {variant} {mixed} /></ul>
</div>
