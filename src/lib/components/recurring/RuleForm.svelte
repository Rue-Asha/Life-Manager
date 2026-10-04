<script lang="ts" module>
	import type { Priority, Weekday } from '../../types';

	export const WEEKDAYS: { value: Weekday; short: string; long: string }[] = [
		{ value: 1, short: 'Mon', long: 'Monday' },
		{ value: 2, short: 'Tue', long: 'Tuesday' },
		{ value: 3, short: 'Wed', long: 'Wednesday' },
		{ value: 4, short: 'Thu', long: 'Thursday' },
		{ value: 5, short: 'Fri', long: 'Friday' },
		{ value: 6, short: 'Sat', long: 'Saturday' },
		{ value: 7, short: 'Sun', long: 'Sunday' }
	];

	const PRIORITIES: { value: Priority; label: string }[] = [
		{ value: 0, label: 'None' },
		{ value: 1, label: 'P1' },
		{ value: 2, label: 'P2' },
		{ value: 3, label: 'P3' }
	];

	const MESSAGES: Record<string, string> = {
		required: 'Give the rule a title.',
		'weekdays-required': 'Pick at least one day.',
		'not-found': 'This rule no longer exists.'
	};

	const CLASS_MESSAGES: Record<string, string> = {
		'not-found': 'That class no longer exists.',
		archived: 'That class’s semester is archived.'
	};
</script>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { ASPECT_COLORS } from '../../aspect-style';
	import type { Aspect, ClassRef, ClassType, Id, RecurringRule } from '../../types';
	import { CLASS_TYPES, TYPE_LABELS } from '../../uni';
	import AspectIcon from '../ui/AspectIcon.svelte';
	import Button from '../ui/Button.svelte';
	import { UI_ICONS } from '../ui/icons';

	let {
		aspects,
		rule = null,
		oncancel,
		onsaved,
		ondelete
	}: {
		aspects: Aspect[];
		rule?: RecurringRule | null;
		oncancel: () => void;
		onsaved: () => void;
		ondelete?: () => void;
	} = $props();

	const id = $props.id();
	let failure = $state<{ error: string; field?: string } | null>(null);
	// The form is re-created for every open, so the initial checklist is all it needs from `rule`.
	// svelte-ignore state_referenced_locally
	let checklist = $state([...(rule?.checklist ?? [])]);
	const fieldError = (field: string) => (failure?.field === field ? failure : null);

	// svelte-ignore state_referenced_locally
	let aspectId = $state<Id>(rule?.aspectId ?? aspects[0].id);
	// svelte-ignore state_referenced_locally
	let classId = $state<Id | ''>(rule?.classId ?? '');
	// svelte-ignore state_referenced_locally
	let type = $state<ClassType>(rule?.type ?? 'OTH');
	const classes = $derived(((page.data.classes as ClassRef[] | undefined) ?? []).filter((c) => !c.archived));
	const classShown = $derived(aspectId === (page.data.uniAspectId ?? null) && classes.length > 0);
</script>

<form
	method="POST"
	action={rule ? '?/update' : '?/create'}
	novalidate
	use:enhance={() =>
		async ({ result, update }) => {
			if (result.type === 'failure') {
				failure = result.data as { error: string; field?: string };
				return;
			}
			onsaved();
			await update();
		}}
