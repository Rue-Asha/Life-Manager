<script lang="ts">
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import RailLayout from '$lib/components/shell/RailLayout.svelte';
	import QuickAdd from '$lib/components/todo/QuickAdd.svelte';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import FieldCard from '$lib/components/ui/FieldCard.svelte';
	import FieldRow from '$lib/components/ui/FieldRow.svelte';
	import ListGroup from '$lib/components/ui/ListGroup.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import { submit, type ActionError } from '$lib/components/todo/form';
	import { draggableTodo, dropZone } from '$lib/dnd';
	import { flipOpts, receive, send } from '$lib/motion';
	import type { Id } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let adding = $state(false);

	const aspect = $derived(data.aspect);
	const sprintDays = $derived(data.sprintDays ?? undefined);

	// A dropped todo sits in its new section while the move saves, and travels back if it fails.
	let moved = $state<{ id: Id; to: 'sprint' | 'backlog' } | null>(null);
	let moveError = $state<string | null>(null);
	let addForm = $state<HTMLFormElement>();
	let backForm = $state<HTMLFormElement>();

	const all = $derived([...data.sprintTodos, ...data.backlog]);
	const sprintList = $derived(
		all.filter((t) => (moved?.id === t.id ? moved.to === 'sprint' : data.sprintTodos.includes(t)))
	);
	const backlogList = $derived(
		all.filter((t) => (moved?.id === t.id ? moved.to === 'backlog' : data.backlog.includes(t)))
	);
	const progress = $derived(
		data.progress && { done: sprintList.filter((t) => t.status === 'done').length, total: sprintList.length }
	);
	const noSprint = $derived(data.phase === 'none' || data.phase === 'planning');

	async function move(id: Id, to: 'sprint' | 'backlog') {
		moveError = null;
		moved = { id, to };
		await tick();
		(to === 'sprint' ? addForm : backForm)?.requestSubmit();
	}

	const settle = () => (moved = null);

	// A todo another tab already moved isn't worth a message: the reload shows where it went.
	function moveFailed(e: ActionError) {
		settle();
		if (e.error === 'not-found') invalidateAll();
		else moveError = e.error;
	}
</script>

<svelte:head>
	<title>{aspect.name} · Life Manager</title>
</svelte:head>

{#snippet details()}
	<h2 class="rail-title">Details</h2>
	<FieldCard>
		<FieldRow label="Colour" icon={aspect.icon} color={aspect.color}>
			<span class="colour">
				<i class="swatch" style:background={ASPECT_COLORS[aspect.color].fg}></i>
				<span data-testid="aspect-color">{ASPECT_COLORS[aspect.color].label}</span>
			</span>
		</FieldRow>
		<FieldRow label="This sprint" icon="calendar-days">
			{#if progress}
				<ProgressBar done={progress.done} total={progress.total} color={aspect.color} />
			{:else if data.phase === 'review-required'}
				Waiting for its review
			{:else}
				No sprint running
			{/if}
		</FieldRow>
		<FieldRow label="Backlog" icon="inbox">
			<span class="num" data-testid="backlog-count">{backlogList.length} in backlog</span>
		</FieldRow>
	</FieldCard>
{/snippet}

<form bind:this={addForm} method="POST" action="/todos?/addToSprint" hidden use:enhance={submit({ onsuccess: settle, onerror: moveFailed })}>
	<input type="hidden" name="id" value={moved?.id} />
</form>
<form bind:this={backForm} method="POST" action="/todos?/moveToBacklog" hidden use:enhance={submit({ onsuccess: settle, onerror: moveFailed })}>
	<input type="hidden" name="id" value={moved?.id} />
</form>

<RailLayout railTitle="Details" rail={details}>
	<PageHeader title={aspect.name} icon={aspect.icon} color={aspect.color} />

	<section
		class="section"
		data-testid="aspect-sprint"
		aria-labelledby="sprint-heading"
		use:dropZone={{ accepts: (p) => !!sprintDays && p.from === 'backlog', ondrop: (p) => move(p.id, 'sprint') }}
	>
		<h2 id="sprint-heading">
			This sprint
			{#if progress}<ProgressBar done={progress.done} total={progress.total} color={aspect.color} />{/if}
		</h2>
		{#if noSprint}
			<p class="note">No sprint running. <a href="/sprint/plan">Plan the next sprint</a></p>
		{:else if data.phase === 'review-required'}
			<p class="note" data-testid="review-note">
				This week’s sprint is over, so nothing can join it. <a href="/sprint/review">Review the sprint</a>
			</p>
		{/if}
		{#if moveError}
			<p class="error" role="alert">
				{#if moveError === 'review-required'}
					The sprint needs its review first. <a href="/sprint/review">Review</a>
				{:else}
					That didn’t work. Reload and try again.
				{/if}
			</p>
		{/if}
		{#if sprintDays && sprintList.length === 0}
			<p class="note">Nothing from {aspect.name} in this sprint yet.</p>
		{/if}
		<ListGroup>
			{#each sprintList as todo (todo.id)}
				<ul
					class="item"
					in:receive={{ key: todo.id }}
					out:send={{ key: todo.id }}
					animate:flip={flipOpts()}
					use:draggableTodo={{ id: todo.id, from: 'sprint', recurring: todo.recurring }}
				>
					<TodoRow {todo} {aspect} today={data.today} context="sprint" {sprintDays} />
				</ul>
			{/each}
		</ListGroup>
	</section>

	<section
		class="section"
		data-testid="aspect-backlog"
		aria-labelledby="backlog-heading"
		use:dropZone={{ accepts: (p) => p.from === 'sprint' && !p.recurring, ondrop: (p) => move(p.id, 'backlog') }}
	>
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
		<ListGroup>
			{#each backlogList as todo (todo.id)}
				<ul
					class="item"
					in:receive={{ key: todo.id }}
					out:send={{ key: todo.id }}
					animate:flip={flipOpts()}
					use:draggableTodo={{ id: todo.id, from: 'backlog', recurring: todo.recurring }}
				>
					<TodoRow {todo} {aspect} today={data.today} context="backlog" {sprintDays} />
				</ul>
			{/each}
		</ListGroup>
	</section>
</RailLayout>

<style>
	.section {
		border-radius: var(--radius-md);
		transition: background-color var(--dur-fast) var(--ease-out);
	}

	/* The drop slot is a hairline, not a filled target. */
	.section:global([data-over]) {
		background: var(--accent-soft);
		box-shadow: inset 0 0 0 1px var(--accent);
	}

	.item {
		border-radius: var(--radius-group);
	}

	.item:global([draggable='true']) {
		cursor: grab;
	}

	.item:global([data-dragging]) {
		background: var(--surface);
		box-shadow: var(--shadow-float);
	}

	.error {
		padding: var(--space-2) 0;
		color: var(--ink);
		font-size: var(--text-sm);
	}

	.section + .section {
		margin-top: var(--space-8);
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
		padding: 0 var(--space-1);
		font-size: var(--text-md);
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

	.rail-title {
		margin-bottom: var(--space-3);
		padding: 0;
		color: var(--ink-2);
		font-size: var(--text-sm);
	}

	.colour {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.swatch {
		width: 12px;
		height: 12px;
		border-radius: var(--radius-pill);
	}
</style>
