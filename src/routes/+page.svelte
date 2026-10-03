<script lang="ts">
	import AspectIcon from '$lib/components/ui/AspectIcon.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import QuickAdd from '$lib/components/todo/QuickAdd.svelte';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import type { Id } from '$lib/types';

	let { data } = $props();

	const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

	// Review-required means the sprint's week is over, so today is no longer one of its days.
	const inSprint = $derived(data.phase === 'running' || data.phase === 'review-available');
	const aspectOf = (id: Id) => data.aspects.find((a) => a.id === id)!;
	const groups = $derived(
		data.aspects
			.map((aspect) => ({ aspect, todos: data.todos.filter((t) => t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0)
	);
</script>

<svelte:head>
	<title>Today · Life Manager</title>
</svelte:head>

<PageHeader title="Today" icon="sun" />
<p class="date">{longDate.format(new Date(`${data.today}T00:00:00Z`))}</p>

{#if inSprint}
	<div class="quick">
		<QuickAdd aspects={data.aspects} target={{ kind: 'day', day: data.today }} />
	</div>
{/if}

{#if data.overdue.length}
	<section class="group" data-testid="overdue-group" aria-labelledby="group-overdue">
		<h2 id="group-overdue" class="late">Overdue<span class="count num">{data.overdue.length}</span></h2>
		<ul>
			{#each data.overdue as todo (todo.id)}
				<TodoRow {todo} aspect={aspectOf(todo.aspectId)} today={data.today} context="today" />
			{/each}
		</ul>
	</section>
{/if}

{#each groups as { aspect, todos } (aspect.id)}
	<section class="group" data-testid="aspect-group-{aspect.id}" aria-labelledby="group-{aspect.id}">
		<h2 id="group-{aspect.id}">
			<AspectIcon icon={aspect.icon} color={aspect.color} />{aspect.name}
			<span class="count num">{todos.length}</span>
		</h2>
		<ul>
			{#each todos as todo (todo.id)}
				<TodoRow {todo} {aspect} today={data.today} context="today" />
			{/each}
		</ul>
	</section>
{/each}

<style>
	.date {
		margin: calc(-1 * var(--space-5)) 0 var(--space-6);
		color: var(--ink-3);
	}

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

	.late,
	.late .count {
		color: var(--overdue);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
