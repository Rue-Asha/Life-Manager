<script lang="ts" module>
	import { MediaQuery } from 'svelte/reactivity';
	import type { Id } from '$lib/types';

	const TYPE = 'application/x-life-manager-todo';

	// Drag is the desktop shortcut; touch moves todos with the status menu and the day picker.
	const pointer = new MediaQuery('(hover: hover) and (pointer: fine)');

	export function dropTarget(node: HTMLElement, ondrop: (id: Id) => void) {
		const carries = (e: DragEvent) => e.dataTransfer?.types.includes(TYPE);
		function over(e: DragEvent) {
			if (!carries(e)) return;
			e.preventDefault();
			e.dataTransfer!.dropEffect = 'move';
			node.dataset.over = '';
		}
		function leave(e: DragEvent) {
			if (!node.contains(e.relatedTarget as Node | null)) delete node.dataset.over;
		}
		function drop(e: DragEvent) {
			if (!carries(e)) return;
			e.preventDefault();
			delete node.dataset.over;
			ondrop(Number(e.dataTransfer!.getData(TYPE)));
		}
		node.addEventListener('dragover', over);
		node.addEventListener('dragleave', leave);
		node.addEventListener('drop', drop);
		return {
			update: (next: (id: Id) => void) => (ondrop = next),
			destroy() {
				node.removeEventListener('dragover', over);
				node.removeEventListener('dragleave', leave);
				node.removeEventListener('drop', drop);
			}
		};
	}
</script>

<script lang="ts">
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
	let lift = $state<'lifted' | 'left' | null>(null);

	function dragstart(e: DragEvent) {
		e.dataTransfer!.setData(TYPE, String(todo.id));
		e.dataTransfer!.effectAllowed = 'move';
		lift = 'lifted';
		// The browser snapshots the lifted card for the drag image; what stays behind fades.
		requestAnimationFrame(() => {
			if (lift) lift = 'left';
		});
	}
</script>

<div
	class="card {lift}"
	data-testid="sprint-card"
	role="group"
	aria-label={todo.title}
	draggable={pointer.current && !typing}
	ondragstart={dragstart}
	ondragend={() => (lift = null)}
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
		transition: opacity var(--dur-fast) var(--ease-out);
	}

	.card[draggable='true'] {
		cursor: grab;
	}

	.lifted {
		box-shadow: var(--shadow-float);
	}

	.left {
		opacity: 0.4;
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
</style>
