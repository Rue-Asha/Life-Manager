<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import { page } from '$app/state';
	import type { Aspect, ClassRef, ClassType, Id, IsoDate, Priority, ProjectRef } from '$lib/types';
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
</script>

<div class="chips">
	<label class="chip tag" style:background={ASPECT_COLORS[aspect.color].tint}>
		<AspectIcon icon={aspect.icon} color={aspect.color} size="sm" />{aspect.name}
		<select name="aspectId" bind:value={aspectId} aria-label="Aspect">
			{#each aspects as a (a.id)}
				<option value={a.id}>{a.name}</option>
			{/each}
		</select>
	</label>

	{#if classShown}
		<label class="chip" data-testid="class-field">
			{#if cls}<AspectIcon icon={cls.icon} color={cls.color} size="sm" />{/if}
			<span class="label">{cls?.name ?? 'No class'}</span>
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
		{priority ? `Priority ${priority}` : 'Priority'}
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
			<span class="num">{dueDate ? dateLabel(dueDate) : 'Due'}</span>
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

	{#if projectShown}
		<label class="chip" class:pressed={project} data-testid="project-field">
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.folder} /></svg>
			<span class="label">{project?.name ?? 'Project'}</span>
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
	}

	.chip:focus-within {
		box-shadow: var(--ring-focus);
	}

	.pressed {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--paper);
	}

	.tag {
		border-color: transparent;
		color: var(--ink);
		font-weight: var(--weight-medium);
	}

	select,
	input {
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
		height: 30px;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.seg button {
		padding: 0 var(--space-3);
		border: 0;
		background: var(--paper);
		color: var(--ink-2);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		letter-spacing: 0.04em;
		cursor: pointer;
	}

	.seg button + button {
		border-left: 1px solid var(--line-strong);
	}

	.seg button[aria-pressed='true'] {
		background: var(--ink);
		color: var(--paper);
	}

	.label {
		max-width: 160px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.due {
		display: inline-flex;
		align-items: center;
	}

	.due:has(.clear) .chip {
		border-radius: var(--radius-sm) 0 0 var(--radius-sm);
	}

	.clear {
		display: grid;
		place-items: center;
		width: 26px;
		height: 30px;
		padding: 0;
		border: 0;
		border-left: 1px solid var(--ink-2);
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
		background: var(--ink);
		color: var(--paper);
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
</style>
