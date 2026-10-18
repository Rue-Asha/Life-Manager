<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Id, IsoDate } from '$lib/types';
	import { UI_ICONS } from '../ui/icons';
	import { submit } from './form';
	import { dayLabel } from './format';

	let { todoId, day, sprintDays }: { todoId: Id; day: IsoDate | null; sprintDays: IsoDate[] } = $props();
</script>

<form method="POST" action="/todos?/setDay" use:enhance={submit()}>
	<input type="hidden" name="id" value={todoId} />
	<!-- A set day reads as plain text; without one only a calendar glyph shows and the select lies over it. -->
	<label class="day" class:unset={!day}>
		{#if !day}<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.calendar} /></svg>{/if}
		<span class="visually-hidden">{day ? 'Day' : 'Pick a day'}</span>
		<select name="day" value={day ?? ''} onchange={(e) => e.currentTarget.form?.requestSubmit()}>
			<option value="">Unscheduled</option>
			{#each sprintDays as d (d)}
				<option value={d}>{dayLabel(d)}</option>
			{/each}
		</select>
	</label>
</form>

<style>
	.day {
		position: relative;
		display: inline-flex;
		align-items: center;
		height: 24px;
		padding: 0 var(--space-1);
		border-radius: 6px;
		color: var(--ink-2);
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
	}

	.day:hover {
		background: var(--sunk);
	}

	.day:focus-within {
		box-shadow: var(--ring-focus);
	}

	.unset {
		justify-content: center;
		width: 24px;
		padding: 0;
		color: var(--ink-3);
	}

	svg {
		width: 16px;
		height: 16px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.85;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* Without it a select is as wide as its longest option, "Unscheduled". */
	select {
		field-sizing: content;
		appearance: none;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font-size: inherit;
		cursor: pointer;
	}

	select:focus-visible {
		box-shadow: none;
	}

	.unset select {
		position: absolute;
		inset: 0;
		width: 100%;
		opacity: 0;
	}
</style>
