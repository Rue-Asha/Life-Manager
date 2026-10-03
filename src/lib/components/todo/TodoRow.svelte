<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { MediaQuery } from 'svelte/reactivity';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import { isOverdue } from '$lib/todo-utils';
	import type { Aspect, IsoDate, Todo } from '$lib/types';
	import { UI_ICONS } from '../ui/icons';
	import Button from '../ui/Button.svelte';
	import DayPicker from './DayPicker.svelte';
	import StatusControl from './StatusControl.svelte';
	import TodoEditor from './TodoEditor.svelte';
	import { submit } from './form';
	import { dueLabel } from './format';

	let {
		todo,
		aspect,
		today,
		context,
		sprintDays,
		mixed = false
	}: {
		todo: Todo;
		aspect: Aspect;
		today: IsoDate;
		context: 'backlog' | 'sprint' | 'today' | 'planning';
		sprintDays?: IsoDate[];
		mixed?: boolean;
	} = $props();

	// Ticking a backlog or draft todo done would strand it there: done belongs to a running sprint.
	const checkable = $derived(context === 'sprint' || context === 'today');
	const done = $derived(todo.status === 'done');
	const overdue = $derived(isOverdue(todo, today));
	const checked = $derived(todo.checklist.filter((i) => i.done).length);

	// The editor's aspect picker needs every aspect; pages showing rows return them from load.
	const aspects = $derived((page.data.aspects as Aspect[] | undefined) ?? [aspect]);
	const desktop = new MediaQuery('min-width: 768px');
	let editing = $state(false);
	const expanded = $derived(editing && desktop.current);
	const close = () => (editing = false);
</script>

{#snippet moves()}
	{#if context === 'backlog' && sprintDays}
		<form method="POST" action="/todos?/addToSprint" use:enhance={submit({ onsuccess: close })}>
			<input type="hidden" name="id" value={todo.id} />
			<Button variant="secondary">Add to sprint</Button>
		</form>
	{:else if context === 'sprint'}
		<form method="POST" action="/todos?/moveToBacklog" use:enhance={submit({ onsuccess: close })}>
			<input type="hidden" name="id" value={todo.id} />
			<Button variant="secondary">Move to backlog</Button>
		</form>
	{/if}
{/snippet}

<li
	class="row"
	class:checkable
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
			<button type="button" class="title" onclick={() => (editing = true)}>{todo.title}</button>
			<div class="meta">
				{#if mixed}
					<span><i class="dot"></i>{aspect.name}</span>
				{/if}
				{#if context === 'sprint'}
					<StatusControl todoId={todo.id} status={todo.status} />
					{#if sprintDays}<DayPicker todoId={todo.id} day={todo.day} {sprintDays} />{/if}
				{/if}
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
			</div>
		</div>

		<div class="end">
			{#if todo.priority}
				<span class="prio" data-p={todo.priority} role="img" aria-label="Priority {todo.priority}">
					<i></i><i></i><i></i>
				</span>
			{/if}
			{#if todo.dueDate}
				<span class="due num" class:late={overdue}>
					{#if overdue}<span class="visually-hidden">Overdue,</span>{/if}
					{dueLabel(todo.dueDate, today)}
				</span>
			{/if}
			{#if context === 'backlog' && sprintDays}
				<form method="POST" action="/todos?/addToSprint" use:enhance={submit()}>
					<input type="hidden" name="id" value={todo.id} />
					<button class="add" aria-label="Add to sprint: {todo.title}" title="Add to sprint">
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>
						<span class="add-label">Add to sprint</span>
					</button>
				</form>
			{/if}
		</div>
	{/if}
</li>

<style>
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: start;
		column-gap: var(--space-3);
		min-height: var(--row-height);
		padding: var(--space-3) var(--space-2);
		margin: 0 calc(-1 * var(--space-2));
		border-radius: var(--radius-md);
		transition: background-color var(--dur-fast) var(--ease-out);
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
		background: var(--paper-scrim);
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
		background: var(--paper-hover);
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
		background: var(--paper);
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

	.dot {
		width: 7px;
		height: 7px;
		border-radius: var(--radius-pill);
		background: var(--a);
	}

	.end {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding-top: 1px;
		color: var(--ink-2);
		font-size: var(--text-sm);
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
		background: var(--paper);
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
	}

	@media (max-width: 767px) {
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
</style>
