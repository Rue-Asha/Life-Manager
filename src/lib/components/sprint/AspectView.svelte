<script lang="ts">
	import { flip } from 'svelte/animate';
	import { canDrag, draggableTodo, dropZone } from '$lib/dnd';
	import { flipOpts, receive, send } from '$lib/motion';
	import type { Aspect, Id, IsoDate, Todo } from '$lib/types';
	import TodoRow from '../todo/TodoRow.svelte';
	import AspectIcon from '../ui/AspectIcon.svelte';
	import ProgressBar from '../ui/ProgressBar.svelte';

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
		onadd?: (id: Id) => void;
	} = $props();

	// Inside a draggable element a mouse selection in the editor's fields would start a drag.
	let typing = $state<Id | null>(null);

	const groups = $derived(
		aspects
			.map((aspect) => ({ aspect, todos: todos.filter((t) => t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0)
	);
</script>

<div
	class="list"
	data-testid="sprint-list"
	use:dropZone={{ accepts: (p) => !!onadd && p.from === 'backlog', ondrop: (p) => onadd?.(p.id) }}
>
	{#each groups as { aspect, todos } (aspect.id)}
		{@const done = todos.filter((t) => t.status === 'done').length}
		<section class="group" data-testid="aspect-group-{aspect.id}" aria-labelledby="group-{aspect.id}">
			<h2 id="group-{aspect.id}">
				<AspectIcon icon={aspect.icon} color={aspect.color} />{aspect.name}
				<span class="progress"><ProgressBar {done} total={todos.length} color={aspect.color} /></span>
			</h2>
			<!-- Global: the first todo of an aspect arrives with its group and should still travel in. -->
			{#each todos as todo (todo.id)}
				<div
					class="item"
					role="presentation"
					in:receive|global={{ key: todo.id }}
					out:send|global={{ key: todo.id }}
					animate:flip={flipOpts()}
					use:draggableTodo={{ id: todo.id, from: 'sprint', recurring: todo.recurring }}
					draggable={canDrag.current && typing !== todo.id}
					onfocusin={(e) => (typing = (e.target as Element).matches('input, textarea') ? todo.id : null)}
					onfocusout={() => (typing = null)}
				>
					<ul><TodoRow {todo} {aspect} {today} context="sprint" {sprintDays} /></ul>
				</div>
			{/each}
		</section>
	{:else}
		<p class="empty" data-testid="empty-state">
			Nothing in this sprint yet. Add a todo above, or pull some in from the <a href="/backlog">backlog</a>.
		</p>
	{/each}
</div>

<style>
	.group + .group {
		margin-top: var(--space-7);
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--line);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
	}

	.progress {
		margin-left: auto;
		font-weight: var(--weight-regular);
	}

	.list {
		min-height: 120px;
		border-radius: var(--radius-md);
		transition:
			background-color var(--dur-fast) var(--ease-out),
			box-shadow var(--dur-fast) var(--ease-out);
	}

	/* The drop slot is a hairline, not a filled target. */
	.list:global([data-over]) {
		background: var(--accent-soft);
		box-shadow: inset 0 0 0 1px var(--accent);
	}

	.item {
		border-radius: var(--radius-md);
	}

	.item[draggable='true'] {
		cursor: grab;
	}

	.item:global([data-dragging]) {
		background: var(--paper);
		box-shadow: var(--shadow-float);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.empty {
		padding: var(--space-8) var(--space-4);
		color: var(--ink-3);
		text-align: center;
	}

	.empty a {
		color: var(--accent);
		font-weight: var(--weight-medium);
		text-decoration: none;
	}

	.empty a:hover {
		text-decoration: underline;
	}
</style>
