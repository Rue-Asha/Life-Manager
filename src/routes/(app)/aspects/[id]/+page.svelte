<!--
	Aspect page: this sprint, then the backlog with its own add line, and a Details card (hidden on phones as display-only data, stacked from
	768 px, a right column from 1280 px). A long list shows ten rows per group and folds the rest out in place. "New todo" opens the global
	quick add; the layout reads the aspect from the route, so no context needs setting here.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import { copy } from '$lib/copy';
	import AspectTitle from '$lib/components/aspects/AspectTitle.svelte';
	import Field from '$lib/components/field/Field.svelte';
	import Icon from '$lib/components/shell/Icon.svelte';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import { planError, submit, type ActionError } from '$lib/components/todo/form';
	import { draggableTodo, dropZone } from '$lib/dnd';
	import { arrive, flipOpts, leave } from '$lib/motion';
	import { openQuickAdd } from '$lib/shell/quick-add.svelte';
	import type { Id } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const SHOWN = 10;
	const aspect = $derived(data.aspect);
	const sprintDays = $derived(data.sprintDays ?? undefined);

	// A dropped todo sits in its new section while the move saves, and travels back if it fails.
	let moved = $state<{ id: Id; to: 'sprint' | 'backlog' } | null>(null);
	let moveError = $state<string | null>(null);
	let addForm = $state<HTMLFormElement>();
	let backForm = $state<HTMLFormElement>();

	const all = $derived([...data.sprintTodos, ...data.backlog]);
	const sprintList = $derived(all.filter((t) => (moved?.id === t.id ? moved.to === 'sprint' : data.sprintTodos.includes(t))));
	const backlogList = $derived(all.filter((t) => (moved?.id === t.id ? moved.to === 'backlog' : data.backlog.includes(t))));
	const done = $derived(sprintList.filter((t) => t.status === 'done').length);
	const noSprint = $derived(data.phase === 'none' || data.phase === 'planning');
	const progress = $derived(
		data.progress
			? sprintList.length
				? `${done} / ${sprintList.length}`
				: 'Not in this sprint'
			: data.phase === 'review-required'
				? 'Waiting for its review'
				: 'No sprint running'
	);

	let allSprint = $state(false);
	let allBacklog = $state(false);
	const sprintShown = $derived(allSprint ? sprintList : sprintList.slice(0, SHOWN));
	const backlogShown = $derived(allBacklog ? backlogList : backlogList.slice(0, SHOWN));

	async function move(id: Id, to: 'sprint' | 'backlog') {
		moveError = null;
		moved = { id, to };
		await tick();
		(to === 'sprint' ? addForm : backForm)?.requestSubmit();
	}

	const settled = () => (moved = null);

	// A todo another tab already moved isn't worth a message: the reload shows where it went.
	function moveFailed(e: ActionError) {
		settled();
		if (e.error === 'not-found') invalidateAll();
		else moveError = e.error;
	}

	let title = $state('');
	let addError = $state<string | null>(null);
	function addFailed(e: ActionError) {
		addError = e.error === 'required' ? copy.quickAdd.missingTitle : (planError(e) ?? copy.errors.addTodo);
	}
	function added() {
		title = '';
		addError = null;
	}
</script>

<svelte:head>
	<title>{aspect.name} · Life Manager</title>
</svelte:head>

