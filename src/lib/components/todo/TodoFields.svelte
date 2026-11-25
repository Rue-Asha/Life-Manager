<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import type { Aspect, ClassRef, ClassType, HhMm, Id, IsoDate, Priority, ProjectRef, Status } from '$lib/types';
	import { endAfter, lengthLabel, nextHour, shiftEnd, slotLength } from '$lib/slot';
	import { CLASS_TYPES, TYPE_LABELS } from '$lib/uni';
	import Field from '../field/Field.svelte';
	import Select from '../select/Select.svelte';
	import Button from '../ui/Button.svelte';
	import { STATUS_LABELS } from './StatusControl.svelte';

	// The fields shared by QuickAdd and TodoEditor, on the field and select primitives: native selects and date and time
	// inputs, so phones get their own pickers. `readonly` locks them all (a todo of an archived class).
	let {
		aspects,
		aspectId = $bindable(),
		priority = $bindable(),
		dueDate = $bindable(),
		projectId = $bindable(''),
		classId = $bindable(''),
		type = $bindable('OTH'),
		planned = false,
		plannedDay = $bindable(''),
		startTime = $bindable(''),
		endTime = $bindable(''),
		linkedId = null,
		clearProject = false,
		clearClass = false,
		showStatus = false,
		status = $bindable('todo'),
		readonly = false,
		children
	}: {
		aspects: Aspect[];
		aspectId: Id;
		priority: Priority;
		dueDate: IsoDate | '';
		projectId?: Id | '';
		classId?: Id | '';
		type?: ClassType;
		planned?: boolean;
		plannedDay?: IsoDate | '';
		startTime?: HhMm | '';
		endTime?: HhMm | '';
		linkedId?: Id | null;
		clearProject?: boolean;
		clearClass?: boolean;
		showStatus?: boolean;
		status?: Status;
		readonly?: boolean;
		children?: Snippet;
	} = $props();

	// An implemented project stays selectable only on the todo already linked to it.
	const projects = $derived(
		((page.data.projects as ProjectRef[] | undefined) ?? []).filter((p) => p.status !== 'implemented' || p.id === linkedId)
	);
	const projectShown = $derived(aspectId === (page.data.itAspectId ?? null) && projects.length > 0);

	// A todo of an archived class is read-only and still names its class.
	const classes = $derived(((page.data.classes as ClassRef[] | undefined) ?? []).filter((c) => !c.archived || readonly));
	const classShown = $derived(aspectId === (page.data.uniAspectId ?? null) && classes.length > 0);
	const typeShown = $derived(classShown && classes.some((c) => c.id === classId));

	const LENGTHS = [
		[30, '30m'],
		[60, '1h'],
		[90, '1h30'],
		[120, '2h']
	] as const;
	const length = $derived(startTime && endTime ? slotLength(startTime, endTime) : null);
	const backwards = $derived(startTime !== '' && endTime !== '' && length === null);
	// A start being retyped reads '' until it is complete again. Clearing it clears the end, but the
	// slot is kept so the end comes back, moved along, once a new start is in.
	let cleared: { startTime: HhMm; endTime: HhMm | '' } | null = null;

	// QuickAdd keeps this mounted across todos, so it drops the remembered slot itself.
	export function forget() {
		cleared = null;
	}

	function setStart(value: HhMm | '') {
		if (!value) {
			if (startTime) cleared = { startTime, endTime };
			startTime = endTime = '';
			return;
		}
		const from = startTime ? { startTime, endTime } : endTime ? null : cleared;
		if (from?.endTime) endTime = shiftEnd(from.startTime, value, from.endTime) ?? '';
		startTime = value;
		cleared = null;
	}

	function addTime() {
		startTime = nextHour(new Date());
		endTime = endAfter(startTime, 60) ?? '';
	}
</script>

