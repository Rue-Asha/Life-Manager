<script lang="ts">
	import AspectIcon from '$lib/components/ui/AspectIcon.svelte';
	import FieldCard from '$lib/components/ui/FieldCard.svelte';
	import FieldRow from '$lib/components/ui/FieldRow.svelte';
	import ListGroup from '$lib/components/ui/ListGroup.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import SummaryHeader from '$lib/components/ui/SummaryHeader.svelte';
	import RailLayout from '$lib/components/shell/RailLayout.svelte';
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
			.map((aspect) => ({ aspect, todos: [...data.todos, ...data.dueToday].filter((t) => t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0)
	);
	const sprintAspects = $derived(data.aspects.filter((a) => data.progress[a.id]));

	// The summary header counts what is still open on this page, and the sprint as a whole.
	const openToday = $derived(
		new Set([...data.todos, ...data.overdue, ...data.dueToday].filter((t) => t.status !== 'done').map((t) => t.id)).size
	);
	const sprintDone = $derived(sprintAspects.reduce((n, a) => n + data.progress[a.id].done, 0));
	const sprintTotal = $derived(sprintAspects.reduce((n, a) => n + data.progress[a.id].total, 0));
	const daysLeft = $derived(data.sprintDays.filter((d) => d > data.today).length);
	const weekdayName = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' });
</script>

<svelte:head>
	<title>Today · Life Manager</title>
</svelte:head>

{#snippet sprintLine()}
	Sprint <b>{sprintDone} / {sprintTotal}</b> done · <b>{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</b> left
{/snippet}

{#snippet sprintRail()}
	<h2 class="rail-title">This sprint<span class="num">{sprintDone} / {sprintTotal}</span></h2>
	{#if sprintAspects.length}
		<FieldCard>
			<ul>
				{#each sprintAspects as aspect (aspect.id)}
					<li>
						<FieldRow icon={aspect.icon} color={aspect.color}>
							<a href="/aspects/{aspect.id}" class="name">{aspect.name}</a>
							{#snippet end()}
								<ProgressBar done={data.progress[aspect.id].done} total={data.progress[aspect.id].total} color={aspect.color} />
							{/snippet}
						</FieldRow>
					</li>
				{/each}
			</ul>
		</FieldCard>
	{:else}
		<p class="rail-empty">Nothing in this sprint yet.</p>
	{/if}
{/snippet}

<RailLayout railTitle="This sprint" rail={inSprint ? sprintRail : undefined}>
	<PageHeader title="Today" subtitle={longDate.format(new Date(`${data.today}T00:00:00Z`))} />

	<SummaryHeader
		figure={String(openToday)}
		label="open today"
		context={inSprint ? `${weekdayName.format(new Date(`${data.today}T00:00:00Z`))} · this sprint` : undefined}
		line={inSprint ? sprintLine : undefined}
		segments={inSprint
			? sprintAspects.map((a) => ({ color: a.color, total: data.progress[a.id].total, done: data.progress[a.id].done }))
			: []}
	/>

	{#if data.phase !== 'running'}
		<div class="prompt"><SprintPrompt phase={data.phase} /></div>
	{/if}

	<div class="quick">
		{#if onSprintDay}
			<QuickAdd aspects={data.aspects} target={{ kind: 'day', day: data.today }} />
		{:else}
			<QuickAdd aspects={data.aspects} target={{ kind: 'backlog' }} defaultDueDate={data.today} />
		{/if}
	</div>

	{#if inSprint}
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
			<ListGroup>
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
			</ListGroup>
		</section>
	{/if}

	{#each groups as { aspect, todos } (aspect.id)}
		<section class="group" data-testid="aspect-group-{aspect.id}" aria-labelledby="group-{aspect.id}">
			<h2 id="group-{aspect.id}">
				<AspectIcon icon={aspect.icon} color={aspect.color} />{aspect.name}
				<span class="count num">{todos.length}</span>
			</h2>
			<ListGroup>
				<ul>
					{#each todos as todo (todo.id)}
						{#if todo.sprintId === null}
							<TodoRow
								{todo}
								{aspect}
								today={data.today}
								context="backlog"
								sprintDays={inSprint ? data.sprintDays : undefined}
							/>
						{:else}
							<TodoRow {todo} {aspect} today={data.today} context="today" />
						{/if}
					{/each}
				</ul>
			</ListGroup>
		</section>
	{/each}
</RailLayout>

<style>
	.prompt,
	.quick {
		margin-bottom: var(--space-6);
	}

	.empty {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: var(--radius-group);
		background: var(--surface);
		box-shadow: var(--shadow-card);
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
		margin-top: var(--space-6);
	}

	.group h2 {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
		padding: 0 var(--space-1);
		font-size: var(--text-md);
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

	.rail-title {
		display: flex;
		justify-content: space-between;
		margin-bottom: var(--space-3);
		color: var(--ink-2);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}

	.rail-title span {
		color: var(--ink-3);
		font-weight: var(--weight-regular);
	}

	.name {
		display: block;
		overflow: hidden;
		color: var(--ink);
		text-decoration: none;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name:hover {
		text-decoration: underline;
	}

	.rail-empty {
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
