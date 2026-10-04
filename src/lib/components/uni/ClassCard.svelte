<script lang="ts">
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import type { ClassSummary, IsoDate } from '$lib/types';
	import { examCountdown } from '$lib/uni';
	import AspectIcon from '../ui/AspectIcon.svelte';
	import { UI_ICONS } from '../ui/icons';
	import { dueText } from './DeadlineList.svelte';

	let { cls, today }: { cls: ClassSummary; today: IsoDate } = $props();

	const exam = $derived(examCountdown(cls.examAt, today));
</script>

<a class="card" href="/uni/classes/{cls.id}" data-testid="class-card">
	<span class="top">
		<span class="tile" style:background={ASPECT_COLORS[cls.color].tint}><AspectIcon icon={cls.icon} color={cls.color} /></span>
		<span class="names">
			<span class="name">{cls.name}</span>
			{#if cls.lecturer}<span class="sub">{cls.lecturer}</span>{/if}
		</span>
		{#if cls.grade === 'passed'}
			<span class="grade passed" data-testid="class-grade">Passed</span>
		{:else if cls.grade}
			<span class="grade num" data-testid="class-grade" aria-label="Grade {cls.grade}">{cls.grade}</span>
		{/if}
	</span>
	<span class="foot">
		<span class="num" data-testid="class-open">{cls.openTodos} open</span>
		{#if cls.nextDue}
			<span class="due num" class:late={cls.nextDue < today} data-testid="class-next-due">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['calendar-days']} /></svg>{dueText(cls.nextDue, today)}
			</span>
		{/if}
		{#if exam}<span class="exam num" class:today={exam === 'Exam today'} data-testid="class-exam">{exam}</span>{/if}
	</span>
</a>

<style>
	.card {
		display: grid;
		grid-template-rows: auto 1fr;
		gap: var(--space-3);
		height: 100%;
		padding: var(--space-4);
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--paper);
		color: inherit;
		text-decoration: none;
		transition: background-color var(--dur-fast) var(--ease-out);
	}

	.card:hover {
		background: var(--paper-hover);
	}

	.top {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: start;
		gap: var(--space-3);
	}

	.tile {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-md);
	}

	.name,
	.sub {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
		letter-spacing: var(--tracking-title);
	}

	.sub {
		margin-top: var(--space-0);
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.grade {
		color: var(--ink);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: 36px;
	}

	.grade.passed {
		color: var(--ink-2);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		align-self: end;
		gap: var(--space-1) var(--space-3);
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.foot > span {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-height: 24px;
	}

	.due.late {
		color: var(--overdue);
		font-weight: var(--weight-medium);
	}

	.exam {
		margin-left: auto;
		padding: 0 var(--space-2);
		border-radius: var(--radius-sm);
		background: var(--paper-sunk);
		color: var(--ink-2);
		font-weight: var(--weight-medium);
	}

	.exam.today {
		background: var(--accent-soft);
		color: var(--accent);
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

	/* Desktop rows: a sparse card keeps its neighbour's height. */
	@media (min-width: 768px) {
		.card {
			min-height: 128px;
		}
	}
</style>
