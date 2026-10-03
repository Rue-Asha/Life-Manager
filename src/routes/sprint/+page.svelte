<script lang="ts">
	import BacklogRail from '$lib/components/rail/BacklogRail.svelte';
	import RailLayout from '$lib/components/shell/RailLayout.svelte';
	import AspectView from '$lib/components/sprint/AspectView.svelte';
	import BoardView from '$lib/components/sprint/BoardView.svelte';
	import UnscheduledList from '$lib/components/sprint/UnscheduledList.svelte';
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

{#snippet rail()}
	{#if data.view === 'week'}
		<UnscheduledList todos={data.todos} sprintDays={data.sprintDays!} today={data.today} />
	{/if}
	<BacklogRail backlog={data.backlog} aspects={data.aspects} canAdd addAction="/todos?/addToSprint" />
{/snippet}

<RailLayout railTitle="Backlog" wide={data.view !== 'aspect'} rail={data.sprintDays ? rail : undefined}>
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

			<View todos={data.todos} aspects={data.aspects} today={data.today} sprintDays={data.sprintDays} />
		{/if}
	</div>
</RailLayout>

<style>
	/* Columns need more room than a list: board and week widen the page past the list measure.
	   From 1280 the rail layout sizes the content itself. */
	@media (max-width: 1279px) {
		:global(.page:has(.sprint.wide)) {
			max-width: calc(var(--content-max) * 1.5 + 2 * var(--gutter));
		}
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
</style>
