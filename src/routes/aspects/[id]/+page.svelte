<script lang="ts">
	import { flip } from 'svelte/animate';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import RailLayout from '$lib/components/shell/RailLayout.svelte';
	import QuickAdd from '$lib/components/todo/QuickAdd.svelte';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import { flipOpts, receive, send } from '$lib/motion';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let adding = $state(false);

	const aspect = $derived(data.aspect);
	const sprintDays = $derived(data.sprintDays ?? undefined);
	const sprintList = $derived(data.sprintTodos);
	const backlogList = $derived(data.backlog);
	const progress = $derived(
		data.progress && { done: sprintList.filter((t) => t.status === 'done').length, total: sprintList.length }
	);
	const noSprint = $derived(data.phase === 'none' || data.phase === 'planning');
</script>

<svelte:head>
	<title>{aspect.name} · Life Manager</title>
</svelte:head>

{#snippet details()}
	<dl class="details">
		<div>
			<dt>Colour</dt>
			<dd>
				<i class="swatch" style:background={ASPECT_COLORS[aspect.color].fg}></i>
				<span data-testid="aspect-color">{ASPECT_COLORS[aspect.color].label}</span>
			</dd>
		</div>
		<div>
			<dt>This sprint</dt>
			<dd>
				{#if progress}
					<ProgressBar done={progress.done} total={progress.total} color={aspect.color} />
				{:else}
					No sprint running
				{/if}
			</dd>
		</div>
		<div>
			<dt>Backlog</dt>
			<dd class="num" data-testid="backlog-count">{backlogList.length} in backlog</dd>
		</div>
	</dl>
{/snippet}

<RailLayout railTitle="Details" rail={details}>
	<PageHeader title={aspect.name} icon={aspect.icon} color={aspect.color} />

	<section class="section" data-testid="aspect-sprint" aria-labelledby="sprint-heading">
		<h2 id="sprint-heading">
			This sprint
			{#if progress}<ProgressBar done={progress.done} total={progress.total} color={aspect.color} />{/if}
		</h2>
		{#if noSprint}
			<p class="note">No sprint running. <a href="/sprint/plan">Plan the next sprint</a></p>
		{:else if sprintList.length === 0}
			<p class="note">Nothing from {aspect.name} in this sprint yet.</p>
		{/if}
		<div class="list">
			{#each sprintList as todo (todo.id)}
				<ul class="item" in:receive={{ key: todo.id }} out:send={{ key: todo.id }} animate:flip={flipOpts()}>
					<TodoRow {todo} {aspect} today={data.today} context="sprint" {sprintDays} />
				</ul>
			{/each}
		</div>
	</section>

	<section class="section" data-testid="aspect-backlog" aria-labelledby="backlog-heading">
		<h2 id="backlog-heading">
			Backlog
			<span class="count num">{backlogList.length}</span>
		</h2>
		<div class="quick">
			<QuickAdd aspects={data.aspects} target={{ kind: 'backlog' }} defaultAspectId={aspect.id} bind:open={adding} />
		</div>
		{#if backlogList.length === 0 && sprintList.length === 0}
			<p class="empty" data-testid="empty-state">
				Nothing in {aspect.name} yet.
				<button type="button" onclick={() => (adding = true)}>Add a todo</button>
				to start.
			</p>
		{:else if backlogList.length === 0}
			<p class="note">Nothing from {aspect.name} in the backlog.</p>
		{/if}
		<div class="list">
			{#each backlogList as todo (todo.id)}
				<ul class="item" in:receive={{ key: todo.id }} out:send={{ key: todo.id }} animate:flip={flipOpts()}>
					<TodoRow {todo} {aspect} today={data.today} context="backlog" {sprintDays} />
				</ul>
			{/each}
		</div>
	</section>
</RailLayout>

<style>
	.section {
		border-radius: var(--radius-md);
		transition: background-color var(--dur-fast) var(--ease-out);
	}

	.section + .section {
		margin-top: var(--space-8);
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--line);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
	}

	h2 :global([data-testid='progress']) {
		margin-left: auto;
	}

	.count {
		margin-left: auto;
		color: var(--ink-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
	}

	.quick {
		margin: var(--space-3) 0;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.note {
		padding: var(--space-3) 0;
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.empty {
		padding: var(--space-8) var(--space-4);
		color: var(--ink-3);
		text-align: center;
	}

	a,
	.empty button {
		padding: 0;
		border: 0;
		background: none;
		color: var(--accent);
		font: inherit;
		font-weight: var(--weight-medium);
		text-decoration: none;
		cursor: pointer;
	}

	a:hover,
	.empty button:hover {
		text-decoration: underline;
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		margin: 0;
	}

	dt {
		margin-bottom: var(--space-1);
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	dd {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0;
	}

	.swatch {
		width: 12px;
		height: 12px;
		border-radius: var(--radius-pill);
	}
</style>
