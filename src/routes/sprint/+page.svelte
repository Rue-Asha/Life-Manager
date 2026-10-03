<script lang="ts">
	import AspectView from '$lib/components/sprint/AspectView.svelte';
	import BoardView from '$lib/components/sprint/BoardView.svelte';
	import ViewSwitch from '$lib/components/sprint/ViewSwitch.svelte';
	import WeekView from '$lib/components/sprint/WeekView.svelte';
	import QuickAdd from '$lib/components/todo/QuickAdd.svelte';
	import SprintPrompt from '$lib/components/todo/SprintPrompt.svelte';
	import { dateLabel, dayLabel } from '$lib/components/todo/format';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const VIEWS = { aspect: AspectView, board: BoardView, week: WeekView };
	const View = $derived(VIEWS[data.view]);
</script>

<svelte:head>
	<title>Sprint · Life Manager</title>
</svelte:head>

<div class="sprint" class:wide={data.sprintDays && data.view !== 'aspect'}>
	<PageHeader title="Sprint" icon="calendar-days">
		{#if data.sprintDays}
			<span class="range num" data-testid="sprint-week">{dayLabel(data.sprintDays[0])} – {dateLabel(data.sprintDays[6])}</span>
		{/if}
	</PageHeader>

	{#if data.phase !== 'running'}
		<div class="prompt"><SprintPrompt phase={data.phase} /></div>
	{/if}

	{#if data.sprintDays}
		<div class="bar"><ViewSwitch view={data.view} /></div>

		{#if data.view !== 'week'}
			<div class="quick"><QuickAdd aspects={data.aspects} target={{ kind: 'sprint' }} /></div>
		{/if}

		{#if data.todos.length === 0 && data.view === 'aspect'}
			<p class="empty" data-testid="empty-state">
				Nothing in this sprint yet. Add a todo above, or pull some in from the <a href="/backlog">backlog</a>.
			</p>
		{:else}
			<View todos={data.todos} aspects={data.aspects} today={data.today} sprintDays={data.sprintDays} />
		{/if}
	{/if}
</div>

<style>
	/* Columns need more room than a list: board and week widen the page past the list measure. */
	:global(.page:has(.sprint.wide)) {
		max-width: calc(var(--content-max) * 1.5 + 2 * var(--gutter));
	}

	.range {
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.prompt,
	.bar {
		margin-bottom: var(--space-5);
	}

	.quick {
		margin-bottom: var(--space-6);
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