>
	{#if rule}<input type="hidden" name="id" value={rule.id} />{/if}

	<div class="field">
		<label class="label" for="{id}-title">Title</label>
		<input
			id="{id}-title"
			class="input"
			name="title"
			value={rule?.title ?? ''}
			placeholder="Gym, call home, laundry"
			autocomplete="off"
			aria-invalid={fieldError('title') ? true : undefined}
			aria-describedby={fieldError('title') ? `${id}-error` : undefined}
		/>
		{#if fieldError('title')}
			<p class="error" id="{id}-error" role="alert">{MESSAGES[failure!.error] ?? failure!.error}</p>
		{/if}
	</div>

	<fieldset class="field">
		<legend class="label">Aspect</legend>
		<div class="options">
			{#each aspects as aspect (aspect.id)}
				<label class="aspect" style:--a={ASPECT_COLORS[aspect.color].fg} style:--a-tint={ASPECT_COLORS[aspect.color].tint}>
					<input class="hit" type="radio" name="aspectId" value={aspect.id} bind:group={aspectId} />
					<AspectIcon icon={aspect.icon} color={aspect.color} size="sm" />{aspect.name}
				</label>
			{/each}
		</div>
	</fieldset>

	{#if classShown}
		<div class="field" data-testid="class-field">
			<label class="label" for="{id}-class">Class</label>
			<select
				id="{id}-class"
				class="input"
				name="classId"
				bind:value={classId}
				aria-invalid={fieldError('classId') ? true : undefined}
				aria-describedby={fieldError('classId') ? `${id}-error` : undefined}
			>
				<option value="">No class</option>
				{#each classes as c (c.id)}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>
			{#if fieldError('classId')}
				<p class="error" id="{id}-error" role="alert">{CLASS_MESSAGES[failure!.error] ?? failure!.error}</p>
			{/if}
		</div>

		<fieldset class="field" data-testid="type-field">
			<legend class="label">Type</legend>
			<div class="options">
				{#each CLASS_TYPES as t (t)}
					<label class="choice" title={TYPE_LABELS[t]}>
						<input class="hit" type="radio" name="type" value={t} bind:group={type} />{t}
					</label>
				{/each}
			</div>
		</fieldset>
	{/if}

	<fieldset
		class="field"
		class:invalid={fieldError('weekdays')}
		aria-describedby={fieldError('weekdays') ? `${id}-error` : undefined}
	>
		<legend class="label">Repeats on</legend>
		<div class="days">
			{#each WEEKDAYS as day (day.value)}
				<label class="day">
					<input
						class="hit"
						type="checkbox"
						name="weekday"
						value={day.value}
						aria-label={day.long}
						aria-invalid={fieldError('weekdays') ? true : undefined}
						checked={rule?.weekdays.includes(day.value) ?? false}
					/>
					{day.short}
				</label>
			{/each}
		</div>
		{#if fieldError('weekdays')}
			<p class="error" id="{id}-error" role="alert">{MESSAGES[failure!.error] ?? failure!.error}</p>
		{/if}
	</fieldset>

	<fieldset class="field">
		<legend class="label">Priority</legend>
		<div class="options">
			{#each PRIORITIES as p (p.value)}
				<label class="choice">
					<input
						class="hit"
						type="radio"
						name="priority"
						value={p.value}
						checked={(rule?.priority ?? 0) === p.value}
					/>
					{#if p.value}
						<span class="prio" data-p={p.value} aria-hidden="true"><i></i><i></i><i></i></span>
					{/if}
					{p.label}
				</label>
			{/each}
		</div>
	</fieldset>

	<div class="field">
		<label class="label" for="{id}-notes">Notes</label>
		<textarea id="{id}-notes" class="input" name="notes" rows="2" value={rule?.notes ?? ''}></textarea>
	</div>

	<fieldset class="field">
		<legend class="label">Checklist</legend>
		{#each checklist as _, i}
			<div class="item">
				<input
					class="input"
					name="checklist"
					aria-label="Checklist item {i + 1}"
					autocomplete="off"
					bind:value={checklist[i]}
				/>
				<button
					type="button"
					class="icon-btn"
					aria-label="Remove item {i + 1}"
					onclick={() => checklist.splice(i, 1)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.x} /></svg>
				</button>
			</div>
		{/each}
		<button type="button" class="add-item" onclick={() => checklist.push('')}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>Add item
		</button>
	</fieldset>

	<footer>
		{#if rule && ondelete}
			<Button type="button" variant="quiet" onclick={ondelete}>Delete rule</Button>
		{/if}
		<span class="spacer"></span>
		<Button type="button" variant="quiet" onclick={oncancel}>Cancel</Button>
		<Button type="submit" variant="primary">{rule ? 'Save rule' : 'Add rule'}</Button>
	</footer>
</form>

<style>
	fieldset {
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}

	.field + .field {
		margin-top: var(--space-5);
	}

	.label {
		display: block;
		padding: 0;
		margin-bottom: var(--space-2);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--ink-2);
	}

	.input {
		display: block;
		width: 100%;
		min-height: var(--control-height);
		padding: var(--space-2) var(--space-3);
		border: 0;
		border-radius: var(--radius-sm);
		background: var(--paper-sunk);
		line-height: var(--leading-snug);
	}

	textarea.input {
		resize: vertical;
	}

	.input::placeholder {
		color: var(--ink-3);
	}

	.input[aria-invalid='true'],
	fieldset.invalid .day {
		box-shadow: inset 0 0 0 1px var(--overdue);
	}

	.error {
		margin-top: var(--space-1);
		font-size: var(--text-sm);
		color: var(--overdue);
	}

	.options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.aspect,
	.choice,
	.day {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		height: 30px;
		padding: 0 var(--space-3) 0 var(--space-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--paper);
		color: var(--ink-2);
		font-size: var(--text-sm);
		white-space: nowrap;
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-out),
			border-color var(--dur-fast) var(--ease-out);
	}

	.aspect:has(:checked) {
		background: var(--a-tint);
		border-color: var(--a);
		color: var(--ink);
		font-weight: var(--weight-medium);
	}

	.choice:has(:checked),
	.day:has(:checked) {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--paper);
	}

	label:has(:focus-visible) {
		box-shadow: var(--ring-focus);
	}

	.aspect,
	.choice,
	.day {
		position: relative;
	}

	.hit {
		position: absolute;
		inset: 0;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}

	.days {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: var(--space-1);
	}

	.day {
		height: 40px;
		padding: 0;
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
		background: currentColor;
		opacity: 0.35;
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
		opacity: 1;
	}

	.item {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin-bottom: var(--space-1);
	}

	.icon-btn,
	.add-item {
		display: inline-flex;
		align-items: center;
		border: 0;
		background: none;
		color: var(--ink-2);
		cursor: pointer;
	}

	.icon-btn {
		justify-content: center;
		flex: none;
		width: var(--control-height);
		height: var(--control-height);
		border-radius: var(--radius-md);
	}

	.icon-btn:hover {
		background: var(--paper-hover);
		color: var(--ink);
	}

	.add-item {
		gap: var(--space-1);
		height: var(--control-height);
		padding: 0;
		font-size: var(--text-sm);
	}

	.add-item:hover {
		color: var(--ink);
	}

	svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	footer {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-6);
		padding-top: var(--space-3);
		border-top: 1px solid var(--line);
	}

	.spacer {
		flex: 1;
	}
</style>