{#snippet more(all: boolean, n: number, toggle: () => void)}
	<div class="more" role="listitem">
		<Button size="s" type="button" aria-expanded={all} onclick={toggle}>
			{all ? copy.today.showFewer : copy.today.showAll(n)}
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={UI_ICONS['chevron-down']} /></svg>
		</Button>
	</div>
{/snippet}

<form bind:this={addForm} method="POST" action="/todos?/addToSprint" hidden use:enhance={submit({ onsuccess: settled, onerror: moveFailed })}>
	<input type="hidden" name="id" value={moved?.id} />
</form>
<form bind:this={backForm} method="POST" action="/todos?/moveToBacklog" hidden use:enhance={submit({ onsuccess: settled, onerror: moveFailed })}>
	<input type="hidden" name="id" value={moved?.id} />
</form>

<div class="screen-head">
	<div class="screen-lead">
		<ul class="kicker"><li>Aspect</li></ul>
		<div class="title">
			<span class="nav-tile" data-color={aspect.color} aria-hidden="true"><Icon aspect={aspect.icon} size={22} /></span>
			<AspectTitle name={aspect.name} />
		</div>
		<div class="head-actions">
			<Button aria-haspopup="dialog" onclick={(e) => openQuickAdd(e.currentTarget)}><Icon name="plus" size={18} />New todo</Button>
		</div>
	</div>
</div>

<div class="screen-body" data-settle>
	<div class="split">
		<div class="main">
			{#if sprintList.length === 0 && backlogList.length === 0}
				<EmptyState title={copy.empty.aspect(aspect.name).heading} body={copy.empty.aspect(aspect.name).body}>
					{#snippet action()}
						<Button onclick={(e) => openQuickAdd(e.currentTarget)}><Icon name="plus" size={18} />{copy.sprintViews.addTodo}</Button>
					{/snippet}
				</EmptyState>
			{:else}
				<section
					class="card group"
					aria-labelledby="sprint-h"
					use:dropZone={{ accepts: (p) => !!sprintDays && p.from === 'backlog', ondrop: (p) => move(p.id, 'sprint') }}
				>
					<h2 class="gh" id="sprint-h">
						<span class="toggle"><span class="name">This sprint</span><span class="count num">{data.progress && sprintList.length ? `${done} / ${sprintList.length}` : 0}</span></span>
					</h2>
					<div class="list" role="list" class:unfolded={allSprint}>
						{#if moveError}
							<div class="msg" role="listitem">
								<p class="alert" role="alert">
									{#if moveError === 'review-required'}
										The sprint needs its review first. <a href="/sprint/review">Review</a>
									{:else}
										{copy.errors.moveTodo}
									{/if}
								</p>
							</div>
						{/if}
						{#each sprintShown as todo (todo.id)}
							<div class="trow" role="none" in:arrive={{ key: todo.id }} out:leave={{ key: todo.id }} animate:flip={flipOpts()} use:draggableTodo={{ id: todo.id, from: 'sprint', recurring: todo.recurring }}>
								<TodoRow {todo} {aspect} today={data.today} context="sprint" {sprintDays} flat />
							</div>
						{:else}
							<div class="msg" role="listitem">
								{#if noSprint}
									No sprint running. <a href="/sprint/plan">Plan the next sprint</a>
								{:else if data.phase === 'review-required'}
									This week’s sprint is over, so nothing can join it. <a href="/sprint/review">Review the sprint</a>
								{:else}
									Nothing from <span data-user>{aspect.name}</span> in this sprint yet.
								{/if}
							</div>
						{/each}
						{#if sprintList.length > SHOWN}{@render more(allSprint, sprintList.length, () => (allSprint = !allSprint))}{/if}
					</div>
				</section>

				<section
					class="card group"
					aria-labelledby="backlog-h"
					use:dropZone={{ accepts: (p) => p.from === 'sprint' && !p.recurring, ondrop: (p) => move(p.id, 'backlog') }}
				>
					<h2 class="gh" id="backlog-h">
						<span class="toggle"><span class="name">Backlog</span><span class="count num">{backlogList.length}</span></span>
					</h2>
					<div class="list" role="list" class:unfolded={allBacklog}>
						<div class="add" role="listitem">
							<form class="add-form" method="POST" action="/todos?/create" aria-label={copy.sprintViews.addTodoTo(aspect.name)} use:enhance={submit({ onerror: addFailed, onsuccess: added })}>
								<input type="hidden" name="aspectId" value={aspect.id} />
								<input type="hidden" name="priority" value="0" />
								<input type="hidden" name="target" value="backlog" />
								<div class="add-line">
									<div class="add-field">
										<Field label="Title" hideLabel name="title" placeholder={copy.today.addTitle} autocomplete="off" enterkeyhint="done" error={addError ?? undefined} bind:value={title} />
									</div>
									<Button type="submit"><Icon name="plus" size={18} />Add</Button>
								</div>
								<p class="dest">{copy.aspects.toBacklogAspect} <span data-user>{aspect.name}</span></p>
							</form>
						</div>
						{#each backlogShown as todo (todo.id)}
							<div class="trow" role="none" in:arrive={{ key: todo.id }} out:leave={{ key: todo.id }} animate:flip={flipOpts()} use:draggableTodo={{ id: todo.id, from: 'backlog', recurring: todo.recurring }}>
								<TodoRow {todo} {aspect} today={data.today} context="backlog" {sprintDays} />
							</div>
						{:else}
							<div class="msg" role="listitem">Nothing from <span data-user>{aspect.name}</span> in the backlog</div>
						{/each}
						{#if backlogList.length > SHOWN}{@render more(allBacklog, backlogList.length, () => (allBacklog = !allBacklog))}{/if}
					</div>
				</section>
			{/if}
		</div>

		<aside class="side">
			<section class="card side-card" data-surface="inverse" aria-label="Details">
				<div class="card-head"><h2>Details</h2></div>
				<dl class="dl">
					<dt class="ruled">Colour</dt>
					<dd><span class="dot" style:--aspect={ASPECT_COLORS[aspect.color].fg} aria-hidden="true"></span>{ASPECT_COLORS[aspect.color].label}</dd>
					<dt class="ruled">This sprint</dt>
					<dd>{progress}</dd>
					<dt class="ruled">Backlog</dt>
					<dd>{backlogList.length} in backlog</dd>
				</dl>
			</section>
		</aside>
	</div>
</div>

<style>
	.head-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
	}
	@media (max-width: 767px) {
		.head-actions {
			display: none;
		}
	}
	/* the tile sits on the title's first line, not mid-height beside a three-line name */
	.title {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		min-inline-size: 0;
		max-inline-size: 100%;
	}
	.title .nav-tile {
		inline-size: var(--space-10);
		block-size: var(--space-10);
		margin-block-start: calc((var(--type-display-xl-size) * var(--type-display-xl-line) - var(--space-10)) / 2);
	}
	@media (max-width: 767px) {
		.title .nav-tile {
			margin-block-start: calc((var(--type-display-xl-size-compact) * var(--type-display-xl-line) - var(--space-10)) / 2);
		}
	}

	/* ---------- Main column plus the Details card ---------- */
	.split {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-4);
		align-items: start;
		min-inline-size: 0;
	}
	.main {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-4);
		min-inline-size: 0;
	}
	.side {
		display: none;
		min-inline-size: 0;
	}
	@media (min-width: 768px) {
		.side {
			display: block;
		}
	}
	/* Below 1280 the card sits before the lists, as on Today; its three short facts size to their content, not the full width */
	@media (min-width: 768px) and (max-width: 1279px) {
		.side {
			order: -1;
			justify-self: start;
			inline-size: max-content;
			min-inline-size: min(100%, 18rem);
			max-inline-size: 100%;
		}
	}
	@media (min-width: 1280px) {
		.split {
			grid-template-columns: minmax(0, 1fr) 22rem;
		}
		.side {
			position: sticky;
			inset-block-start: var(--space-4);
		}
	}
	.side-card {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-5) var(--space-3) var(--space-3);
		min-inline-size: 0;
	}
	.side-card .card-head {
		padding-inline: var(--space-2);
	}
	.dl {
		display: grid;
		gap: var(--space-1);
		margin: 0;
		padding-inline: var(--space-2);
	}
	.dl dt {
		margin-block-start: var(--space-2);
	}
	.dl dd {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0;
		font-size: var(--type-body-size);
		line-height: var(--type-body-line);
		overflow-wrap: anywhere;
	}
	.dot {
		flex: none;
		inline-size: var(--space-2-5);
		block-size: var(--space-2-5);
		border-radius: var(--radius-round);
		background: var(--aspect);
	}

	/* ---------- Groups ---------- */
	.group {
		display: grid;
		padding: var(--space-2);
		min-inline-size: 0;
		transition: outline-color var(--motion-quick) var(--ease-out);
	}
	.gh {
		margin: 0;
		font-family: var(--font-ui);
		font-size: inherit;
		line-height: inherit;
		font-weight: inherit;
	}
	.toggle {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-block-size: var(--target-touch);
		padding: 0 var(--space-3);
	}
	.name {
		min-inline-size: 0;
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
		font-weight: var(--weight-semibold);
	}
	.count {
		flex: none;
		font-size: var(--type-body-s-size);
		color: var(--ink-secondary);
		font-variant-numeric: var(--numeric-figures);
	}
	.list {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	/* A hairline above every row but the first; a row is a component's own li, in a box FLIP can move. */
	.trow {
		position: relative;
	}
	.trow + .trow::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		border-top: var(--stroke-hairline) solid var(--hairline);
		pointer-events: none;
	}
	/* As signed, a backlog row's title sits 12 px in from the card, not on the heading's edge. */
	.trow > :global(.row.bare) {
		padding-inline-start: var(--space-1);
	}
	.trow:global([draggable='true']) {
		cursor: grab;
	}
	.trow:global([data-lifted]) {
		background: var(--surface-raised);
		box-shadow: var(--elevation-menu);
		border-radius: var(--radius-item);
	}
	.trow:global([data-dragging]) {
		outline: var(--stroke-rule) dashed var(--edge-control);
		outline-offset: calc(-1 * var(--stroke-rule));
		border-radius: var(--radius-item);
	}
	.trow:global([data-dragging]) > :global(*) {
		opacity: 0;
	}
	:global(html[data-drag]) .group:global([data-droppable]) {
		outline: var(--stroke-rule) dashed var(--edge-control);
		outline-offset: calc(-1 * var(--space-0-5));
	}
	:global(html[data-drag]) .group:global([data-droppable][data-over]) {
		outline-style: solid;
		outline-color: var(--ink);
		outline-width: var(--stroke-strong);
		background-color: var(--accent-soft);
	}
	/* The rows "Show all" brings in ease up and in; hiding them again is instant. */
	.unfolded > .trow:nth-child(n + 12) {
		animation: unfold var(--motion-quick) var(--ease-out) backwards;
	}
	@keyframes unfold {
		from {
			opacity: 0;
			transform: translateY(var(--space-1));
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.unfolded > .trow:nth-child(n + 12) {
			animation-name: unfold-fade;
		}
		@keyframes unfold-fade {
			from {
				opacity: 0;
			}
		}
	}
	.more {
		display: flex;
		padding: var(--space-2) var(--space-2) var(--space-1);
		box-shadow: var(--rule-above);
	}
	.more :global(svg) {
		transition: rotate var(--motion-quick) var(--ease-out);
	}
	.more :global(button[aria-expanded='true'] svg) {
		rotate: 180deg;
	}
	@media (prefers-reduced-motion: reduce) {
		.more :global(svg) {
			transition: none;
		}
	}
	.msg {
		padding: var(--space-3);
		color: var(--ink-secondary);
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
		overflow-wrap: anywhere;
	}
	.msg a {
		display: inline-flex;
		align-items: center;
		min-block-size: var(--target-touch);
		color: var(--ink);
		text-underline-offset: 0.25em;
	}
	.alert {
		margin: 0;
		color: var(--danger);
	}

	/* ---------- The Backlog's own add line ---------- */
	.add-form {
		display: grid;
		gap: var(--space-2);
		padding: var(--space-4);
		min-inline-size: 0;
	}
	.add-line {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
	}
	.add-field {
		flex: 1;
		min-inline-size: 0;
	}
	.add-field :global(input) {
		min-inline-size: 0;
	}
	.add-line > :global(.btn) {
		flex: none;
	}
	.dest {
		margin: 0;
		padding-inline: var(--space-1);
		font-size: var(--type-caption-size);
		line-height: var(--type-caption-line);
		color: var(--ink-secondary);
		overflow-wrap: anywhere;
	}
</style>
