<script lang="ts">
	import AspectIcon from '$lib/components/ui/AspectIcon.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import QuickAdd from '$lib/components/todo/QuickAdd.svelte';
	import SprintPrompt from '$lib/components/todo/SprintPrompt.svelte';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import type { Id } from '$lib/types';

	let { data } = $props();

	const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

	// Review-required means the sprint's week is over, so today is no longer one of its days.
	const inSprint = $derived(data.phase === 'running' || data.phase === 'review-available');
	// On Sunday next week's sprint can already be running, and today is not one of its days.
	const onSprintDay = $derived(data.sprintDays.includes(data.today));
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

{#if data.phase !== 'running'}
	<div class="prompt"><SprintPrompt phase={data.phase} /></div>
{/if}

{#if inSprint}
	{#if onSprintDay}
		<div class="quick">
			<QuickAdd aspects={data.aspects} target={{ kind: 'day', day: data.today }} />
		</div>
	{/if}
	{#if groups.length === 0 && data.overdue.length === 0}
		<p class="empty" data-testid="empty-state">
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.sun} /></svg>
			<span>Nothing planned for today. The <a href="/sprint?view=week">week view</a> has the rest of your sprint.</span>
		</p>
	{/if}
{/if}

{#if data.overdue.length}
	<section class="group" data-testid="overdue-group" aria-labelledby="group-overdue">
		<h2 id="group-overdue" class="late">Overdue<span class="count num">{data.overdue.length}</span></h2>
		<ul>
			{#each data.overdue as todo (todo.id)}
				<!-- Done belongs to the running sprint, so backlog and draft todos are offered the sprint instead of a checkbox. -->
				{#if todo.sprintId === data.activeSprintId}
					<TodoRow {todo} aspect={aspectOf(todo.aspectId)} today={data.today} context="today" mixed />
				{:else}
					<TodoRow
						{todo}
						aspect={aspectOf(todo.aspectId)}
						today={data.today}
						context="backlog"
						sprintDays={todo.sprintId === null && inSprint ? data.sprintDays : undefined}
						mixed
					/>
				{/if}
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

	.prompt,
	.quick {
		margin-bottom: var(--space-7);
	}

	.empty {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
		color: var(--ink-2);
	}

	.empty svg {
		width: var(--icon-md);
		height: var(--icon-md);
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.empty a {
		font-weight: var(--weight-medium);
		text-decoration: none;
	}

	.empty a:hover {
		text-decoration: underline;
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
