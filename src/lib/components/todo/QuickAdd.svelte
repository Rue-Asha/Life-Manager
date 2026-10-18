<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import type { Aspect, ClassType, HhMm, Id, IsoDate, Priority, Target } from '$lib/types';
	import Button from '../ui/Button.svelte';
	import Chip from '../ui/Chip.svelte';
	import Sheet from '../ui/Sheet.svelte';
	import { UI_ICONS } from '../ui/icons';
	import TodoFields from './TodoFields.svelte';
	import { planError, submit, type ActionError } from './form';

	let {
		aspects,
		target,
		defaultAspectId,
		defaultClassId,
		defaultType,
		defaultDueDate,
		variant = 'inline',
		compactLabel,
		open = $bindable(false)
	}: {
		aspects: Aspect[];
		target: Target;
		defaultAspectId?: Id;
		defaultClassId?: Id;
		defaultType?: ClassType;
		defaultDueDate?: IsoDate;
		// `dialog` has no field of its own: something else opens it (the sidebar's "New todo").
		variant?: 'inline' | 'dialog';
		// On desktop the field shrinks to a "+" with this name (the week's day columns).
		compactLabel?: string;
		open?: boolean;
	} = $props();

	const desktop = new MediaQuery('min-width: 768px');

	let title = $state('');
	let notes = $state('');
	let chosenAspectId = $state<Id | null>(null);
	let priority = $state<Priority>(0);
	let chosenDueDate = $state<IsoDate | '' | null>(null);
	let chosenPlannedDay = $state<IsoDate | '' | null>(null);
	let startTime = $state<HhMm | ''>('');
	let endTime = $state<HhMm | ''>('');
	let projectId = $state<Id | ''>('');
	let chosenClassId = $state<Id | '' | null>(null);
	let chosenType = $state<ClassType | null>(null);
	let checklist = $state<string[]>([]);
	let error = $state<ActionError | null>(null);
	let titleInput = $state<HTMLInputElement>();

	const aspectId = $derived(chosenAspectId ?? defaultAspectId ?? aspects[0].id);
	const classId = $derived(chosenClassId ?? defaultClassId ?? '');
	const dueDate = $derived(chosenDueDate ?? defaultDueDate ?? '');
	const type = $derived(chosenType ?? defaultType ?? 'OTH');
	const plannedDay = $derived(chosenPlannedDay ?? (target.kind === 'day' ? target.day : ''));
	// A day column whose plan was removed still adds to its sprint, just without a day.
	const postedTarget = $derived(target.kind === 'day' && !plannedDay ? 'sprint' : target.kind);

	const MESSAGES: Record<string, string> = {
		required: 'Give the todo a title.',
		'no-aspect': 'Pick an aspect.',
		'no-active-sprint': 'There is no running sprint to add this to.',
		'day-outside-sprint': 'That day is not part of the sprint.'
	};

	function clear() {
		title = '';
		notes = '';
		chosenAspectId = null;
		priority = 0;
		chosenDueDate = null;
		chosenPlannedDay = null;
		startTime = endTime = '';
		projectId = '';
		chosenClassId = null;
		chosenType = null;
		checklist = [];
		error = null;
	}

	$effect(() => {
		if (open) titleInput?.focus();
	});

	function close() {
		open = false;
		clear();
	}

	async function added() {
		clear();
		// Desktop keeps the card open for the next capture; the phone sheet and the dialog step aside.
		if (desktop.current && variant === 'inline') titleInput?.focus();
		else open = false;
	}

	async function checklistKey(e: KeyboardEvent, i: number) {
		if (e.key !== 'Enter') return;
		e.preventDefault();
		if (checklist[i].trim() && i === checklist.length - 1) checklist.push('');
		await tick();
		(e.currentTarget as HTMLElement).closest('ul')?.querySelectorAll('input')[i + 1]?.focus();
	}
</script>

