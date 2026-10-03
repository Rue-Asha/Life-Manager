<script lang="ts">
	import AspectView from '$lib/components/sprint/AspectView.svelte';
	import ViewSwitch from '$lib/components/sprint/ViewSwitch.svelte';
	import QuickAdd from '$lib/components/todo/QuickAdd.svelte';
	import SprintPrompt from '$lib/components/todo/SprintPrompt.svelte';
	import { dateLabel, dayLabel } from '$lib/components/todo/format';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Sprint · Life Manager</title>
</svelte:head>

<PageHeader title="Sprint" icon="calendar-days">
	{#if data.sprintDays}
		<span class="range num">{dayLabel(data.sprintDays[0])} – {dateLabel(data.sprintDays[6])}</span>
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

	{#if data.todos.length === 0}
		<p class="empty" data-testid="empty-state">
			Nothing in this sprint yet. Add a todo above, or pull some in from the <a href="/backlog">backlog</a>.
		</p>
	{:else}
		<AspectView todos={data.todos} aspects={data.aspects} today={data.today} sprintDays={data.sprintDays} />
	{/if}
{/if}

<style>
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
