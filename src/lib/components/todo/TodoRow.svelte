<!--
	A todo in a list. Three shapes: `row` (a status glyph that opens the status menu, title, meta line, "More actions"), `card` (Board: aspect,
	priority and "More actions" on top) and `chip` (a week column: glyph, slot, title, aspect dot). The status and the day sit behind menus on the
	menu primitive, so touch and keyboard reach every move a drag makes; the day reads as plain text in the meta line.
	Two meta lines, as signed: the sprint line (By aspect, Plan, Review: Recurring · Sun 22 · Due Tue 17 · 09:00–10:30) and the full line
	(Today, Backlog, aspect and project pages: Doing/Done, due "3d left", P1–P3, slot, class, checklist 1/2, Recurring, Notes, project).
	Today's rows (checkable, not movable) keep the contract's tick "Done: <title>"; a backlog row keeps "Add to sprint: <title>".
	The title opens the editor, a sheet at every width; a todo of an archived class opens it read-only.
-->
<script lang="ts">
	import { onDestroy, type Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { beforeNavigate, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { ms } from '$lib/motion';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import { plannedLabel, slotLabel } from '$lib/slot';
	import { isOverdue, shownDay } from '$lib/todo-utils';
	import type { Aspect, ClassRef, IsoDate, ProjectRef, Todo } from '$lib/types';
	import ClassBadge from '../uni/ClassBadge.svelte';
	import { UI_ICONS } from '../ui/icons';
	import Button from '../ui/Button.svelte';
	import Toast from '../ui/Toast.svelte';
	import ConfirmDialog from '../ui/ConfirmDialog.svelte';
	import PopMenu from '../menu/PopMenu.svelte';
	import Select from '../select/Select.svelte';
	import Field from '../field/Field.svelte';
	import DayPicker from './DayPicker.svelte';
	import StatusControl, { STATUS_LABELS } from './StatusControl.svelte';
	import TodoEditor from './TodoEditor.svelte';
	import { planError, submit, type ActionError } from './form';
	import { postTodo } from './post';
	import { dayLabel, dueLabel } from './format';

	let {
		todo,
		aspect,
		today,
		context,
		sprintDays,
		mixed = false,
		indent = false,
		tag,
		readonly = false,
		flat = false,
		variant = 'row',
		extra,
		planMenu = false,
		deletable = false,
		hideProject = false
	}: {
		todo: Todo;
		aspect: Aspect;
		today: IsoDate;
		context: 'backlog' | 'sprint' | 'today' | 'planning';
		sprintDays?: IsoDate[];
		mixed?: boolean;
		// A row without a tick keeps the tick's room, so its title lines up with the ticked rows of the same list.
		indent?: boolean;
		// A small word first in the meta line (Today marks what comes from the backlog).
		tag?: string;
		// An archived class's rows: shown, but nothing on them can be changed.
		readonly?: boolean;
		// A sprint todo listed on a page of its own (the aspect page): a plain hairline row with the full meta line, not a sunken tile with the sprint line.
		flat?: boolean;
		// Board cards (`card`) and desktop week chips (`chip`) show less; the editor still shows everything.
		variant?: 'row' | 'card' | 'chip';
		// Takes the class badge's place: the class detail page passes it and already names the class; it places the due label itself, after its own parts.
		extra?: Snippet<[Todo, Snippet?]>;
		// The backlog page: a "More actions" menu at the end of the action line with "Plan a day" (a panel under the row) and "Edit todo".
		planMenu?: boolean;
		// A read-only row (archived class) keeps one action: Delete, behind its confirmation.
		deletable?: boolean;
		// The project page already names the project.
		hideProject?: boolean;
	} = $props();

	// Ticking a backlog or draft todo done would strand it there: done belongs to a running sprint.
	const checkable = $derived(!readonly && (context === 'sprint' || context === 'today'));
	const movable = $derived(!readonly && context === 'sprint');
	const done = $derived(todo.status === 'done');
	const overdue = $derived(isOverdue(todo, today));
	const day = $derived(shownDay(todo));
	// The slot only where the day is its own text (sprint rows, week columns, Today's own day); elsewhere the label carries the date too.
	const planned = $derived(
		todo.day === null
			? ''
			: plannedLabel(todo.day, todo.startTime, todo.endTime, variant === 'card' || !((movable && !flat) || variant === 'chip' || (context === 'today' && todo.day === today)))
	);
	// Aspect page and the backlog's planned list name the planned day right after the aspect, as signed; Today keeps it after the priority.
	const plannedFirst = $derived(flat || (mixed && context === 'backlog'));
	const checked = $derived(todo.checklist.filter((i) => i.done).length);
	// The sprint line reads the stored day, never the due day the week places an unscheduled todo on.
	const sprintLine = $derived(variant === 'row' && ((movable && !flat) || context === 'planning'));
	const slot = $derived(todo.day && todo.startTime ? slotLabel(todo.startTime, todo.endTime) : '');
	// The glyph names the status where there is one; elsewhere Doing and Done are written out ("To do" never is).
	const statusWord = $derived((!movable || flat) && todo.status !== 'todo' ? STATUS_LABELS[todo.status] : null);

	// The editor's aspect picker needs every aspect; pages showing rows return them from load.
	const aspects = $derived((page.data.aspects as Aspect[] | undefined) ?? [aspect]);
	const project = $derived(
		todo.projectId === null || hideProject ? undefined : (page.data.projects as ProjectRef[] | undefined)?.find((p) => p.id === todo.projectId)
	);
	const classRef = $derived(
		todo.classId === null ? undefined : (page.data.classes as ClassRef[] | undefined)?.find((c) => c.id === todo.classId)
	);
	let confirmingDelete = $state(false);
	let deleteForm = $state<HTMLFormElement>();
	let rowEl = $state<HTMLElement>();
	let focusAfter: HTMLElement | null = null;
	// The row unmounts with its dialog, so focus goes to the next row's Delete, else the previous one's, else the card's heading.
	function pickFocus() {
		const mine = rowEl?.querySelector<HTMLElement>('[data-row-delete]');
		const all = [...document.querySelectorAll<HTMLElement>('[data-row-delete]')];
		const i = mine ? all.indexOf(mine) : -1;
		focusAfter = all[i + 1] ?? all[i - 1] ?? null;
		if (!focusAfter) {
			focusAfter = mine?.closest('.card')?.querySelector<HTMLElement>('h2') ?? null;
			focusAfter?.setAttribute('tabindex', '-1');
		}
	}
	let editing = $state(false);
	const close = () => (editing = false);

	// A recurring instance has no backlog, so removing it deletes it. The delete waits behind the
	// undo toast and is posted when the toast expires or Rue leaves the page.
	let removal = $state<'none' | 'pending' | 'posted'>('none');

	function remove() {
		editing = false;
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
	let rowError = $state<string | null>(null);
	let reviewFirst = $state(false);
	function addFailed(e: ActionError) {
		if (e.error === 'not-found') invalidateAll();
		else if (e.error === 'review-required') {
			reviewFirst = true;
			rowError = 'The sprint needs its review first.';
		} else rowError = 'Couldn’t add that todo to the sprint — try again.';
	}
	function menuFailed(message: string) {
		reviewFirst = false;
		rowError = message;
	}

	const OTHER = 'other';
	let planning = $state(false);
	let planChoice = $state('');
	let planDate = $state('');
	const planDay = $derived(planChoice === OTHER ? planDate : planChoice);
	const planOptions = $derived([
		{ value: '', label: 'No day' },
		...(sprintDays ?? []).map((d) => ({ value: d, label: dayLabel(d) })),
		{ value: OTHER, label: 'Another date…' }
	]);
	const planItems = $derived([
		{ label: planning ? 'Close the plan' : 'Plan a day', value: 'plan' },
		{ label: 'Edit todo', value: 'edit' }
	]);

	async function menuPick(item: { value?: string }) {
		if (item.value === 'edit') {
			editing = true;
			return;
		}
		if (planning) {
			planning = false;
			return;
		}
		planChoice = todo.day === null ? '' : (sprintDays ?? []).includes(todo.day) ? todo.day : OTHER;
		planDate = todo.day ?? '';
		planning = true;
		await tick();
		requestAnimationFrame(() => document.getElementById(`plan-${todo.id}`)?.focus({ preventScroll: true }));
	}
	function planFailed(e: ActionError) {
		reviewFirst = e.error === 'review-required';
		rowError = planError(e) ?? 'Couldn’t plan that todo — try again.';
	}
	async function removePlan() {
		const error = await postTodo('setDay', { id: String(todo.id), day: '' });
		if (error) planFailed(error);
		else planning = false;
	}

	beforeNavigate(() => postRemoval(false));
	onDestroy(() => postRemoval(false));
</script>

{#snippet moves()}
	{#if context === 'backlog' && sprintDays}
		<form method="POST" action="/todos?/addToSprint" use:enhance={submit({ onerror: addFailed, onsuccess: close })}>
			<input type="hidden" name="id" value={todo.id} />
			<Button size="s">Add to sprint</Button>
		</form>
	{:else if context === 'sprint' && todo.recurring}
		<Button size="s" type="button" onclick={remove}>Remove from sprint</Button>
	{:else if context === 'sprint'}
		<form method="POST" action="/todos?/moveToBacklog" use:enhance={submit({ onsuccess: close })}>
			<input type="hidden" name="id" value={todo.id} />
			<Button size="s">Move to backlog</Button>
		</form>
	{/if}
{/snippet}

{#snippet heading()}
	{#if readonly}
		<span class="title">{todo.title}</span>
	{:else}
		<button type="button" class="title" title={todo.title} onclick={() => (editing = true)}>{todo.title}</button>
	{/if}
{/snippet}

{#snippet due()}
	{#if todo.dueDate && !done}
		<span class="num" class:late={overdue}>
			{#if overdue}<span class="visually-hidden">Overdue,</span>{/if}
			{dueLabel(todo.dueDate, today)}
		</span>
	{/if}
{/snippet}

{#snippet alert()}
	{#if rowError}
		<p class="alert" role="alert">
			{rowError}
			{#if reviewFirst}<a href="/sprint/review">Review</a>{/if}
		</p>
	{/if}
{/snippet}

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
		bind:this={rowEl}
		class="row"
		class:tile={movable && variant === 'row' && !flat}
		class:card={variant === 'card'}
		class:chip={variant === 'chip'}
		class:list={variant === 'row' && (!movable || flat)}
		class:plan={context === 'planning'}
		class:planmenu={planMenu}
		class:bare={variant === 'row' && context !== 'planning' && !movable && !checkable && !indent}
		class:done
		aria-label={todo.title}
		data-day={day ?? ''}
		style:--a={ASPECT_COLORS[aspect.color].fg}
	>
		{#if !readonly || editing}
			<TodoEditor {todo} {aspects} open={editing} onclose={close} actions={moves} readonly={classRef?.archived ?? false} />
		{/if}

		{#if variant === 'chip'}
			{#if movable}
				<StatusControl todoId={todo.id} status={todo.status} small {day} {sprintDays} recurring={todo.recurring} onremove={remove} onerror={menuFailed} />
			{/if}
			{#if todo.startTime}<span class="slot num" role="time">{todo.startTime}</span>{/if}
			{@render heading()}
			<i class="dot" role="img" aria-label={aspect.name}></i>
			{#if !movable}<span class="visually-hidden">Status: {STATUS_LABELS[todo.status]}</span>{/if}
			{@render alert()}
		{:else if variant === 'card'}
			<div class="top">
				<span class="aspect"><i class="dot" aria-hidden="true"></i>{aspect.name}</span>
				{#if todo.priority}
					<span class="pill" role="img" aria-label="Priority {todo.priority}">P{todo.priority}</span>
				{/if}
				{#if movable}
					<DayPicker todoId={todo.id} {day} {sprintDays} recurring={todo.recurring} status={todo.status} withStatus onremove={remove} onerror={menuFailed} />
				{/if}
			</div>
			{@render heading()}
			<span class="visually-hidden">Status: {STATUS_LABELS[todo.status]}</span>
			<ul class="facts">
				{#if todo.dueDate && !done}
					<li class:late={overdue}>
						{#if overdue}<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.alert} /></svg><span class="visually-hidden">Overdue,</span>{/if}
						<span class="num">Due {dayLabel(todo.dueDate)}</span>
					</li>
				{/if}
				{#if todo.day}
					<li>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.calendar} /></svg>
						<span class="num">{dayLabel(todo.day)}{#if slot}<span aria-hidden="true">{' · '}</span><span role="time">{slot}</span>{/if}</span>
					</li>
				{/if}
				{#if todo.recurring}<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.repeat} /></svg>Recurring</li>{/if}
			</ul>
			{@render alert()}
		{:else}
			{#if movable}
				<StatusControl todoId={todo.id} status={todo.status} onerror={menuFailed} />
			{:else if checkable}
				<form method="POST" action="/todos?/toggleDone" use:enhance={submit()}>
					<input type="hidden" name="id" value={todo.id} />
					<button class="tick" data-press="round" role="checkbox" aria-checked={done} aria-label="Done: {todo.title}" data-status={todo.status}>
						<span>
							{#if done}
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={UI_ICONS.check} /></svg>
							{/if}
						</span>
					</button>
				</form>
			{:else if indent}
				<span class="gap" aria-hidden="true"></span>
			{/if}

			<div class="text">
				{@render heading()}
				{#if !movable}<span class="visually-hidden">Status: {STATUS_LABELS[todo.status]}</span>{/if}
				{#if sprintLine}
					<div class="meta line">
						{#if statusWord}<span aria-hidden="true">{statusWord}</span>{/if}
						{#if mixed}<span>{aspect.name}</span>{/if}
						{#if todo.recurring}<span>Recurring</span>{/if}
						{#if movable}<span class="num">{todo.day ? dayLabel(todo.day) : 'Unscheduled'}</span>{/if}
						{#if todo.dueDate && !done}
							<span class="num" class:late={overdue}>{#if overdue}<span class="visually-hidden">Overdue,</span>{/if}Due {dayLabel(todo.dueDate)}</span>
						{/if}
						<!-- Plan's "Joins automatically" names the full planned label (sprint-lifecycle, plan ahead). -->
						{#if movable && slot}<span class="num" role="time">{slot}</span>{:else if !movable && todo.day}<span class="num" role="time">{planned}</span>{/if}
						{#if extra}{@render extra(todo)}{:else if classRef}<span><ClassBadge {classRef} type={todo.type} /></span>{/if}
						{#if project}
							<span><a class="badge" href="/projects/{project.id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.folder} /></svg>{project.name}</a></span>
						{/if}
					</div>
				{:else}
					<div class="meta">
						{#if statusWord}<span aria-hidden="true">{statusWord}</span>{/if}
						{#if tag}<span>{tag}</span>{/if}
						{#if mixed}<span class="asp" title={aspect.name}><i class="dot" aria-hidden="true"></i><span>{aspect.name}</span></span>{/if}
						{#if plannedFirst && planned}<span class="num" role="time">{planned}</span>{/if}
						{#if !extra}{@render due()}{/if}
						{#if todo.priority}<span class="num" role="img" aria-label="Priority {todo.priority}">P{todo.priority}</span>{/if}
						{#if planned && !plannedFirst}<span class="num" role="time">{planned}</span>{/if}
						{#if extra}{@render extra(todo, due)}{:else if classRef}<ClassBadge {classRef} type={todo.type} />{/if}
						{#if todo.checklist.length}
							<span class="num" aria-label="Checklist {checked} of {todo.checklist.length}">{checked}/{todo.checklist.length}</span>
						{/if}
						{#if todo.recurring}<span>Recurring</span>{/if}
						{#if todo.notes}<span>Notes</span>{/if}
						{#if project}
							<span><a class="badge" href="/projects/{project.id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.folder} /></svg>{project.name}</a></span>
						{/if}
					</div>
				{/if}
				{@render alert()}
			</div>

			{#if movable}
				<DayPicker todoId={todo.id} {day} {sprintDays} recurring={todo.recurring} onremove={remove} onerror={menuFailed} />
			{/if}
			{#if readonly && deletable}
				<Button variant="quiet" icon type="button" label="Delete todo: {todo.title}" aria-haspopup="dialog" data-row-delete onclick={() => (confirmingDelete = true)}>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={UI_ICONS.trash} /></svg>
				</Button>
				<ConfirmDialog
					open={confirmingDelete}
					title="Delete this todo?"
					message="“{todo.title.length > 60 ? `${todo.title.slice(0, 60)}…` : todo.title}” and its checklist will be gone for good."
					confirmLabel="Delete todo"
					onconfirm={() => (pickFocus(), deleteForm?.requestSubmit())}
					oncancel={() => (confirmingDelete = false)}
				/>
				<form bind:this={deleteForm} method="POST" action="/todos?/delete" use:enhance={submit({ onsuccess: () => ((confirmingDelete = false), focusAfter?.focus()) })} hidden>
					<input type="hidden" name="id" value={todo.id} />
				</form>
			{/if}
			{#if planMenu && context === 'backlog' && !readonly}
				<div class="acts" data-lone={sprintDays ? undefined : ''}>
					{#if sprintDays}
						<form class="act" method="POST" action="/todos?/addToSprint" use:enhance={submit({ onerror: addFailed })}>
							<input type="hidden" name="id" value={todo.id} />
							<Button size="s" label="Add to sprint: {todo.title}">Add to sprint</Button>
						</form>
					{/if}
					<PopMenu name="More actions: {todo.title}" items={planItems} onselect={menuPick}>
						{#snippet trigger(attrs)}
							<Button variant="quiet" icon type="button" label="More actions: {todo.title}" {...attrs}>
								<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d={UI_ICONS.more} /></svg>
							</Button>
						{/snippet}
					</PopMenu>
				</div>
				{#if planning}
					<div class="plan-wrap" transition:slide={{ duration: ms(260), easing: quintOut }}>
						<form class="plan" method="POST" action="/todos?/setDay" aria-label="Plan a day: {todo.title}" use:enhance={submit({ onerror: planFailed, onsuccess: () => (planning = false) })}>
							<input type="hidden" name="id" value={todo.id} />
							<input type="hidden" name="day" value={planDay} />
							<Select label="Planned day" id="plan-{todo.id}" bind:value={planChoice} options={planOptions} />
							{#if planChoice === OTHER}
								<Field label="Date" type="date" bind:value={planDate} />
							{/if}
							<p>A day of the running week pulls the todo into the sprint. A day outside it keeps it here.</p>
							<div class="cluster">
								<Button variant="primary" size="s">Save</Button>
								<Button size="s" type="button" onclick={removePlan}>Remove plan</Button>
							</div>
						</form>
					</div>
				{/if}
			{:else if context === 'backlog' && sprintDays && !readonly}
				<form class="act" method="POST" action="/todos?/addToSprint" use:enhance={submit({ onerror: addFailed })}>
					<input type="hidden" name="id" value={todo.id} />
					<Button size="s" label="Add to sprint: {todo.title}">Add to sprint</Button>
				</form>
			{/if}
		{/if}
	</li>
{/if}

<style>
	.removed {
		display: contents;
	}

	form {
		display: contents;
	}

	/* A list row: hairline-separated inside its group card. */
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		min-inline-size: 0;
		padding: var(--space-0-5) var(--space-2) var(--space-0-5) var(--space-1);
		border-radius: var(--radius-item);
	}
	/* A sprint row is its own sunken tile. */
	.row.tile {
		border-radius: var(--radius-panel);
		background: var(--surface-sunken);
	}
	@media (hover: hover) and (pointer: fine) {
		.row:not(.tile):not(.card):not(.chip):hover {
			background: var(--surface-sunken);
		}
	}

	.text {
		flex: 1;
		display: grid;
		min-inline-size: 0;
		padding-block: var(--space-1);
	}
	/* A list row reads as the signed list-row: 12 px above and below, the meta right under the title. The title's
	   hit area reaches over the whole text block and the row's own padding, never into the row or heading above or below, so a one-line title still makes a 44 px target on touch. */
	.row.list > .text {
		position: relative;
		align-content: center;
		gap: var(--space-0-5);
		min-block-size: var(--target);
		padding-block: var(--space-2-5);
	}
	/* Plan and Review rows sit in their own sunken item, which brings the padding. */
	.row.list.plan > .text {
		padding-block: var(--space-1-5);
	}
	.row.list > .text > .title {
		min-block-size: 0;
	}
	.row.list > .text > button.title::after {
		content: '';
		position: absolute;
		inset-block: calc(-1 * var(--space-0-5));
		inset-inline: 0;
		border-radius: var(--radius-item);
	}
	.text > .meta :global(:is(a, button)),
	.row.list > .text > .alert {
		position: relative;
		z-index: 1;
	}
	/* Without a tick or its room the title shares the group heading's left edge. */
	.row.bare {
		padding-inline-start: var(--space-3);
	}
	.title {
		justify-self: start;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		max-inline-size: 100%;
		min-block-size: var(--target);
		min-inline-size: var(--target);
		padding: 0;
		border: 0;
		border-radius: var(--radius-text);
		background: none;
		color: inherit;
		font-family: inherit;
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
		font-weight: var(--type-title-weight);
		text-align: start;
		overflow-wrap: anywhere;
		align-content: center;
		touch-action: manipulation;
	}
	button.title {
		cursor: pointer;
	}
	@media (hover: hover) {
		button.title:hover {
			text-decoration: underline;
			text-underline-offset: 0.2em;
		}
	}
	.title:focus-visible {
		outline-offset: var(--space-0-5);
	}
	.done .title {
		color: var(--ink-secondary);
		font-weight: var(--weight-medium);
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	/* The meta line wraps; nothing in it is cut. */
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0 var(--space-3);
		font-size: var(--type-caption-size);
		line-height: var(--type-caption-line);
		color: var(--ink-secondary);
		font-variant-numeric: var(--numeric-figures);
		overflow-wrap: anywhere;
	}
	.meta:empty {
		display: none;
	}
	.done .meta {
		color: var(--ink-muted);
	}
	.meta > span {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}
	/* The sprint line as signed: short parts joined by a middle dot. */
	.meta.line {
		display: block;
	}
	.meta.line > span {
		display: inline;
	}
	.meta.line > span + span::before {
		content: ' · ' / '';
		color: var(--ink-secondary);
		font-weight: var(--weight-regular);
	}
	.meta svg {
		flex: none;
		inline-size: var(--space-3-5);
		block-size: var(--space-3-5);
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.badge {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: inherit;
		text-decoration: none;
	}
	/* A link in the meta line is inline text: 24 px is its floor, the title and the tick carry the 44 px targets. */
	.badge::after {
		content: '';
		position: absolute;
		inset-block: min(0px, calc((100% - var(--target-min)) / 2));
		inset-inline: 0;
	}
	@media (hover: hover) {
		.badge:hover {
			color: var(--ink);
			text-decoration: underline;
		}
	}
	.late {
		color: var(--danger);
		font-weight: var(--weight-semibold);
	}
	/* A long aspect name stays on one line in a mixed list; the rest of the meta wraps. */
	/* A definite cap: a percentage can't bound the row's min-content width, so a long name would widen the row past the card. */
	.meta > .asp {
		min-inline-size: 0;
		max-inline-size: calc(var(--space-16) * 3);
	}
	.asp > span {
		min-inline-size: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.dot {
		display: inline-block;
		flex: none;
		inline-size: var(--space-2);
		block-size: var(--space-2);
		border-radius: var(--radius-round);
		background: var(--a);
	}

	/* Today's tick: the status glyph's look, an instant toggle. */
	.tick {
		display: grid;
		place-items: center;
		flex: none;
		inline-size: max(var(--control-height), var(--target));
		block-size: max(var(--control-height), var(--target));
		padding: 0;
		border: 0;
		border-radius: var(--radius-round);
		background: none;
		color: var(--ink);
	}
	.tick > span {
		display: grid;
		place-items: center;
		inline-size: var(--space-6);
		block-size: var(--space-6);
		border-radius: var(--radius-round);
		box-shadow: var(--ring-control);
		background: var(--surface-raised);
	}
	.tick[data-status='doing'] > span {
		background: linear-gradient(90deg, var(--ink) 50%, var(--surface-raised) 50%);
	}
	.tick[aria-checked='true'] > span {
		background: var(--surface-inverse);
		box-shadow: none;
		color: var(--ink-on-inverse);
	}

	/* On a phone the action sits under the title, in line with it, so the title keeps its width. */
	@media (max-width: 767px) {
		.row:has(> form.act) {
			flex-wrap: wrap;
		}
		.row > form.act {
			display: block;
			flex: 1 0 100%;
			padding-block-end: var(--space-2);
			padding-inline-start: calc(max(var(--control-height), var(--target)) + var(--space-1));
		}
		.row:not(:has(> .gap)) > form.act {
			padding-inline-start: var(--space-2);
		}
		.row.bare > form.act {
			padding-inline-start: 0;
		}
	}

	/* Backlog rows: "Add to sprint" and the ··· menu share one action line (under the title on phones, at the end from 768 px); the plan panel glides open under them. */
	.row.planmenu {
		flex-wrap: wrap;
	}
	.acts {
		display: flex;
		flex: none;
		align-items: center;
		gap: var(--space-2);
	}
	.acts[data-lone] {
		margin-inline-start: auto;
	}
	@media (max-width: 767px) {
		.row.planmenu > .acts:not([data-lone]) {
			flex: 1 0 100%;
			justify-content: space-between;
			padding-block-end: var(--space-2);
			padding-inline-start: calc(max(var(--control-height), var(--target)) + var(--space-1));
		}
		.row.planmenu:not(:has(> .gap)) > .acts:not([data-lone]) {
			padding-inline-start: var(--space-2);
		}
		.row.planmenu.bare > .acts:not([data-lone]) {
			padding-inline-start: 0;
		}
	}
	.plan-wrap {
		flex: 1 0 100%;
		min-inline-size: 0;
	}
	/* From 768 px the panel reaches past the row's padding to the signed 12 px card inset. */
	@media (min-width: 768px) {
		.plan-wrap {
			margin-inline: calc(-1 * var(--space-1)) calc(-1 * var(--space-2));
		}
	}
	.plan {
		display: grid;
		gap: var(--space-3);
		margin: var(--space-1) var(--space-1) var(--space-2);
		padding: var(--space-4);
		border-radius: var(--radius-panel);
		background: var(--surface-sunken);
	}
	.plan p {
		margin: 0;
		font-size: var(--type-caption-size);
		line-height: var(--type-caption-line);
		color: var(--ink-secondary);
	}
	.plan .cluster {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.gap {
		flex: none;
		inline-size: max(var(--control-height), var(--target));
	}

	.alert {
		margin: 0;
		padding: var(--space-1-5) var(--space-3);
		border-radius: var(--radius-item);
		background: var(--danger-soft);
		box-shadow: var(--ring-danger);
		color: var(--danger);
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
		font-weight: var(--weight-semibold);
	}
	.alert a {
		color: inherit;
		text-underline-offset: 0.2em;
	}

	/* Board card */
	.row.card {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: start;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-2) var(--space-2) var(--space-3);
		border-radius: var(--radius-item);
		background: var(--surface-raised);
		box-shadow: var(--ring-hairline);
	}
	.top {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-inline-size: 0;
	}
	.aspect {
		flex: 1;
		display: inline-flex;
		align-items: baseline;
		gap: var(--space-1-5);
		min-inline-size: 0;
		font-size: var(--type-caption-size);
		line-height: var(--type-caption-line);
		font-weight: var(--weight-medium);
		color: var(--ink-secondary);
		overflow-wrap: anywhere;
	}
	.top > :global(.btn) {
		margin-block: calc(-1 * var(--space-2));
		margin-inline-end: calc(-1 * var(--space-1));
	}
	.pill {
		padding: 0 var(--space-2);
		border-radius: var(--radius-pill);
		background: var(--surface-tint);
		font-size: var(--type-overline-size);
		line-height: var(--space-5);
		letter-spacing: var(--type-overline-tracking);
		font-weight: var(--weight-bold);
		font-variant-numeric: var(--numeric-figures);
	}
	/* One fact per line, each with its icon, as signed. */
	.facts {
		display: grid;
		justify-items: start;
		gap: var(--space-1);
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: var(--type-caption-size);
		line-height: var(--type-caption-line);
		color: var(--ink-secondary);
		font-variant-numeric: var(--numeric-figures);
	}
	.facts:empty {
		display: none;
	}
	.facts > li {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-inline-size: 0;
		overflow-wrap: anywhere;
	}
	.facts svg {
		flex: none;
		inline-size: var(--space-3-5);
		block-size: var(--space-3-5);
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* Week chip */
	.row.chip {
		position: relative;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		column-gap: var(--space-1);
		min-block-size: max(var(--space-9), var(--target));
		padding: 0 var(--space-1) 0 var(--space-0-5);
		border-radius: var(--radius-item);
		background: var(--surface-raised);
		font-size: var(--type-caption-size);
		line-height: var(--type-caption-line);
	}
	.chip > :global(.glyph) {
		grid-row: 1 / span 2;
	}
	.chip .title {
		grid-column: 2;
		grid-row: 1 / span 2;
		align-self: stretch;
		min-block-size: 0;
		margin-block: var(--space-1-5);
		padding-block: 0;
		font-size: inherit;
		line-height: inherit;
		font-weight: var(--weight-medium);
		-webkit-line-clamp: 3;
		line-clamp: 3;
	}
	.chip .slot {
		grid-column: 2;
		align-self: end;
		padding-block-start: var(--space-1);
		color: var(--ink-secondary);
		font-size: var(--type-overline-size);
	}
	.chip .slot + .title {
		grid-row: 2;
		margin-block-start: 0;
	}
	.chip > .alert {
		grid-column: 1 / -1;
		margin: 0 var(--space-0-5) var(--space-1);
	}
	.chip > .dot {
		grid-column: 3;
		grid-row: 1 / span 2;
	}
	@media (max-width: 1439px) {
		.chip > .dot {
			display: none;
		}
	}
</style>
