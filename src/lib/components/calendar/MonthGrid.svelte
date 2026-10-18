<script lang="ts">
	import { dateLabel } from '$lib/components/todo/format';
	import type { CalendarEntry } from '$lib/server/calendar';
	import type { Aspect, IsoDate } from '$lib/types';
	import { UI_ICONS } from '../ui/icons';
	import { entryColor } from './DayList.svelte';

	let {
		month,
		weeks,
		entries,
		selected,
		today,
		aspects,
		onselect
	}: {
		month: string;
		weeks: IsoDate[][];
		entries: Record<IsoDate, CalendarEntry[]>;
		selected: IsoDate;
		today: IsoDate;
		aspects: Aspect[];
		onselect: (day: IsoDate) => void;
	} = $props();

	const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
</script>

<div class="grid" data-testid="calendar-grid" role="group" aria-label="Month grid">
	{#each WEEKDAYS as name (name)}
		<span class="weekday" aria-hidden="true">{name}</span>
	{/each}
	{#each weeks.flat() as day (day)}
		{@const outside = !day.startsWith(month)}
		{@const list = entries[day] ?? []}
		<button
			type="button"
			class="cell"
			class:today={day === today}
			data-testid="calendar-cell-{day}"
			data-outside={outside}
			aria-pressed={day === selected}
			disabled={outside}
			onclick={() => onselect(day)}
		>
			<span class="visually-hidden">{dateLabel(day)}</span>
			<span class="num day-num" aria-hidden="true">{Number(day.slice(8))}</span>
			{#each list.slice(0, 3) as entry, i (i)}
				<span class="entry" data-testid="calendar-entry" data-kind={entry.kind} style:--a={entryColor(entry, aspects)}>
					<i class="mark" class:ring={entry.kind === 'projection'} data-testid="calendar-entry-mark"></i>
					<span class="title" class:done={entry.kind === 'todo' && entry.done}>{entry.title}</span>
					{#if entry.kind === 'projection'}
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.repeat} /></svg>
						<span class="visually-hidden">Projected</span>
					{/if}
				</span>
			{/each}
			{#if list.length > 3}<span class="more">+{list.length - 3} more</span>{/if}
		</button>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 1px;
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: var(--radius-group);
		background: var(--line);
	}

	.weekday {
		padding: var(--space-2);
		background: var(--surface);
		color: var(--ink-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		text-align: center;
	}

	.cell {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 3px;
		min-width: 0;
		min-height: 112px;
		padding: var(--space-2);
		border: 0;
		border-radius: 0;
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.cell:hover:not(:disabled) {
		background: var(--hover);
	}

	.cell[aria-pressed='true'] {
		box-shadow: inset 0 0 0 2px var(--accent);
	}

	.cell:disabled {
		background: var(--canvas);
		color: var(--ink-3);
		cursor: default;
	}

	.day-num {
		align-self: flex-start;
		min-width: 24px;
		padding: 0 var(--space-1);
		border-radius: var(--radius-pill);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		text-align: center;
	}

	.today .day-num {
		background: var(--accent);
		color: var(--ink-on-accent);
	}

	.entry {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		min-width: 0;
		font-size: var(--text-xs);
		line-height: var(--leading-snug);
	}

	.mark {
		flex: none;
		width: 8px;
		height: 8px;
		border-radius: var(--radius-pill);
		background: var(--a);
		box-sizing: border-box;
	}

	.mark.ring {
		background: transparent;
		border: 1.5px solid var(--a);
	}

	.title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.title.done {
		color: var(--ink-3);
		text-decoration: line-through;
	}

	.entry svg {
		flex: none;
		width: 11px;
		height: 11px;
		margin-left: auto;
		fill: none;
		stroke: var(--ink-3);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.more {
		color: var(--ink-3);
		font-size: var(--text-xs);
	}
</style>
