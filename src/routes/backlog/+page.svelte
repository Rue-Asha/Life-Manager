<script lang="ts">
	import AspectIcon from '$lib/components/ui/AspectIcon.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import QuickAdd from '$lib/components/todo/QuickAdd.svelte';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';

	let { data } = $props();

	const groups = $derived(
		data.aspects
			.map((aspect) => ({ aspect, todos: data.todos.filter((t) => t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0)
	);
</script>

<svelte:head>
	<title>Backlog · Life Manager</title>
</svelte:head>

<PageHeader title="Backlog" icon="inbox" />

<div class="quick">
	<QuickAdd aspects={data.aspects} target={{ kind: 'backlog' }} defaultAspectId={data.aspectId ?? undefined} />
</div>

{#each groups as { aspect, todos } (aspect.id)}
	<section class="group" data-testid="aspect-group-{aspect.id}" aria-labelledby="group-{aspect.id}">
		<h2 id="group-{aspect.id}">
			<AspectIcon icon={aspect.icon} color={aspect.color} />{aspect.name}
			<span class="count num">{todos.length}</span>
		</h2>
		<ul>
			{#each todos as todo (todo.id)}
				<TodoRow {todo} {aspect} today={data.today} context="backlog" sprintDays={data.sprintDays ?? undefined} />
			{/each}
		</ul>
	</section>
{/each}

<style>
	.quick {
		margin-bottom: var(--space-7);
	}

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
