<script lang="ts">
	import { onDestroy, tick, type Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { beforeNavigate, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { MediaQuery } from 'svelte/reactivity';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import { plannedLabel } from '$lib/slot';
	import { isOverdue } from '$lib/todo-utils';
	import type { Aspect, ClassRef, IsoDate, ProjectRef, Todo } from '$lib/types';
	import ClassBadge from '../uni/ClassBadge.svelte';
	import { UI_ICONS } from '../ui/icons';
	import Button from '../ui/Button.svelte';
	import Toast from '../ui/Toast.svelte';
	import DayPicker from './DayPicker.svelte';
	import StatusControl from './StatusControl.svelte';
	import TodoEditor from './TodoEditor.svelte';
	import { submit, type ActionError } from './form';
	import { dueLabel } from './format';

	let {
		todo,
		aspect,
		today,
		context,
		sprintDays,
		mixed = false,
		readonly = false,
		variant = 'row',
		extra
	}: {
		todo: Todo;
		aspect: Aspect;
		today: IsoDate;
		context: 'backlog' | 'sprint' | 'today' | 'planning';
		sprintDays?: IsoDate[];
		mixed?: boolean;
		// An archived class's rows: shown, but nothing on them can be changed.
		readonly?: boolean;
		// Board cards (`card`) and desktop week chips (`chip`) show less; the editor still shows everything.
		variant?: 'row' | 'card' | 'chip';
		// Takes the class badge's place: the class detail page passes it and already names the class.
		extra?: Snippet<[Todo]>;
	} = $props();

	// Ticking a backlog or draft todo done would strand it there: done belongs to a running sprint.
	const checkable = $derived(!readonly && (context === 'sprint' || context === 'today'));
	const movable = $derived(!readonly && context === 'sprint');
	const done = $derived(todo.status === 'done');
	const overdue = $derived(isOverdue(todo, today));
	// Where the row already shows the day (day control, Today's own day, a week column) the label is only the slot.
	const planned = $derived(
		todo.day === null
			? ''
			: plannedLabel(todo.day, todo.startTime, todo.endTime, variant === 'card' || !(movable || variant === 'chip' || (context === 'today' && todo.day === today)))
	);
	const checked = $derived(todo.checklist.filter((i) => i.done).length);

	// The editor's aspect picker needs every aspect; pages showing rows return them from load.
	const aspects = $derived((page.data.aspects as Aspect[] | undefined) ?? [aspect]);
	const project = $derived(
		todo.projectId === null ? undefined : (page.data.projects as ProjectRef[] | undefined)?.find((p) => p.id === todo.projectId)
	);
	const classRef = $derived(
		todo.classId === null ? undefined : (page.data.classes as ClassRef[] | undefined)?.find((c) => c.id === todo.classId)
	);
	const desktop = new MediaQuery('min-width: 768px');
	let editing = $state(false);
	const expanded = $derived(editing && desktop.current);
	const close = () => (editing = false);

	let menuOpen = $state(false);
	let actionsEl = $state<HTMLElement>();

	async function openMenu() {
		menuOpen = !menuOpen;
		await tick();
		if (menuOpen) actionsEl?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
	}

	function closeMenu(e: PointerEvent | KeyboardEvent) {
		if (!menuOpen) return;
		if (e instanceof KeyboardEvent ? e.key === 'Escape' : !actionsEl?.contains(e.target as Node)) menuOpen = false;
	}

	// A recurring instance has no backlog, so removing it deletes it. The delete waits behind the
	// undo toast and is posted when the toast expires or Rue leaves the page.
	let removal = $state<'none' | 'pending' | 'posted'>('none');

	function remove() {
		menuOpen = editing = false;
		removal = 'pending';
	}

	async function postRemoval(refresh = true) {
		if (removal !== 'pending') return;
		removal = 'posted';
		const body = new FormData();
		body.set('id', String(todo.id));
		await fetch('/todos?/removeFromSprint', {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' },
			keepalive: true
		});
		if (refresh) await invalidateAll();
	}

	// A todo another tab already moved isn't worth a message: the reload shows where it went.
	let addError = $state<string | null>(null);
	function addFailed(e: ActionError) {
		if (e.error === 'not-found') invalidateAll();
		else addError = e.error;
	}

	beforeNavigate(() => postRemoval(false));
	onDestroy(() => postRemoval(false));
</script>

{#snippet moves()}
	{#if context === 'backlog' && sprintDays}
		<form method="POST" action="/todos?/addToSprint" use:enhance={submit({ onerror: addFailed, onsuccess: close })}>
			<input type="hidden" name="id" value={todo.id} />
			<Button variant="secondary">Add to sprint</Button>
		</form>
	{:else if context === 'sprint' && todo.recurring}
		<Button variant="secondary" onclick={remove}>Remove from sprint</Button>
	{:else if context === 'sprint'}
		<form method="POST" action="/todos?/moveToBacklog" use:enhance={submit({ onsuccess: close })}>
			<input type="hidden" name="id" value={todo.id} />
			<Button variant="secondary">Move to backlog</Button>
		</form>
	{/if}
{/snippet}

{#snippet rowMenu()}
	{#if movable}
		<div class="actions" bind:this={actionsEl}>
			<button
				type="button"
				class="more"
				data-testid="row-actions"
				aria-label="More actions"
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				onclick={openMenu}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
				</svg>
			</button>
			{#if menuOpen}
				<div class="menu" role="menu" aria-label="Actions for {todo.title}">
					{#if todo.recurring}
						<button type="button" role="menuitem" onclick={remove}>Remove from sprint</button>
					{:else}
						<form method="POST" action="/todos?/moveToBacklog" use:enhance={submit()}>
							<input type="hidden" name="id" value={todo.id} />
							<button role="menuitem">Move to backlog</button>
						</form>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
{/snippet}

<svelte:window onpointerdown={closeMenu} onkeydown={closeMenu} />

{#if removal !== 'none'}
	<li class="removed">
		{#if removal === 'pending'}
			<Toast
				message="Removed “{todo.title}” from the sprint"
				actionLabel="Undo"
				onaction={() => (removal = 'none')}
				ontimeout={postRemoval}
			/>
		{/if}
	</li>
{:else}
<li
	class="row"
	class:checkable
	class:movable
	class:card={variant === 'card'}
	class:chip={variant === 'chip'}
	class:done
	class:expanded
	data-testid="todo-row"
	data-todo-id={todo.id}
	data-status={todo.status}
	data-day={todo.day ?? ''}
	data-overdue={overdue}
	style:--a={ASPECT_COLORS[aspect.color].fg}
>
	{#if expanded}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="scrim" onclick={close}></div>
	{/if}
	{#if editing}
		<TodoEditor {todo} {aspects} open={editing} onclose={close} actions={moves} />
	{/if}
	{#if !expanded}
		{#if checkable}
			<form method="POST" action="/todos?/toggleDone" use:enhance={submit()}>
				<input type="hidden" name="id" value={todo.id} />
				<button class="check" role="checkbox" aria-checked={done} aria-label="Done: {todo.title}">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.check} /></svg>
				</button>
			</form>
		{/if}

		<div class="main">
			{#if variant === 'chip' && planned}<span class="slot num" data-testid="planned-label">{planned}</span>{/if}
			{#if readonly}
				<span class="title">{todo.title}</span>
			{:else}
				<button type="button" class="title" onclick={() => (editing = true)}>{todo.title}</button>
			{/if}
			{#if variant === 'card'}
				<div class="meta">
					<span data-testid="aspect-tag"><i class="dot"></i>{aspect.name}</span>
					{#if todo.dueDate && !done}
						<span class="num" class:late={overdue}>
							{#if overdue}<span class="visually-hidden">Overdue,</span>{/if}
							{dueLabel(todo.dueDate, today)}
						</span>
					{/if}
					{#if planned}<span class="num" data-testid="planned-label">{planned}</span>{/if}
					{#if todo.priority && !done}
						<span class="prio" data-p={todo.priority} role="img" aria-label="Priority {todo.priority}">
							<i></i><i></i><i></i>
						</span>
					{/if}
				</div>
			{:else if variant === 'row'}
			<div class="meta">
				{#if mixed}
					<span><i class="dot"></i>{aspect.name}</span>
				{/if}
				{#if planned}<span class="num" data-testid="planned-label">{planned}</span>{/if}
				{#if extra}{@render extra(todo)}{:else if classRef}<ClassBadge {classRef} type={todo.type} />{/if}
				{#if todo.recurring}
					<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.repeat} /></svg>Recurring</span>
				{/if}
				{#if todo.checklist.length}
					<span aria-label="Checklist {checked} of {todo.checklist.length}">
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['list-checks']} /></svg>
						<span class="num">{checked}/{todo.checklist.length}</span>
					</span>
				{/if}
				{#if todo.notes}<span>Notes</span>{/if}
				{#if project}
					<span><a class="badge" href="/projects/{project.id}" data-testid="project-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.folder} /></svg>{project.name}</a></span>
				{/if}
			</div>
			{/if}
			{#if addError}
				<p class="add-error" role="alert">
					{#if addError === 'review-required'}
						The sprint needs its review first. <a href="/sprint/review">Review</a>
					{:else}
						That didn’t work. Reload and try again.
					{/if}
				</p>
			{/if}
		</div>

		{#if variant !== 'row'}
			<div class="end compact">
				{#if movable}
					<span class="status-slot"><StatusControl todoId={todo.id} status={todo.status} /></span>
					{@render rowMenu()}
				{/if}
			</div>
		{:else}
		<!-- Due, priority, day and status sit in fixed slots so they line up down a sprint list. -->
		<div class="end" class:slots={movable}>
			{#if todo.dueDate}
				<span class="due num" class:late={overdue}>
					{#if overdue}<span class="visually-hidden">Overdue,</span>{/if}
					{dueLabel(todo.dueDate, today)}
				</span>
			{/if}
			{#if todo.priority || movable}
				<span class="prio-slot">
					{#if todo.priority}
						<span class="prio" data-p={todo.priority} role="img" aria-label="Priority {todo.priority}">
							<i></i><i></i><i></i>
						</span>
					{/if}
				</span>
			{/if}
			{#if movable}
				<span class="day-slot">
					{#if sprintDays}<DayPicker todoId={todo.id} day={todo.day} {sprintDays} />{/if}
				</span>
				<span class="status-slot">
					<StatusControl todoId={todo.id} status={todo.status} />
				</span>
			{/if}
			{@render rowMenu()}
			{#if context === 'backlog' && sprintDays && !readonly}
				<form method="POST" action="/todos?/addToSprint" use:enhance={submit({ onerror: addFailed })}>
					<input type="hidden" name="id" value={todo.id} />
					<button class="add" aria-label="Add to sprint: {todo.title}" title="Add to sprint">
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>
						<span class="add-label">Add to sprint</span>
					</button>
				</form>
			{/if}
		</div>
		{/if}
	{/if}
</li>
{/if}

<style>
	/* No border of its own: rows sit in a ListGroup, which draws the card and the hairlines. */
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: start;
		column-gap: var(--space-3);
		min-height: var(--row-height);
		padding: 11px var(--space-4);
		transition: background-color var(--dur-fast) var(--ease-out);
	}

	.removed {
		display: contents;
	}

	.expanded {
		display: block;
		padding: 0;
	}

	.expanded:hover {
		background: none;
	}

	.scrim {
		position: fixed;
		inset: 0;
		z-index: 1;
		background: var(--scrim);
		animation: fade var(--dur-slow) var(--ease-out);
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
	}

	.checkable {
		grid-template-columns: var(--checkbox-size) minmax(0, 1fr) auto;
	}

	.row:hover {
		background: var(--hover);
	}

	form {
		display: contents;
	}

	.check {
		display: grid;
		place-items: center;
		width: var(--checkbox-size);
		height: var(--checkbox-size);
		margin-top: 2px;
		padding: 0;
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius-xs);
		background: var(--surface);
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-out),
			border-color var(--dur-fast) var(--ease-out);
	}

	.check svg {
		width: 12px;
		height: 12px;
		fill: none;
		stroke: var(--ink-on-accent);
		stroke-width: 3;
		stroke-linecap: round;
		stroke-linejoin: round;
		opacity: 0;
		transition: opacity var(--dur-fast) var(--ease-out);
	}

	.check[aria-checked='true'] {
		background: var(--a);
		border-color: var(--a);
	}

	.check[aria-checked='true'] svg {
		opacity: 1;
	}

	.main {
		min-width: 0;
	}

	.title {
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		background: none;
		text-align: left;
		cursor: default;
		overflow: hidden;
		line-height: var(--leading-snug);
		text-overflow: ellipsis;
		white-space: nowrap;
		text-decoration: line-through transparent;
		transition:
			color var(--dur-base) var(--ease-out),
			text-decoration-color var(--dur-base) var(--ease-out);
	}

	.done .title {
		color: var(--ink-3);
		text-decoration-color: var(--ink-3);
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-3);
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.meta:not(:empty) {
		margin-top: var(--space-1);
	}

	.meta span {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	.meta svg {
		width: 14px;
		height: 14px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-width: 0;
		color: var(--ink-3);
		overflow-wrap: anywhere;
		text-decoration: none;
	}

	.badge:hover {
		color: var(--ink);
	}

	.dot {
		width: 7px;
		height: 7px;
		border-radius: var(--radius-pill);
		background: var(--a);
	}

	.end {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 20px;
		color: var(--ink-2);
		font-size: var(--text-sm);
		white-space: nowrap;
	}

	.slots {
		margin-top: -2px;
	}

	.prio-slot {
		display: flex;
		width: 14px;
	}

	.slots .prio-slot {
		justify-content: flex-end;
	}

	.day-slot {
		display: flex;
		justify-content: flex-end;
		width: 52px;
	}

	.status-slot {
		width: 24px;
	}

	.add-error {
		margin-top: var(--space-1);
		color: var(--ink);
		font-size: var(--text-sm);
	}

	.add-error a {
		color: var(--accent);
		font-weight: var(--weight-medium);
		text-decoration: none;
	}

	.add-error a:hover {
		text-decoration: underline;
	}

	.late {
		color: var(--overdue);
		font-weight: var(--weight-medium);
	}

	.prio {
		display: inline-flex;
		align-items: flex-end;
		gap: 2px;
		height: 12px;
	}

	.prio i {
		display: block;
		width: 3px;
		border-radius: 1px;
		background: var(--line-strong);
	}

	.prio i:nth-child(1) {
		height: 5px;
	}

	.prio i:nth-child(2) {
		height: 8px;
	}

	.prio i:nth-child(3) {
		height: 12px;
	}

	.prio[data-p='1'] i,
	.prio[data-p='2'] i:nth-child(-n + 2),
	.prio[data-p='3'] i:nth-child(1) {
		background: var(--ink-2);
	}

	.add {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: 26px;
		margin: -3px 0;
		padding: 0 var(--space-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink-2);
		font-size: var(--text-sm);
		white-space: nowrap;
		cursor: pointer;
	}

	.add:hover {
		border-color: var(--ink-2);
		color: var(--ink);
	}

	.add svg {
		width: 14px;
		height: 14px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
	}

	/* With a mouse the row action waits for hover, laid over the row's end so it takes no room. */
	@media (hover: hover) and (pointer: fine) {
		.row {
			position: relative;
		}

		.add {
			position: absolute;
			top: 9px;
			right: var(--space-2);
			margin: 0;
			opacity: 0;
			transition: opacity var(--dur-fast) var(--ease-out);
		}

		.row:hover .add,
		.add:focus-visible {
			opacity: 1;
		}

		.more {
			opacity: 0;
			transition: opacity var(--dur-fast) var(--ease-out);
		}

		.row:hover .more,
		.more:focus-visible,
		.more[aria-expanded='true'] {
			opacity: 1;
		}
	}

	.actions {
		position: relative;
		margin: -5px 0;
	}

	.more {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		padding: 0;
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--ink-3);
		cursor: pointer;
	}

	.more:hover,
	.more[aria-expanded='true'] {
		background: var(--sunk);
		color: var(--ink);
	}

	.more svg {
		width: 16px;
		height: 16px;
		fill: currentColor;
	}

	.menu {
		position: absolute;
		top: calc(100% + var(--space-1));
		right: 0;
		z-index: 2;
		min-width: 190px;
		padding: var(--space-1);
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--surface);
		box-shadow: var(--shadow-float);
	}

	.menu [role='menuitem'] {
		display: block;
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--ink);
		font: inherit;
		font-size: var(--text-sm);
		text-align: left;
		white-space: nowrap;
		cursor: pointer;
	}

	.menu [role='menuitem']:hover,
	.menu [role='menuitem']:focus-visible {
		background: var(--hover);
		outline: none;
	}

	@media (max-width: 767px) {
		/* Phone: a sprint row's controls wrap under the meta line, in reading order: status, day, priority, due. */
		.movable {
			grid-template-columns: var(--checkbox-size) minmax(0, 1fr);
		}

		.slots {
			grid-column: 2;
			gap: var(--space-2);
			margin-top: var(--space-2);
		}

		.slots .status-slot {
			order: 1;
			margin-left: -5px;
		}

		.slots .day-slot {
			order: 2;
			width: auto;
		}

		.slots .prio-slot {
			order: 3;
			width: auto;
		}

		.slots .due {
			order: 4;
		}

		.slots .actions {
			order: 5;
			margin-left: auto;
		}

		.add-label {
			display: none;
		}

		.add {
			width: 32px;
			height: 32px;
			margin: -7px 0;
			padding: 0;
			justify-content: center;
		}
	}

	/* Board card: the title may take two lines over one meta line; the status glyph sits top right.
	   Declared last so it wins over the phone's wrapped sprint row. */
	.row.card {
		grid-template-columns: var(--checkbox-size) minmax(0, 1fr) auto;
		padding: var(--space-3);
	}

	.card .title {
		display: -webkit-box;
		white-space: normal;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.card .meta {
		flex-wrap: nowrap;
		gap: var(--space-2);
		overflow: hidden;
		white-space: nowrap;
	}

	.compact {
		display: flex;
		align-items: center;
		margin-top: -2px;
	}

	/* Week chip: one line. The status glyph takes the aspect colour and stands in for the aspect dot. */
	.row.chip {
		grid-template-columns: 14px minmax(0, 1fr) auto;
		align-items: center;
		column-gap: var(--space-2);
		min-height: 32px;
		padding: 2px var(--space-1) 2px var(--space-2);
	}

	.chip .check {
		width: 14px;
		height: 14px;
		margin-top: 0;
		border-radius: 4px;
	}

	.chip .check svg {
		width: 10px;
		height: 10px;
	}

	.chip .title {
		font-size: var(--text-sm);
	}

	.chip .main {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}

	.chip .slot {
		flex: none;
		color: var(--ink-3);
		font-size: var(--text-xs);
	}

	.chip .title {
		flex: 1;
		width: auto;
		min-width: 0;
	}

	.chip .status-slot :global(.glyph) {
		color: var(--a);
	}

	.chip .compact {
		margin-top: 0;
	}

	/* With a mouse, card and chip menus wait for hover just left of the status glyph, so they take no width. */
	@media (hover: hover) and (pointer: fine) {
		.card,
		.chip {
			position: relative;
		}

		:is(.card, .chip) .actions {
			position: absolute;
			top: var(--space-2);
			right: calc(var(--space-3) + 26px);
			margin: 0;
		}

		.chip .actions {
			top: 2px;
			right: 30px;
		}

		:is(.card, .chip) .more {
			background: var(--surface);
			box-shadow: var(--shadow-pop);
		}
	}
</style>
