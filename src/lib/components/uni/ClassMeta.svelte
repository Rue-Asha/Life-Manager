<script lang="ts">
	import { GLYPHS } from '../projects/glyphs';
	import { UI_ICONS } from '../ui/icons';
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
	<!-- Proton Pass-style field card: icon, small label over the value, hairlines between. -->
	<div class="card">
		<dl class="props" data-testid="class-meta">
			{#if cls.lecturer}
				<div class="field">{@render icon(ICONS.user)}<dt>Lecturer</dt><dd>{cls.lecturer}</dd></div>
			{/if}
			{#if cls.room}
				<div class="field">{@render icon(ICONS.pin)}<dt>Room</dt><dd>{cls.room}</dd></div>
			{/if}
			{#if cls.ects !== null}
				<div class="field">{@render icon(UI_ICONS.layers)}<dt>ECTS</dt><dd class="num">{cls.ects}</dd></div>
			{/if}
			{#if cls.links.length}
				<div class="field">
					{@render icon(ICONS.link)}<dt>Links</dt>
					<dd class="links">
						{#each cls.links as link, i (i)}
							<a href={link.url} target="_blank" rel="noopener noreferrer">{linkLabel(link)}{@render icon(ICONS.external)}</a>
						{/each}
					</dd>
				</div>
			{/if}
			{#if examDay}
				<div class="field">
					{@render icon(ICONS.clock)}<dt>Exam</dt>
					<dd class="num">
						{dateLabel(examDay)} {examDay.slice(0, 4)}{examTime ? `, ${examTime}` : ''}
						{#if cls.examRoom || countdown}
							<span class="sub">{[cls.examRoom, countdown].filter(Boolean).join(' · ')}</span>
						{/if}
					</dd>
				</div>
			{/if}
			<div class="field">
				{@render icon(ICONS.award)}<dt>Grade</dt><dd class="num" class:muted={!grade}>{grade ?? '—'}</dd>
			</div>
			<div class="field">
				{@render icon(UI_ICONS['list-checks'])}<dt>Todos</dt>
				<dd class="num">{todos.open.length} open, {todos.planned.length} planned, {todos.done.length} done</dd>
			</div>
		</dl>
		{#if onedit}
			<button type="button" class="edit" onclick={onedit}>{@render icon(GLYPHS.pen)}Edit details</button>
		{/if}
	</div>
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
		margin-bottom: var(--space-3);
		color: var(--ink-2);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}

	.card {
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--surface);
	}

	.props {
		margin: 0;
	}

	.field {
		display: grid;
		grid-template-columns: var(--icon-sm) minmax(0, 1fr);
		align-items: center;
		gap: 0 var(--space-3);
		padding: 10px 14px;
		border-bottom: 1px solid var(--line);
	}

	.field > svg {
		grid-row: span 2;
		color: var(--ink-3);
	}

	dt {
		color: var(--ink-3);
		font-size: var(--text-xs);
	}

	dd {
		margin: 0;
		min-width: 0;
		font-size: 14px;
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
		color: var(--accent-hover);
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	.edit {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: 12px 14px;
		border: 0;
		border-radius: 0 0 12px 12px;
		background: none;
		color: var(--accent-hover);
		font-size: 14px;
		font-weight: var(--weight-medium);
		text-align: left;
		cursor: pointer;
	}

	.edit:hover {
		background: var(--hover);
	}

	/* Without an edit row the last field closes the card. */
	.card:not(:has(.edit)) .field:last-child {
		border-bottom: 0;
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
		min-height: 28px;
		max-width: 100%;
		padding: 0 var(--space-3);
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--sunk);
		color: var(--ink-2);
		font-size: var(--text-sm);
		overflow-wrap: anywhere;
	}

	.pchip.link {
		color: var(--accent-hover);
		background: var(--accent-soft);
	}

	.pchip.exam {
		color: var(--ink);
	}

	button.pchip {
		cursor: pointer;
	}

	button.pchip:hover {
		background: var(--line);
	}
</style>
