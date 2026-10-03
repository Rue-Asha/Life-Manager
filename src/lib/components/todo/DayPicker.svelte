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
	<label class="pill" class:set={day}>
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.calendar} /></svg>
		<span class="visually-hidden">Day</span>
		<select name="day" value={day ?? ''} onchange={(e) => e.currentTarget.form?.requestSubmit()}>
			<option value="">Unscheduled</option>
			{#each sprintDays as d (d)}
				<option value={d}>{dayLabel(d)}</option>
			{/each}
		</select>
	</label>
</form>

<style>
	.pill {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: 24px;
		padding: 0 var(--space-2);
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		color: var(--ink-3);
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
	}

	.set {
		color: var(--ink-2);
	}

	.pill:focus-within {
		box-shadow: var(--ring-focus);
	}

	svg {
		width: 13px;
		height: 13px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	select {
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
</style>
