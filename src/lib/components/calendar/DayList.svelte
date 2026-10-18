<script lang="ts" module>
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import type { Aspect } from '$lib/types';
	import type { CalendarEntry } from '$lib/server/calendar';

	export function entryColor(entry: CalendarEntry, aspects: Aspect[]): string {
		if (entry.kind === 'exam') return ASPECT_COLORS[entry.color].fg;
		const aspect = aspects.find((a) => a.id === entry.aspectId) ?? aspects[0];
		return ASPECT_COLORS[aspect.color].fg;
	}
</script>

<script lang="ts">
	import { dateLabel } from '$lib/components/todo/format';
	import { slotLabel } from '$lib/slot';
	import type { Id, IsoDate } from '$lib/types';
	import TodoEditor from '../todo/TodoEditor.svelte';
	import { UI_ICONS } from '../ui/icons';

	let { day, entries, aspects }: { day: IsoDate; entries: CalendarEntry[]; aspects: Aspect[] } = $props();

	let editing = $state<Id | null>(null);
</script>

{#snippet content(entry: CalendarEntry)}
	<span class="title" class:done={entry.kind === 'todo' && entry.done}>{entry.title}</span>
	<span class="meta num">
		{slotLabel(entry.startTime, entry.endTime)}
		{#if entry.kind === 'projection'}
			<span class="tag">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.repeat} /></svg>Projected
			</span>
		{:else if entry.kind === 'exam'}
			<span class="tag">Exam{entry.room ? ` · ${entry.room}` : ''}</span>
		{/if}
	</span>
{/snippet}

<section class="day" data-testid="calendar-day-list" aria-labelledby="day-title">
	<h2 id="day-title">{dateLabel(day)}</h2>
	{#if entries.length === 0}
		<p class="empty">Nothing planned</p>
	{:else}
		<ul>
			{#each entries as entry, i (i)}
				<li data-testid="calendar-entry" data-kind={entry.kind} style:--a={entryColor(entry, aspects)}>
					<i class="mark" class:ring={entry.kind === 'projection'}></i>
					{#if entry.kind === 'todo'}
						<button type="button" class="body" onclick={() => (editing = entry.todo.id)}>{@render content(entry)}</button>
					{:else}
						<a class="body" href={entry.kind === 'projection' ? `/recurring#rule-${entry.ruleId}` : `/uni/classes/${entry.classId}`}>
							{@render content(entry)}
						</a>
					{/if}
					{#if entry.kind === 'todo' && editing === entry.todo.id}
						<div class="editor">
							<TodoEditor todo={entry.todo} {aspects} open onclose={() => (editing = null)} />
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	h2 {
		margin-bottom: var(--space-3);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-group);
	}

	li {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
	}

	li + li {
		border-top: 1px solid var(--line);
	}

	.mark {
		flex: none;
		width: 10px;
		height: 10px;
		margin-top: 5px;
		border-radius: var(--radius-pill);
		background: var(--a);
		box-sizing: border-box;
	}

	.mark.ring {
		background: transparent;
		border: 2px solid var(--a);
	}

	.body {
		display: grid;
		flex: 1;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		min-width: 0;
		gap: 2px;
	}

	.body:hover .title {
		text-decoration: underline;
	}

	.editor {
		flex: 0 0 100%;
		min-width: 0;
	}

	.title {
		overflow-wrap: anywhere;
	}

	.title.done {
		color: var(--ink-3);
		text-decoration: line-through;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	svg {
		width: 14px;
		height: 14px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.empty {
		padding: var(--space-6) var(--space-4);
		border-radius: var(--radius-group);
		background: var(--surface);
		border: 1px solid var(--line);
		color: var(--ink-3);
		text-align: center;
	}
</style>
