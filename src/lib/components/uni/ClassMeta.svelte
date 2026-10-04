<script lang="ts">
	import { GLYPHS } from '../projects/glyphs';
	import { dateLabel } from '../todo/format';
	import { examCountdown } from '$lib/uni';
	import type { ClassTodos, IsoDate, UniClass } from '$lib/types';

	// Without `onedit` (archived class) there is no edit control.
	let {
		cls,
		todos,
		today,
		mode,
		onedit
	}: { cls: UniClass; todos: ClassTodos; today: IsoDate; mode: 'rail' | 'row'; onedit?: () => void } = $props();

	// Lucide glyphs (ISC licence, https://lucide.dev) only the class metadata needs.
	const ICONS = {
		user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M8 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
		pin: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0 M9 10a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
		link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
		external: 'M15 3h6v6 M10 14 21 3 M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
		clock: 'M12 6v6l4 2 M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0',
		award: 'm15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526 M6 8a6 6 0 1 0 12 0a6 6 0 1 0 -12 0'
	};

	const examDay = $derived(cls.examAt?.slice(0, 10) ?? null);
	const examTime = $derived(cls.examAt?.slice(11, 16) ?? '');
	// "in 128 d" / "today"; past exams have none.
	const countdown = $derived(examCountdown(cls.examAt, today)?.replace(/^Exam /, '') ?? null);
	const grade = $derived(cls.grade === 'passed' ? 'Passed' : cls.grade);
	const linkLabel = (l: { label: string; url: string }) => l.label || l.url.replace(/^https?:\/\//, '');
</script>

{#snippet icon(d: string)}
	<svg viewBox="0 0 24 24" aria-hidden="true"><path {d} /></svg>
{/snippet}

{#if mode === 'rail'}
	<h2>Details</h2>
	<dl class="props" data-testid="class-meta">
		{#if cls.lecturer}<dt>Lecturer</dt><dd>{cls.lecturer}</dd>{/if}
		{#if cls.room}<dt>Room</dt><dd>{cls.room}</dd>{/if}
		{#if cls.ects !== null}<dt>ECTS</dt><dd class="num">{cls.ects}</dd>{/if}
		{#if cls.links.length}
			<dt>Links</dt>
			<dd class="links">
				{#each cls.links as link, i (i)}
					<a href={link.url} target="_blank" rel="noopener noreferrer">{linkLabel(link)}{@render icon(ICONS.external)}</a>
				{/each}
			</dd>
		{/if}
		{#if examDay}
			<dt>Exam</dt>
			<dd class="num">
				{dateLabel(examDay)} {examDay.slice(0, 4)}{examTime ? `, ${examTime}` : ''}
				{#if cls.examRoom || countdown}
					<span class="sub">{[cls.examRoom, countdown].filter(Boolean).join(' · ')}</span>
				{/if}
			</dd>
		{/if}
		<dt>Grade</dt>
		<dd class="num" class:muted={!grade}>{grade ?? '—'}</dd>
		<dt>Todos</dt>
		<dd class="num">{todos.open.length} open, {todos.planned.length} planned, {todos.done.length} done</dd>
	</dl>
	{#if onedit}
		<button type="button" class="edit" onclick={onedit}>{@render icon(GLYPHS.pen)}Edit details</button>
	{/if}
{:else}
	<div class="row" data-testid="class-meta">
		{#if cls.lecturer}<span class="pchip">{@render icon(ICONS.user)}{cls.lecturer}</span>{/if}
		{#if cls.room}<span class="pchip">{@render icon(ICONS.pin)}{cls.room}</span>{/if}
		{#if cls.ects !== null}<span class="pchip num">{cls.ects} ECTS</span>{/if}
		{#each cls.links as link, i (i)}
			<a class="pchip link" href={link.url} target="_blank" rel="noopener noreferrer">{@render icon(ICONS.link)}{linkLabel(link)}</a>
		{/each}
		{#if examDay}
			<span class="pchip exam num">
				{@render icon(ICONS.clock)}Exam {dateLabel(examDay)}{examTime ? `, ${examTime}` : ''}{cls.examRoom ? ` · ${cls.examRoom}` : ''}{countdown ? ` · ${countdown}` : ''}
			</span>
		{/if}
		<span class="pchip">{@render icon(ICONS.award)}{grade ? `Grade ${grade}` : 'No grade yet'}</span>
		{#if onedit}
			<button type="button" class="pchip" onclick={onedit}>{@render icon(GLYPHS.pen)}Edit details</button>
		{/if}
	</div>
{/if}

<style>
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

	h2 {
		margin-bottom: var(--space-4);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	.props {
		display: grid;
		grid-template-columns: 76px minmax(0, 1fr);
		align-items: start;
		gap: var(--space-4) var(--space-3);
		margin: 0;
	}

	dt {
		padding-top: 2px;
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	dd {
		margin: 0;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--ink-3);
	}

	.sub {
		display: block;
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.links {
		display: grid;
		justify-items: start;
		gap: var(--space-1);
	}

	a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--accent);
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	.edit {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		height: var(--control-height);
		margin-top: var(--space-6);
		padding: 0 var(--space-4);
		border: 0;
		border-radius: var(--radius-md);
		background: var(--paper);
		font-weight: var(--weight-medium);
		cursor: pointer;
	}

	.edit:hover {
		background: var(--paper-hover);
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-4);
	}

	.pchip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-height: 30px;
		max-width: 100%;
		padding: 0 var(--space-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--paper);
		color: var(--ink-2);
		font-size: var(--text-sm);
		overflow-wrap: anywhere;
	}

	.pchip.link {
		color: var(--accent);
	}

	.pchip.exam {
		color: var(--ink);
	}

	button.pchip {
		cursor: pointer;
	}

	button.pchip:hover {
		background: var(--paper-hover);
	}
</style>
