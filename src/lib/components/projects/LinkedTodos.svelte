<script lang="ts">
	import { page } from '$app/state';
	import type { Aspect, IsoDate, ProjectTodos } from '$lib/types';
	import TodoRow from '../todo/TodoRow.svelte';
	import { GLYPHS } from './glyphs';

	let { todos, today, sprintDays }: { todos: ProjectTodos; today: IsoDate; sprintDays?: IsoDate[] } = $props();

	const aspects = $derived(page.data.aspects as Aspect[]);
	const aspectOf = (aspectId: number) => aspects.find((a) => a.id === aspectId) ?? aspects[0];
	const total = $derived(todos.open.length + todos.planned.length + todos.done.length);

	let showDone = $state(false);
	const uid = $props.id();
</script>

<section aria-labelledby="{uid}-h">
	<h2 id="{uid}-h">Linked todos</h2>

	{#if total === 0}
		<p class="empty" data-testid="empty-state">
			No linked todos yet. Choose the IT aspect on a todo, then pick this project in the Project field.
		</p>
	{/if}

	{#each [{ key: 'open', label: 'Open', context: 'backlog', list: todos.open }, { key: 'planned', label: 'Planned', context: 'sprint', list: todos.planned }] as const as group (group.key)}
		{#if group.list.length}
			<div class="group" data-testid="project-todos-{group.key}">
				<h3>{group.label}<span class="count num">{group.list.length}</span></h3>
				<ul>
					{#each group.list as todo (todo.id)}
						<TodoRow {todo} aspect={aspectOf(todo.aspectId)} {today} context={group.context} {sprintDays} />
					{/each}
				</ul>
			</div>
		{/if}
	{/each}

	{#if todos.done.length}
		<div class="group" data-testid="project-todos-done">
			<h3>
				<button type="button" aria-expanded={showDone} onclick={() => (showDone = !showDone)}>
					<svg class="chev" class:open={showDone} viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS['chevron-right']} /></svg>
					Done<span class="count num">{todos.done.length}</span>
				</button>
			</h3>
			{#if showDone}
				<ul>
					{#each todos.done as todo (todo.id)}
						<TodoRow {todo} aspect={aspectOf(todo.aspectId)} {today} context="sprint" {sprintDays} />
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</section>

<style>
	section {
		margin-top: var(--space-8);
	}

	h2 {
		margin-bottom: var(--space-3);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--line);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
	}

	.group + .group {
		margin-top: var(--space-5);
	}

	h3 {
		display: flex;
		align-items: center;
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--line);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
	}

	h3 button {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: 0;
		border: 0;
		background: none;
		color: var(--ink-2);
		font-weight: inherit;
		text-align: left;
		cursor: pointer;
	}

	h3 button:hover {
		color: var(--ink);
	}

	.count {
		margin-left: auto;
		color: var(--ink-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
	}

	.chev {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: var(--ink-3);
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.chev.open {
		transform: rotate(90deg);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.empty {
		padding: var(--space-4) 0;
		color: var(--ink-3);
	}
</style>
