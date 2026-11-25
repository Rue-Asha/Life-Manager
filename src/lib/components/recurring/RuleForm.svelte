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
		'not-found': 'This rule no longer exists.',
		invalid: 'Use a time like 18:00.',
		'end-without-start': 'Set a start time first.',
		'end-before-start': 'End must be after the start.'
	};

	const CLASS_MESSAGES: Record<string, string> = {
		'not-found': 'That class no longer exists.',
		archived: 'That class’s semester is archived.'
	};
</script>

<!--
	The rule form body (lifted from hifi/recurring/RuleForm.svelte), drawn inside the page's Sheet; its footer buttons (Cancel, Delete rule, Add or Save rule)
	live in the sheet's pinned footer and submit this form by its `formId`. Class and Type exist only while the chosen aspect is the Uni aspect.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { Aspect, ClassRef, ClassType, Id, RecurringRule } from '../../types';
	import { CLASS_TYPES } from '../../uni';
	import Field from '../field/Field.svelte';
	import Select from '../select/Select.svelte';
	import Icon from '../shell/Icon.svelte';
	import Button from '../ui/Button.svelte';
	import './recurring.css';

	let { aspects, rule = null, formId, onsaved }: { aspects: Aspect[]; rule?: RecurringRule | null; formId: string; onsaved: () => void } = $props();

	let failure = $state<{ error: string; field?: string } | null>(null);
	const fieldError = (field: string) => (failure?.field === field ? (MESSAGES[failure.error] ?? failure.error) : undefined);
	// The form is re-created for every open, so the initial values are all it needs from `rule`.
	/* svelte-ignore state_referenced_locally */
	let title = $state(rule?.title ?? '');
	/* svelte-ignore state_referenced_locally */
	let aspectId = $state<Id>(rule?.aspectId ?? aspects[0].id);
	/* svelte-ignore state_referenced_locally */
	let classId = $state<Id | ''>(rule?.classId ?? '');
	/* svelte-ignore state_referenced_locally */
	let type = $state<ClassType>(rule?.type ?? 'OTH');
	/* svelte-ignore state_referenced_locally */
	let startTime = $state<string>(rule?.startTime ?? '');
	/* svelte-ignore state_referenced_locally */
	let endTime = $state<string>(rule?.endTime ?? '');
	/* svelte-ignore state_referenced_locally */
	let priority = $state<string>(String(rule?.priority ?? 0));
	/* svelte-ignore state_referenced_locally */
	let notes = $state(rule?.notes ?? '');
	/* svelte-ignore state_referenced_locally */
	let checklist = $state([...(rule?.checklist ?? [])]);

	// A rule keeps its archived class as an option, so saving other edits doesn't unlink it.
	const classes = $derived(((page.data.classes as ClassRef[] | undefined) ?? []).filter((c) => !c.archived || c.id === rule?.classId));
	const classShown = $derived(aspectId === (page.data.uniAspectId ?? null) && classes.length > 0);
	const weekdaysError = $derived(failure?.field === 'weekdays' ? MESSAGES[failure.error] : undefined);
</script>

<form
	id={formId}
	class="hr-form"
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

	<Field label="Title" name="title" placeholder="Gym, call home, laundry" autocomplete="off" data-user bind:value={title} error={fieldError('title')} />

	<fieldset class="hr-fieldset">
		<legend>Aspect</legend>
		<div class="hr-picks">
			{#each aspects as aspect (aspect.id)}
				<label class="hr-pick">
					<input type="radio" name="aspectId" value={aspect.id} bind:group={aspectId} />
					<span><i class="dot" style:--aspect="var(--aspect-{aspect.color})" aria-hidden="true"></i><span data-user>{aspect.name}</span><Icon name="check" size={14} /></span>
				</label>
			{/each}
		</div>
	</fieldset>

	{#if classShown}
		<div class="hr-cols">
			<Select label="Class" name="classId" error={failure?.field === 'classId' ? (CLASS_MESSAGES[failure.error] ?? failure.error) : undefined} bind:value={() => String(classId), (v) => (classId = v === '' ? '' : Number(v))}>
				<option value="">No class</option>
				{#each classes as c (c.id)}<option value={String(c.id)}>{c.name}{c.archived ? ' (archived)' : ''}</option>{/each}
			</Select>
			<Select label="Type" name="type" bind:value={() => type, (v) => (type = v as ClassType)}>
				{#each CLASS_TYPES as t (t)}<option value={t}>{t}</option>{/each}
			</Select>
		</div>
	{/if}

	<fieldset class="hr-fieldset" data-invalid={weekdaysError ? '' : undefined}>
		<legend>Repeats on</legend>
		<div class="hr-picks">
			{#each WEEKDAYS as day (day.value)}
				<label class="hr-pick">
					<input type="checkbox" name="weekday" value={day.value} aria-label={day.long} aria-invalid={weekdaysError ? true : undefined} checked={rule?.weekdays.includes(day.value) ?? false} />
					<span><span aria-hidden="true">{day.short}</span><Icon name="check" size={14} /></span>
				</label>
			{/each}
		</div>
		{#if weekdaysError}<p class="hr-error" role="alert"><Icon name="alert" size={14} />{weekdaysError}</p>{/if}
	</fieldset>

	<fieldset class="hr-fieldset">
		<legend>Time</legend>
		<div class="hr-cols">
			<Field
				type="time"
				label="From"
				name="startTime"
				bind:value={startTime}
				oninput={() => {
					if (!startTime) endTime = '';
				}}
				error={fieldError('startTime')}
			/>
			<Field type="time" label="To" name="endTime" bind:value={endTime} disabled={!startTime} error={fieldError('endTime')} />
		</div>
	</fieldset>

	<Select label="Priority" name="priority" bind:value={priority}>
		{#each PRIORITIES as p (p.value)}<option value={String(p.value)}>{p.label}</option>{/each}
	</Select>

	<Field multiline rows={3} label="Notes" name="notes" data-user bind:value={notes} />

	<fieldset class="hr-fieldset">
		<legend>Checklist</legend>
		<ul class="hr-checklist">
			{#each checklist as _, i (i)}
				<li>
					<Field multiline rows={1} hideLabel label="Checklist item {i + 1}" name="checklist" autocomplete="off" data-user onkeydown={(e) => e.key === 'Enter' && e.preventDefault()} bind:value={checklist[i]} />
					<Button variant="quiet" icon label="Remove item {i + 1}" onclick={() => checklist.splice(i, 1)}><Icon name="trash" /></Button>
				</li>
			{/each}
		</ul>
		<div class="hr-cluster"><Button size="s" onclick={() => checklist.push('')}><Icon name="plus" size={16} />Add item</Button></div>
	</fieldset>
</form>