{#snippet form()}
	<form
		method="POST"
		action="/todos?/create"
		aria-label="New todo"
		use:enhance={submit({ onerror: (e) => (error = e), onsuccess: added })}
	>
		<input type="hidden" name="target" value={postedTarget} />

		<input
			class="title"
			name="title"
			placeholder="Add a todo"
			aria-label="Title"
			autocomplete="off"
			aria-invalid={error?.field === 'title'}
			bind:value={title}
			bind:this={titleInput}
			onkeydown={(e) => e.key === 'Escape' && desktop.current && variant === 'inline' && close()}
		/>
		<textarea class="notes" name="notes" placeholder="Notes" aria-label="Notes" rows="1" bind:value={notes}
		></textarea>

		{#if checklist.length}
			<ul class="checklist">
				{#each checklist as _, i (i)}
					<li>
						<i aria-hidden="true"></i>
						<input
							name="checklist"
							placeholder="Checklist item"
							aria-label="Checklist item {i + 1}"
							bind:value={checklist[i]}
							onkeydown={(e) => checklistKey(e, i)}
						/>
					</li>
				{/each}
			</ul>
		{/if}

		<TodoFields
			{aspects}
			bind:aspectId={() => aspectId, (id) => (chosenAspectId = id)}
			bind:priority
			bind:dueDate={() => dueDate, (d) => (chosenDueDate = d)}
			bind:projectId
			bind:classId={() => classId, (id) => (chosenClassId = id)}
			bind:type={() => type, (t) => (chosenType = t)}
			planned
			bind:plannedDay={() => plannedDay, (d) => (chosenPlannedDay = d)}
			bind:startTime
			bind:endTime
		>
			<Chip icon="list-checks" pressed={checklist.length > 0} onclick={() => (checklist = checklist.length ? [] : [''])}>
				Checklist
			</Chip>
		</TodoFields>

		{#if error}
			<p class="error" role="alert">{MESSAGES[error.error] ?? planError(error) ?? `Couldn’t add the todo (${error.error}).`}</p>
		{/if}

		<footer>
			{#if variant === 'dialog' && target.kind === 'backlog'}
				<span class="hint">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.inbox} /></svg>Goes to the backlog
				</span>
			{/if}
			<Button type="button" variant={variant === 'dialog' ? 'secondary' : 'quiet'} onclick={close}>Cancel</Button>
			<Button type="submit" variant="primary">Add todo</Button>
		</footer>
	</form>
{/snippet}

{#if variant === 'inline'}
	<div class="quick-add">
		{#if open && desktop.current}
			<div class="card">{@render form()}</div>
		{:else if compactLabel && desktop.current}
			<button type="button" class="plus" aria-label={compactLabel} title={compactLabel} onclick={() => (open = true)}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>
			</button>
		{:else}
			<button type="button" class="field" onclick={() => (open = true)}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>Add a todo
			</button>
		{/if}
	</div>
{/if}

{#if !desktop.current || variant === 'dialog'}
	<Sheet open={open} title="New todo" onclose={close}>{@render form()}</Sheet>
{/if}

<style>
	.field {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		height: 46px;
		padding: 0 var(--space-4);
		border: 1px solid var(--line);
		border-radius: var(--radius-group);
		background: var(--surface);
		color: var(--ink-3);
		text-align: left;
		cursor: text;
	}

	.field:hover {
		color: var(--ink-2);
		border-color: var(--line-strong);
	}

	.field svg {
		width: var(--icon-md);
		height: var(--icon-md);
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		color: var(--accent);
	}

	.plus {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		padding: 0;
		border: 0;
		border-radius: 8px;
		background: none;
		color: var(--ink-3);
		cursor: pointer;
	}

	.plus:hover {
		background: var(--sunk);
		color: var(--ink);
	}

	.plus svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
	}

	.card {
		padding: var(--space-4) var(--space-4) var(--space-3);
		border-radius: var(--radius-lg);
		background: var(--surface);
		box-shadow: var(--shadow-float);
		animation: expand var(--dur-base) var(--ease-out);
	}

	@keyframes expand {
		from {
			opacity: 0;
			transform: scale(0.98);
		}
	}

	input,
	textarea {
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		background: none;
		outline: none;
	}

	input:focus-visible,
	textarea:focus-visible {
		box-shadow: none;
	}

	.title {
		font-weight: var(--weight-medium);
	}

	.title::placeholder {
		color: var(--ink-3);
		font-weight: var(--weight-regular);
	}

	.notes {
		margin: var(--space-1) 0 var(--space-4);
		resize: none;
		field-sizing: content;
		color: var(--ink-2);
	}

	.notes::placeholder,
	.checklist input::placeholder {
		color: var(--ink-3);
	}

	.checklist {
		margin: calc(-1 * var(--space-2)) 0 var(--space-4);
		padding: 0;
		list-style: none;
	}

	.checklist li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 32px;
		border-bottom: 1px solid var(--line);
	}

	.checklist i {
		width: 12px;
		height: 12px;
		flex: none;
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius-pill);
	}

	.hint {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		margin-right: auto;
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.hint svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.error {
		margin-top: var(--space-3);
		color: var(--overdue);
		font-size: var(--text-sm);
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		margin-top: var(--space-4);
		padding-top: var(--space-3);
		border-top: 1px solid var(--line);
	}

	@media (max-width: 767px) {
		.title {
			font-size: var(--text-lg);
		}

		footer {
			border-top: 0;
		}
	}
</style>
