<script lang="ts">
	import type { Aspect, IsoDate, Todo } from '$lib/types';
	import TodoRow from '../todo/TodoRow.svelte';
	import AspectIcon from '../ui/AspectIcon.svelte';

	let {
		todos,
		aspects,
		today,
		sprintDays
	}: { todos: Todo[]; aspects: Aspect[]; today: IsoDate; sprintDays: IsoDate[] } = $props();

	const groups = $derived(
		aspects
			.map((aspect) => ({ aspect, todos: todos.filter((t) => t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0)
	);
</script>

{#each groups as { aspect, todos } (aspect.id)}
	{@const open = todos.filter((t) => t.status !== 'done').length}
	<section class="group" data-testid="aspect-group-{aspect.id}" aria-labelledby="group-{aspect.id}">
		<h2 id="group-{aspect.id}">
			<AspectIcon icon={aspect.icon} color={aspect.color} />{aspect.name}
			<span class="count num" aria-label="{open} open">{open}</span>
		</h2>
		<ul>
			{#each todos as todo (todo.id)}
				<TodoRow {todo} {aspect} {today} context="sprint" {sprintDays} />
			{/each}
		</ul>
	</section>
{/each}

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

	.count {
		margin-left: auto;
		color: var(--ink-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
