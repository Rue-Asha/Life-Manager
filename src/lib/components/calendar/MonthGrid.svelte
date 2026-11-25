<!--
	The month grid (lifted from hifi/calendar/Month.svelte). Below 768 px a cell carries marks (filled circle = planned todo, ring = projection,
	diamond = exam; at most 3, then "+"); from 768 px it carries up to two titles and "+n more". The shapes name the kind, never a colour.
	Today is `aria-current="date"`, the selected day `aria-pressed`, days outside the month are disabled.
-->
<script lang="ts">
	import { dateLabel } from '$lib/components/todo/format';
	import type { CalendarEntry, DueTodo } from '$lib/server/calendar';
	import type { IsoDate } from '$lib/types';
	import './calendar.css';

	let {
		month,
		weeks,
		entries,
		due,
		selected,
		today,
		onselect
	}: {
		month: string;
		weeks: IsoDate[][];
		entries: Record<IsoDate, CalendarEntry[]>;
		due: Record<IsoDate, DueTodo[]>;
		selected: IsoDate;
		today: IsoDate;
		onselect: (day: IsoDate) => void;
	} = $props();

	const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
</script>

<div class="hc-grid" role="group" aria-label="Month grid">
	<div class="hc-heads" aria-hidden="true">{#each WEEKDAYS as name (name)}<span>{name}</span>{/each}</div>
	<div class="hc-weeks">
		{#each weeks as week (week[0])}
			<div class="hc-week">
				{#each week as day (day)}
					{@const inMonth = day.startsWith(month)}
					{@const list = inMonth ? (entries[day] ?? []) : []}
					{@const dueCount = inMonth ? (due[day]?.length ?? 0) : 0}
					<button
						type="button"
						class="hc-cell"
						disabled={!inMonth}
						aria-pressed={inMonth ? selected === day : undefined}
						aria-current={day === today ? 'date' : undefined}
						data-press
						onclick={() => onselect(day)}
					>
						<span class="sr-only">{dateLabel(day)}</span>
						<span class="hc-num" aria-hidden="true">{Number(day.slice(8))}</span>
						{#if list.length > 0}<span class="sr-only">{list.length} planned</span>{/if}
						<span class="hc-marks" aria-hidden="true">
							{#each list.slice(0, 3) as entry, i (i)}<i class="hc-mark" data-kind={entry.kind}></i>{/each}
							{#if list.length > 3}<span class="hc-more">+</span>{/if}
						</span>
						<span class="hc-titles" aria-hidden="true">
							{#each list.slice(0, 2) as entry, i (i)}
								<span class="hc-t" data-done={entry.kind === 'todo' && entry.done ? '' : undefined}><i class="hc-mark" data-kind={entry.kind}></i><span>{entry.title}</span></span>
							{/each}
							{#if list.length > 2}<span class="hc-more">+{list.length - 2} more</span>{/if}
						</span>
						{#if dueCount > 0}<span class="hc-due" role="img" aria-label="{dueCount} due">{dueCount}<span class="hc-due-word" aria-hidden="true">due</span></span>{/if}
					</button>
				{/each}
			</div>
		{/each}
	</div>
</div>

<ul class="hc-key" aria-label="Marks">
	<li><i class="hc-mark" data-kind="todo"></i>Planned</li>
	<li><i class="hc-mark" data-kind="projection"></i>Projected</li>
	<li><i class="hc-mark" data-kind="exam"></i>Exam</li>
	<li><span class="hc-key-due" aria-hidden="true">1</span>Due that day</li>
</ul>
