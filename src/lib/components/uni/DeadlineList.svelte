<script lang="ts" module>
	import { dateLabel, daysFrom } from '../todo/format';
	import type { IsoDate } from '$lib/types';

	// "Yesterday", "Today", "Tomorrow", else "Fri 9 Oct"; shared with the class card's next due date.
	export function dueText(date: IsoDate, today: IsoDate): string {
		const n = daysFrom(today, date);
		if (n === -1) return 'Yesterday';
		if (n === 0) return 'Today';
		if (n === 1) return 'Tomorrow';
		return dateLabel(date);
	}
</script>

<script lang="ts">
	import type { ClassRef, Deadline, Id } from '$lib/types';
	import { examCountdown } from '$lib/uni';
	import ClassBadge from './ClassBadge.svelte';

	let {
		deadlines,
		classes,
		examAt,
		today
	}: { deadlines: Deadline[]; classes: ClassRef[]; examAt: Map<Id, string | null>; today: IsoDate } = $props();

	const refs = $derived(new Map(classes.map((c) => [c.id, c])));

	// The deadline carries only the date; the time comes from the class's exam.
	function examNote(classId: Id): string {
		const at = examAt.get(classId) ?? '';
		const countdown = (examCountdown(at, today) ?? '').replace(/^Exam /, '');
		return at.length > 10 ? `${at.slice(11, 16)} · ${countdown}` : countdown;
	}
</script>

<section class="deadlines" data-testid="deadline-list" aria-labelledby="deadlines-title">
	<h2 id="deadlines-title">Due next{#if deadlines.length}<span class="count num">{deadlines.length}</span>{/if}</h2>
	{#if deadlines.length === 0}
		<p class="empty">Nothing due. Dated class todos and exams show up here.</p>
	{:else}
		<ul>
			{#each deadlines as d (`${d.kind}-${d.todoId ?? d.classId}`)}
				{@const ref = refs.get(d.classId)}
				<li data-testid="deadline-row">
					<div class="main">
						<span class="title" class:exam={d.kind === 'exam'}>{d.title}</span>
						{#if ref}<span class="meta"><ClassBadge classRef={ref} type={d.type} /></span>{/if}
					</div>
					<div class="date num" class:late={d.overdue}>
						{dueText(d.date, today)}
						{#if d.overdue}
							<small>Overdue</small>
						{:else if d.kind === 'exam'}
							<small>{examNote(d.classId)}</small>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	h2 {
		display: flex;
		align-items: baseline;
		margin-bottom: var(--space-2);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	.count {
		margin-left: auto;
		color: var(--ink-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		column-gap: var(--space-3);
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--line);
	}

	li:last-child {
		border-bottom: 0;
	}

	.main {
		min-width: 0;
	}

	.title {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: var(--leading-snug);
	}

	.title.exam {
		font-weight: var(--weight-semibold);
	}

	.meta {
		display: flex;
		min-width: 0;
		margin-top: var(--space-0);
	}

	.date {
		padding-top: 1px;
		color: var(--ink-2);
		font-size: var(--text-sm);
		text-align: right;
		white-space: nowrap;
	}

	.date.late {
		color: var(--overdue);
		font-weight: var(--weight-medium);
	}

	small {
		display: block;
		color: var(--ink-3);
		font-size: var(--text-xs);
		font-weight: var(--weight-regular);
	}

	.late small {
		color: var(--overdue);
	}

	.empty {
		padding: var(--space-3) 0;
		color: var(--ink-3);
	}
</style>
