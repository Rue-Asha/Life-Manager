<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import type { Aspect, Id, IsoDate, Priority } from '$lib/types';
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
		children
	}: {
		aspects: Aspect[];
		aspectId: Id;
		priority: Priority;
		dueDate: IsoDate | '';
		children?: Snippet;
	} = $props();

	const aspect = $derived(aspects.find((a) => a.id === aspectId) ?? aspects[0]);
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
