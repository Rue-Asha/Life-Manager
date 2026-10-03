<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import BacklogRail from '$lib/components/rail/BacklogRail.svelte';
	import RailLayout from '$lib/components/shell/RailLayout.svelte';
	import AspectView from '$lib/components/sprint/AspectView.svelte';
	import BoardView from '$lib/components/sprint/BoardView.svelte';
	import ManageSheet from '$lib/components/sprint/ManageSheet.svelte';
	import UnscheduledList from '$lib/components/sprint/UnscheduledList.svelte';
	import ViewSwitch from '$lib/components/sprint/ViewSwitch.svelte';
	import WeekView from '$lib/components/sprint/WeekView.svelte';
	import QuickAdd from '$lib/components/todo/QuickAdd.svelte';
	import SprintPrompt from '$lib/components/todo/SprintPrompt.svelte';
	import { dateLabel, dayLabel } from '$lib/components/todo/format';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import type { AspectProgress, Id, Todo } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const VIEWS = { board: BoardView, week: WeekView };

	// A move shows at once, so the todo travels before the reload confirms it; a refused move
	// drops out of here and travels back.
	let moves = $state<Record<Id, 'sprint' | 'backlog'>>({});
	let failure = $state<string | null>(null);

	const unplaced = (t: Todo): Todo => ({ ...t, status: 'todo', day: null });
	const todos = $derived([
		...data.todos.filter((t) => moves[t.id] !== 'backlog'),
		...data.backlog.filter((t) => moves[t.id] === 'sprint').map(unplaced)
	]);
	const backlog = $derived([
		...data.backlog.filter((t) => moves[t.id] !== 'sprint'),
		...data.todos.filter((t) => moves[t.id] === 'backlog').map(unplaced)
	]);

	// From the shown list, so counts change with the motion instead of after the reload.
	const progress = $derived.by(() => {
		const byAspect: Record<Id, AspectProgress> = {};
		for (const t of todos) {
			const p = (byAspect[t.aspectId] ??= { done: 0, total: 0 });
			p.total++;
			if (t.status === 'done') p.done++;
		}
		return byAspect;
	});

	async function move(id: Id, to: 'sprint' | 'backlog') {
		moves[id] = to;
		failure = null;
		const body = new FormData();
		body.set('id', String(id));
		const response = await fetch(to === 'sprint' ? '/todos?/addToSprint' : '/todos?/moveToBacklog', {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		});
		const result = deserialize(await response.text());
		// A todo another tab already moved isn't worth a message: the reload shows where it went.
		if (result.type === 'failure' && result.data?.error !== 'not-found') failure = String(result.data?.error);
		else await invalidateAll();
		delete moves[id];
	}
</script>

<svelte:head>
	<title>Sprint · Life Manager</title>
</svelte:head>

{#snippet rail()}
	{#if data.view === 'week'}
		<UnscheduledList {todos} sprintDays={data.sprintDays!} today={data.today} />
	{/if}
	<BacklogRail
		{backlog}
		aspects={data.aspects}
		{progress}
		canAdd
		addAction="/todos?/addToSprint"
		onadd={(id) => move(id, 'sprint')}
		onreturn={(id) => move(id, 'backlog')}
	/>
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
			<div class="bar">
				<ViewSwitch view={data.view} />
				<ManageSheet {backlog} aspects={data.aspects} {progress} onadd={(id) => move(id, 'sprint')} />
			</div>

			{#if data.view !== 'week'}
				<div class="quick"><QuickAdd aspects={data.aspects} target={{ kind: 'sprint' }} /></div>
			{/if}

			{#if failure}
				<p class="error" role="alert">
					{#if failure === 'review-required'}
						The sprint needs its review first. <a href="/sprint/review">Review</a>
					{:else}
						That didn’t work. Reload and try again.
					{/if}
				</p>
			{/if}

			{#if data.view === 'aspect'}
				<AspectView
					{todos}
					aspects={data.aspects}
					today={data.today}
					sprintDays={data.sprintDays}
					onadd={(id) => move(id, 'sprint')}
				/>
			{:else}
				{@const View = VIEWS[data.view]}
				<View {todos} aspects={data.aspects} today={data.today} sprintDays={data.sprintDays} />
			{/if}
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

	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.quick {
		margin-bottom: var(--space-6);
	}

	.error {
		margin-bottom: var(--space-5);
		color: var(--ink);
		font-size: var(--text-sm);
	}

	.error a {
		color: var(--accent);
		font-weight: var(--weight-medium);
		text-decoration: none;
	}

	.error a:hover {
		text-decoration: underline;
	}
</style>
