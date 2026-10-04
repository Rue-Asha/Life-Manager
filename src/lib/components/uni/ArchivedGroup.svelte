<script lang="ts">
	import type { Id, IsoDate, SemesterView } from '$lib/types';
	import { GLYPHS } from '../projects/glyphs';
	import SemesterSection, { UNI_GLYPHS } from './SemesterSection.svelte';

	let {
		semesters,
		counts,
		today
	}: {
		semesters: SemesterView[];
		counts: Record<Id, { classes: number; todos: number; openTodos: number }>;
		today: IsoDate;
	} = $props();

	let expanded = $state(false);
</script>

<section class="archived" data-testid="semester-archived-group">
	<h2 class="toggle">
		<button type="button" aria-expanded={expanded} onclick={() => (expanded = !expanded)}>
			<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS['chevron-right']} /></svg>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UNI_GLYPHS.archive} /></svg>Archived ({semesters.length})
		</button>
	</h2>
	{#if expanded}
		<div class="inner">
			{#each semesters as semester (semester.id)}
				<SemesterSection {semester} counts={counts[semester.id]} {today} />
			{/each}
		</div>
	{/if}
</section>

<style>
	.archived {
		margin-top: var(--space-8);
	}

	h2 {
		border-bottom: 1px solid var(--line);
		color: var(--ink-2);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
	}

	button {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: 0 0 var(--space-2);
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	button:hover {
		color: var(--ink);
	}

	.inner {
		display: grid;
		gap: var(--space-5);
		padding: var(--space-4) 0 0 var(--space-5);
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

	.chev {
		color: var(--ink-3);
	}

	[aria-expanded='true'] .chev {
		transform: rotate(90deg);
	}
</style>