<div class="fields">
	<div class="cols">
		<Select label="Aspect" name="aspectId" disabled={readonly} bind:value={() => String(aspectId), (v) => (aspectId = Number(v))}>
			{#each aspects as a (a.id)}<option value={String(a.id)}>{a.name}</option>{/each}
		</Select>
		<Select label="Priority" name="priority" disabled={readonly} bind:value={() => String(priority), (v) => (priority = Number(v) as Priority)}>
			<option value="0">No priority</option>
			<option value="1">Priority 1</option>
			<option value="2">Priority 2</option>
			<option value="3">Priority 3</option>
		</Select>
		{#if showStatus}
			<Select label="Status" disabled={readonly} bind:value={() => status, (v) => (status = v as Status)}>
				{#each Object.entries(STATUS_LABELS) as [value, label] (value)}<option {value}>{label}</option>{/each}
			</Select>
		{/if}
		<div class="with-clear">
			<Field type="date" label="Due" aria-label="Due date" name="dueDate" {readonly} bind:value={dueDate} onclick={(e) => !readonly && e.currentTarget.showPicker?.()} />
			{#if dueDate && !readonly}<Button variant="quiet" size="s" type="button" class="clear" onclick={() => (dueDate = '')}>Clear due date</Button>{/if}
		</div>
		{#if planned}
			<div class="with-clear">
				<Field
					type="date"
					label="Planned"
					name="day"
					{readonly}
					bind:value={plannedDay}
					oninput={() => plannedDay || ((startTime = endTime = ''), (cleared = null))}
					onclick={(e) => !readonly && e.currentTarget.showPicker?.()}
				/>
				{#if plannedDay && !readonly}
					<Button variant="quiet" size="s" type="button" class="clear" onclick={() => ((plannedDay = startTime = endTime = ''), (cleared = null))}>Remove plan</Button>
				{/if}
			</div>
		{/if}
	</div>

	{#if planned && plannedDay}
		<div class="slot" role="group" aria-label="Time">
			<div class="cols">
				<Field type="time" label="From" name="startTime" {readonly} bind:value={() => startTime, setStart} />
				<Field type="time" label="To" name="endTime" {readonly} bind:value={endTime} />
			</div>
			{#if !readonly}
				<div class="cluster">
					{#if startTime}
						{#if length}<span class="length num">{lengthLabel(length)}</span>{/if}
						<span class="lengths" role="group" aria-label="Length">
							{#each LENGTHS as [minutes, label] (minutes)}
								<button
									type="button"
									class="chip"
									aria-pressed={length === minutes}
									disabled={endAfter(startTime, minutes) === null}
									onclick={() => (endTime = endAfter(startTime, minutes)!)}>{label}</button
								>
							{/each}
						</span>
						<Button variant="quiet" size="s" type="button" onclick={() => ((startTime = endTime = ''), (cleared = null))}>Clear time</Button>
					{:else}
						<button type="button" class="chip" onclick={addTime}>Add time</button>
					{/if}
				</div>
			{/if}
			{#if backwards}<p class="hint">End must be after start</p>{/if}
		</div>
	{/if}

	{#if projectShown}
		<Select label="Project" name="projectId" disabled={readonly} hint="Shown for the IT aspect only." bind:value={() => String(projectId), (v) => (projectId = v === '' ? '' : Number(v))}>
			<option value="">No project</option>
			{#each projects as p (p.id)}<option value={String(p.id)}>{p.name}</option>{/each}
		</Select>
	{:else if clearProject}
		<input type="hidden" name="projectId" value="" />
	{/if}

	{#if classShown || typeShown}
		<div class="cols">
			{#if classShown}
				<Select label="Class" name="classId" disabled={readonly} hint="Shown for the Uni aspect only." bind:value={() => String(classId), (v) => (classId = v === '' ? '' : Number(v))}>
					<option value="">No class</option>
					{#each classes as c (c.id)}<option value={String(c.id)}>{c.name}</option>{/each}
				</Select>
			{/if}
			{#if typeShown}
				<div class="type">
					<span class="label" id="type-label">Type</span>
					<span class="choice" role="group" aria-label="Type">
						{#each CLASS_TYPES as t (t)}
							<button type="button" aria-pressed={type === t} title={TYPE_LABELS[t]} disabled={readonly} onclick={() => (type = t)}>{t}</button>
						{/each}
					</span>
				</div>
				<input type="hidden" name="type" value={type} />
			{/if}
		</div>
	{:else if clearClass}
		<input type="hidden" name="classId" value="" />
		<input type="hidden" name="type" value="" />
	{/if}

	{@render children?.()}
</div>

<style>
	.fields {
		display: grid;
		gap: var(--space-4);
		min-inline-size: 0;
	}
	.fields > :global(.chip) {
		justify-self: start;
	}
	.cols {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
		align-items: start;
		gap: var(--space-3) var(--space-4);
		min-inline-size: 0;
	}
	.with-clear {
		display: grid;
		gap: var(--space-1);
		min-inline-size: 0;
	}
	/* "Clear due date" and "Remove plan" belong to the field above them, so they start at its edge. */
	.with-clear > :global(.clear) {
		justify-self: start;
	}
	.slot {
		display: grid;
		gap: var(--space-3);
		min-inline-size: 0;
	}
	.cluster,
	.lengths {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}
	.chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-block-size: max(var(--control-height-xs), var(--target));
		min-inline-size: var(--target-touch);
		padding-inline: var(--space-3-5);
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--surface-raised);
		box-shadow: var(--ring-control);
		color: var(--ink);
		font-family: var(--font-ui);
		font-size: var(--type-label-size);
		font-weight: var(--type-label-weight);
	}
	.chip[aria-pressed='true'] {
		background: var(--surface-inverse);
		box-shadow: none;
		color: var(--ink-on-inverse);
	}
	.chip:disabled {
		opacity: var(--disabled-opacity);
	}
	@media (hover: hover) {
		.chip:not([aria-pressed='true']):not(:disabled):hover {
			background: var(--surface-sunken);
		}
	}
	.length {
		font-size: var(--type-body-s-size);
		color: var(--ink-secondary);
	}
	.hint {
		margin: 0;
		font-size: var(--type-caption-size);
		color: var(--ink-secondary);
	}
	.type {
		display: grid;
		gap: var(--space-1-5);
		align-content: start;
	}
	.label {
		font-size: var(--type-label-size);
		line-height: var(--type-label-line);
		font-weight: var(--type-label-weight);
	}
	/* A choice: a pill track with the charcoal pill on the picked one. */
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
	}
	.choice > button[aria-pressed='true'] {
		background: var(--surface-inverse);
		color: var(--ink-on-inverse);
	}
	.choice > button:disabled {
		opacity: var(--disabled-opacity);
	}
	@media (hover: hover) {
		.choice > button:not([aria-pressed='true']):not(:disabled):hover {
			background: var(--surface-tint);
		}
	}
	.choice > button:focus-visible {
		outline-offset: calc(-1 * var(--focus-width));
	}
</style>
