<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import { page } from '$app/state';
	import type { Aspect, ClassRef, ClassType, HhMm, Id, IsoDate, Priority, ProjectRef } from '$lib/types';
	import { endAfter, lengthLabel, nextHour, shiftEnd, slotLength } from '$lib/slot';
	import { CLASS_TYPES, TYPE_LABELS } from '$lib/uni';
	import AspectIcon from '../ui/AspectIcon.svelte';
	import { UI_ICONS } from '../ui/icons';
	import { dateLabel } from './format';

	// The aspect, priority and due chips shared by QuickAdd and TodoEditor. Each chip is a native
	// select or date input laid invisibly over its label, so phones get their own pickers.
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
		children?: Snippet;
	} = $props();

	const aspect = $derived(aspects.find((a) => a.id === aspectId) ?? aspects[0]);

	// An implemented project stays selectable only on the todo already linked to it.
	const projects = $derived(
		((page.data.projects as ProjectRef[] | undefined) ?? []).filter((p) => p.status !== 'implemented' || p.id === linkedId)
	);
	const projectShown = $derived(aspectId === (page.data.itAspectId ?? null) && projects.length > 0);
	const project = $derived(projects.find((p) => p.id === projectId));

	const classes = $derived(((page.data.classes as ClassRef[] | undefined) ?? []).filter((c) => !c.archived));
	const classShown = $derived(aspectId === (page.data.uniAspectId ?? null) && classes.length > 0);
	const cls = $derived(classes.find((c) => c.id === classId));
	const typeShown = $derived(classShown && cls !== undefined);

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

