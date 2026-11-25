<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { addDays } from '$lib/week';
	import type { Aspect, ClassType, HhMm, Id, IsoDate, Priority, Target } from '$lib/types';
	import Button from '../ui/Button.svelte';
	import { copy } from '$lib/copy';
	import LinkButton from '../button/Button.svelte';
	import { pill } from '../shell/pill';
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
		sprintWeekStart = null,
		reviewRequired = false,
		compactLabel,
		open = $bindable(false)
	}: {
		aspects: Aspect[];
		target: Target;
		defaultAspectId?: Id;
		defaultClassId?: Id;
		defaultType?: ClassType;
		defaultDueDate?: IsoDate;
		// `dialog` has no field of its own: something else opens it (the top bar's "New todo", the pill bar's "+"); it states its destination and offers the running sprint.
		variant?: 'inline' | 'dialog';
		// The running sprint's Monday: a planned day in its week sends a backlog-target todo into the sprint.
		sprintWeekStart?: IsoDate | null;
		// While the sprint's review is required, a day in its week is refused, so the hint stays silent.
		reviewRequired?: boolean;
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
	let chosenDest = $state<'sprint' | 'backlog' | null>(null);
	// The form stays rendered while the sheet leaves, then goes: a closed sheet holds no fields for anything to find.
	let shown = $state(false);
	let titleInput = $state<HTMLInputElement>();
	let fields = $state<ReturnType<typeof TodoFields>>();

	const aspectId = $derived(chosenAspectId ?? defaultAspectId ?? aspects[0].id);
	const classId = $derived(chosenClassId ?? defaultClassId ?? '');
	const dueDate = $derived(chosenDueDate ?? defaultDueDate ?? '');
	const type = $derived(chosenType ?? defaultType ?? 'OTH');
	const plannedDay = $derived(chosenPlannedDay ?? (target.kind === 'day' ? target.day : ''));
	const intoSprint = $derived(
		sprintWeekStart !== null && plannedDay >= sprintWeekStart && plannedDay <= addDays(sprintWeekStart, 6)
	);

	// The dialog offers the running sprint unless its review is due; elsewhere the page's target stands.
	const sprintOffered = $derived(sprintWeekStart !== null && !reviewRequired);
	// A day column or the sprint's Unscheduled list adds to the sprint, even once its plan is removed.
	const dest = $derived(chosenDest ?? (target.kind === 'backlog' ? 'backlog' : 'sprint'));
	const toSprint = $derived(variant === 'dialog' ? (sprintOffered && dest === 'sprint') || (intoSprint && !reviewRequired) : intoSprint);
	// A day column whose plan was removed still adds to its sprint, just without a day.
	const postedTarget = $derived(
		variant === 'dialog' ? (sprintOffered && dest === 'sprint' ? 'sprint' : 'backlog') : target.kind === 'day' && !plannedDay ? 'sprint' : target.kind
	);

	const MESSAGES: Record<string, string> = {
		required: copy.quickAdd.missingTitle,
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
		fields?.forget();
		projectId = '';
		chosenClassId = null;
		chosenType = null;
		checklist = [];
		chosenDest = null;
		error = null;
	}

	$effect(() => {
		if (open) {
			shown = true;
			titleInput?.focus();
			return;
		}
		const gone = setTimeout(() => (shown = false), 300);
		return () => clearTimeout(gone);
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
		<textarea class="notes" name="notes" placeholder="Add a description" aria-label="Description" rows="1" bind:value={notes}
		></textarea>

		<TodoFields
			bind:this={fields}
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

		{#if error}
			<p class="error" role="alert">{MESSAGES[error.error] ?? planError(error) ?? `Couldn’t add the todo (${error.error}).`}</p>
		{/if}

		{#if variant === 'dialog'}
			{#if sprintWeekStart !== null}
				<div class="dest">
					<span class="choice-host">
						<div class="choice" role="group" aria-label="Add to" data-pill use:pill>
							<button type="button" aria-pressed={toSprint} disabled={reviewRequired} onclick={() => (chosenDest = 'sprint')}>This sprint</button>
							<button type="button" aria-pressed={!toSprint} onclick={() => ((chosenDest = 'backlog'), (chosenPlannedDay = ''))}>Backlog</button>
						</div>
					</span>
					{#if reviewRequired}
						<p class="note">The sprint needs its review first.</p>
						<LinkButton href="/sprint/review" variant="secondary" size="s" onclick={() => (open = false)}>{copy.quickAdd.reviewLink}</LinkButton>
					{/if}
				</div>
			{/if}
			<p class="line" role="status">{toSprint ? copy.quickAdd.toSprint : copy.quickAdd.toBacklog}</p>
		{/if}

		<footer>
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
	<Sheet open={open} title="New todo" onclose={close}>{#if shown}{@render form()}{/if}</Sheet>
{/if}

<style>
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
		min-block-size: var(--target);
		font-weight: var(--weight-medium);
	}

	.title::placeholder {
		color: var(--ink-muted);
		font-weight: var(--weight-regular);
	}

	.notes {
		min-block-size: var(--target);
		margin: var(--space-1) 0 var(--space-4);
		resize: none;
		field-sizing: content;
		color: var(--ink-secondary);
	}

	.notes::placeholder,
	.checklist input::placeholder {
		color: var(--ink-muted);
	}

	.checklist {
		margin: var(--space-3) 0 0;
		padding: 0;
		list-style: none;
	}

	.checklist li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 32px;
		border-bottom: 1px solid var(--hairline);
	}

	.checklist i {
		width: 12px;
		height: 12px;
		flex: none;
		border: 1.5px solid var(--edge-control);
		border-radius: var(--radius-pill);
	}

	.dest {
		display: grid;
		gap: var(--space-2);
		justify-items: start;
		margin-top: var(--space-4);
	}

	.choice-host {
		position: relative;
		display: inline-block;
		max-inline-size: 100%;
	}

	.choice {
		display: inline-flex;
		gap: var(--space-0-5);
		max-inline-size: 100%;
		padding: var(--space-1);
		border-radius: var(--radius-pill);
		background: var(--surface-sunken);
	}

	.choice > button {
		min-block-size: max(var(--control-height-s), var(--target));
		padding: 0 var(--space-4);
		border: 0;
		border-radius: var(--radius-pill);
		background: none;
		color: var(--ink);
		font-family: var(--font-ui);
		font-size: var(--type-label-size);
		font-weight: var(--type-label-weight);
		white-space: nowrap;
	}

	.choice > button[aria-pressed='true'] {
		background: var(--surface-inverse);
		color: var(--ink-on-inverse);
	}

	.choice > button:disabled {
		opacity: var(--disabled-opacity);
		cursor: default;
	}

	@media (hover: hover) {
		.choice > button:not([aria-pressed='true']):not(:disabled):hover {
			background: var(--surface-tint);
		}
	}

	.choice > button:focus-visible {
		outline-offset: calc(-1 * var(--focus-width));
	}

	.line {
		margin: var(--space-3) 0 0;
		font-size: var(--type-body-s-size);
		font-weight: var(--weight-semibold);
		color: var(--ink);
	}

	.note {
		margin: 0;
		font-size: var(--type-caption-size);
		color: var(--ink-secondary);
	}

	.error {
		margin-top: var(--space-3);
		color: var(--danger);
		font-size: var(--type-label-size);
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		margin-top: var(--space-4);
		padding-top: var(--space-3);
		border-top: 1px solid var(--hairline);
	}

	@media (max-width: 767px) {
		.title {
			font-size: var(--type-body-size);
		}

		footer {
			border-top: 0;
		}
	}
</style>