<div class="chips">
	<label class="chip tag" style:background={ASPECT_COLORS[aspect.color].tint}>
		<AspectIcon icon={aspect.icon} color={aspect.color} size="sm" /><span class="field">Aspect</span>
		<span class="value">{aspect.name}</span>
		<select name="aspectId" bind:value={aspectId} aria-label="Aspect">
			{#each aspects as a (a.id)}
				<option value={a.id}>{a.name}</option>
			{/each}
		</select>
	</label>

	{#if classShown}
		<label class="chip" data-testid="class-field">
			{#if cls}<AspectIcon icon={cls.icon} color={cls.color} size="sm" />{/if}
			<span class="field">Class</span>
			<span class="label value">{cls?.name ?? 'No class'}</span>
			<select name="classId" bind:value={classId} aria-label="Class">
				<option value="">No class</option>
				{#each classes as c (c.id)}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>
		</label>
	{:else if clearClass}
		<input type="hidden" name="classId" value="" />
	{/if}

	{#if typeShown}
		<span class="seg" role="group" aria-label="Type" data-testid="type-field">
			{#each CLASS_TYPES as t (t)}
				<button type="button" aria-pressed={type === t} title={TYPE_LABELS[t]} onclick={() => (type = t)}>{t}</button>
			{/each}
		</span>
		<input type="hidden" name="type" value={type} />
	{:else if clearClass}
		<input type="hidden" name="type" value="" />
	{/if}

	<label class="chip" class:pressed={priority}>
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.flag} /></svg>
		<span class="field">Priority</span>
		<span class="value" class:unset={!priority}>{priority ? `Priority ${priority}` : 'Priority'}</span>
		<select name="priority" bind:value={priority} aria-label="Priority">
			<option value={0}>No priority</option>
			<option value={1}>Priority 1</option>
			<option value={2}>Priority 2</option>
			<option value={3}>Priority 3</option>
		</select>
	</label>

	<span class="due">
		<label class="chip" class:pressed={dueDate}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.calendar} /></svg>
			<span class="field">Due</span>
			<span class="num value" class:unset={!dueDate}>{dueDate ? dateLabel(dueDate) : 'Due'}</span>
			<input
				type="date"
				name="dueDate"
				aria-label="Due date"
				bind:value={dueDate}
				onclick={(e) => e.currentTarget.showPicker()}
			/>
		</label>
		{#if dueDate}
			<button type="button" class="clear" aria-label="Clear due date" onclick={() => (dueDate = '')}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.x} /></svg>
			</button>
		{/if}
	</span>

	{#if planned}
		<span class="due">
			<label class="chip" class:pressed={plannedDay}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['calendar-days']} /></svg>
				<span class="field">Planned</span>
				<span class="num value" class:unset={!plannedDay}>{plannedDay ? dateLabel(plannedDay) : 'Planned'}</span>
				<input
					type="date"
					name="day"
					aria-label="Planned"
					bind:value={plannedDay}
					oninput={() => plannedDay || ((startTime = endTime = ''), (cleared = null))}
					onclick={(e) => e.currentTarget.showPicker()}
				/>
			</label>
			{#if plannedDay}
				<button type="button" class="clear" aria-label="Remove plan" onclick={() => ((plannedDay = startTime = endTime = ''), (cleared = null))}>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.x} /></svg>
				</button>
			{/if}
		</span>
		{#if plannedDay}
			<div class="slot" role="group" aria-label="Time" data-testid="slot-field">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.clock} /></svg>
				<span class="field">Time</span>
				<span class="times">
					<input type="time" name="startTime" aria-label="From" bind:value={() => startTime, setStart} />
					<span class="arrow" aria-hidden="true">→</span>
					<input type="time" name="endTime" aria-label="To" bind:value={endTime} />
				</span>
				{#if startTime}
					{#if length}<span class="length num" data-testid="slot-length">{lengthLabel(length)}</span>{/if}
					<span class="lengths" role="group" aria-label="Length">
						{#each LENGTHS as [minutes, label] (minutes)}
							<button
								type="button"
								aria-pressed={length === minutes}
								disabled={endAfter(startTime, minutes) === null}
								onclick={() => (endTime = endAfter(startTime, minutes)!)}>{label}</button
							>
						{/each}
					</span>
					<button type="button" class="clear" aria-label="Clear time" onclick={() => ((startTime = endTime = ''), (cleared = null))}>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.x} /></svg>
					</button>
				{:else}
					<button type="button" class="add-time" onclick={addTime}>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>Add time
					</button>
				{/if}
				{#if backwards}<span class="hint">End must be after start</span>{/if}
			</div>
		{/if}
	{/if}

	{#if projectShown}
		<label class="chip" class:pressed={project} data-testid="project-field">
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.folder} /></svg>
			<span class="field">Project</span>
			<span class="label value" class:unset={!project}>{project?.name ?? 'Project'}</span>
			<select name="projectId" bind:value={projectId} aria-label="Project">
				<option value="">No project</option>
				{#each projects as p (p.id)}
					<option value={p.id}>{p.name}</option>
				{/each}
			</select>
		</label>
	{:else if clearProject}
		<input type="hidden" name="projectId" value="" />
	{/if}

	{@render children?.()}
</div>

<style>
	.chips {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}

	.chip {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 28px;
		padding: 0 var(--space-3) 0 10px;
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--sunk);
		color: var(--ink-2);
		font-size: var(--text-sm);
		white-space: nowrap;
		cursor: pointer;
	}

	.chip:focus-within {
		box-shadow: var(--ring-focus);
	}

	.pressed {
		background: var(--chrome);
		color: var(--on-chrome);
	}

	.tag {
		color: var(--ink);
		font-weight: var(--weight-medium);
	}

	/* The field's name only shows where the chips become rows (phone). */
	.field {
		display: none;
	}

	.chip select,
	.chip input {
		position: absolute;
		inset: 0;
		width: 100%;
		opacity: 0;
		/* 16px keeps iOS from zooming in when the native picker opens. */
		font-size: 16px;
		cursor: pointer;
	}

	.seg {
		display: inline-flex;
		height: 28px;
		padding: 2px;
		border-radius: var(--radius-pill);
		background: var(--sunk);
	}

	.seg button {
		padding: 0 var(--space-3);
		border: 0;
		border-radius: var(--radius-pill);
		background: none;
		color: var(--ink-2);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		letter-spacing: 0.04em;
		cursor: pointer;
	}

	.seg button[aria-pressed='true'] {
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-pop);
	}

	.label {
		max-width: 160px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.due {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}

	.clear {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		padding: 0;
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--sunk);
		color: var(--ink-2);
		cursor: pointer;
	}

	svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.clear svg {
		width: 14px;
		height: 14px;
	}

	/* The time row sits under the chips, so From → To reads as one line beside its shortcuts. */
	.slot {
		order: 1;
		display: flex;
		flex-basis: 100%;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		color: var(--ink-2);
		font-size: var(--text-sm);
	}

	.times {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	.times input {
		height: 28px;
		padding: 0 var(--space-2);
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--sunk);
		color: var(--ink);
		font: inherit;
		font-variant-numeric: tabular-nums;
	}

	.times input:focus-visible {
		outline: none;
		box-shadow: var(--ring-focus);
	}

	.arrow {
		color: var(--ink-3);
	}

	.length {
		color: var(--ink-3);
	}

	.lengths {
		display: inline-flex;
		height: 28px;
		padding: 2px;
		border-radius: var(--radius-pill);
		background: var(--sunk);
	}

	.lengths button {
		padding: 0 10px;
		border: 0;
		border-radius: var(--radius-pill);
		background: none;
		color: var(--ink-2);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
	}

	.lengths button[aria-pressed='true'] {
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-pop);
	}

	.lengths button:disabled {
		color: var(--ink-3);
		cursor: default;
	}

	.add-time {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: 28px;
		padding: 0 var(--space-3) 0 10px;
		border: 1px dashed var(--line-strong);
		border-radius: var(--radius-pill);
		background: none;
		color: var(--ink-2);
		font-size: var(--text-sm);
		cursor: pointer;
	}

	.add-time:hover {
		background: var(--sunk);
		color: var(--ink);
	}

	.hint {
		flex-basis: 100%;
		color: var(--overdue);
	}

	/* Phone: the chips become one grouped list of rows, "icon · name · value ›" (iOS / C24 settings). */
	@media (max-width: 767px) {
		.chips {
			flex-direction: column;
			align-items: stretch;
			gap: 0;
			border: 1px solid var(--line);
			border-radius: var(--radius-group);
			background: var(--surface);
		}

		.chips > * + * {
			border-top: 1px solid var(--line);
		}

		.chip,
		.chips > :global(button) {
			display: flex;
			gap: var(--space-3);
			width: 100%;
			height: 48px;
			padding: 0 var(--space-4);
			border-radius: 0;
			background: none;
			color: var(--ink);
			font-size: var(--text-md);
			font-weight: var(--weight-regular);
		}

		.chips > :first-child {
			border-radius: var(--radius-group) var(--radius-group) 0 0;
		}

		.chips > :last-child,
		.chips > :last-child .chip {
			border-radius: 0 0 var(--radius-group) var(--radius-group);
		}

		.pressed {
			color: var(--ink);
		}

		.field {
			display: inline;
		}

		.value {
			margin-left: auto;
			color: var(--ink-3);
			font-size: 14px;
		}

		/* An unset field shows only its name; the chip's placeholder would repeat it. */
		.value.unset {
			display: none;
		}

		.chip:has(.unset)::after {
			margin-left: auto;
		}

		.chip::after {
			content: '›';
			margin-left: var(--space-2);
			color: var(--line-strong);
			font-size: var(--text-lg);
		}

		.due {
			display: flex;
		}

		.due .chip {
			flex: 1;
		}

		.clear {
			margin-right: var(--space-3);
		}

		.seg {
			align-self: flex-start;
			margin: var(--space-2) var(--space-4);
		}

		.slot {
			order: 0;
			gap: var(--space-2) var(--space-3);
			min-height: 48px;
			padding: var(--space-2) var(--space-4);
			color: var(--ink);
			font-size: var(--text-md);
		}

		.slot .field {
			margin-right: auto;
		}

		.times {
			flex: 1 1 100%;
		}

		/* 16px keeps iOS from zooming in on the time fields. */
		.times input {
			flex: 1;
			min-width: 0;
			height: 36px;
			font-size: 16px;
		}

		.slot .clear {
			margin-right: 0;
		}

		.lengths {
			height: 32px;
		}

		.label {
			max-width: 55%;
		}
	}
</style>
