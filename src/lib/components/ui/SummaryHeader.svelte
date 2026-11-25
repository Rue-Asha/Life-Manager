<!--
	The key-facts card (gate 5): the one charcoal card of a screen. A caption, one large figure with its label, an optional line and a
	segmented bar, one segment per aspect sized by its todos and filled by its done share. Past SEGMENTS aspects the segments would
	turn into slivers, so the bar becomes one for the whole; the per-aspect split stays in the screen's own list. The bar is an
	image with the numbers as its name, so its meaning never rests on colour alone.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ASPECT_COLORS, type AspectColor } from '../../aspect-style';

	const SEGMENTS = 8;

	let {
		figure,
		label,
		context,
		line,
		segments = [],
		barLabel = 'Sprint progress'
	}: {
		figure: string;
		label: string;
		context?: string;
		line?: Snippet;
		segments?: { color: AspectColor; total: number; done: number; name?: string }[];
		barLabel?: string;
	} = $props();

	const total = $derived(segments.reduce((n, s) => n + s.total, 0));
	const done = $derived(segments.reduce((n, s) => n + s.done, 0));
	const split = $derived(segments.length <= SEGMENTS);
	const name = $derived(
		split
			? `${barLabel} by aspect: ${segments.map((s) => `${s.name ?? ASPECT_COLORS[s.color].label} ${s.done} of ${s.total}`).join(', ')}`
			: `${barLabel}: ${done} of ${total} done`
	);
</script>

<section class="card facts" data-surface="inverse" aria-label="Summary">
	{#if context}<p class="cap">{context}</p>{/if}
	<div class="figrow"><p class="fig">{figure}</p><p class="figlabel">{label}</p></div>
	{#if line}<p class="line">{@render line()}</p>{/if}
	{#if segments.length}
		<div class="bar" role="img" aria-label={name}>
			{#if split}
				{#each segments as s, i (i)}
					<span class="piece" style:--aspect={ASPECT_COLORS[s.color].fg} style:flex-grow={s.total}>
						<span class="fill" style:inline-size="{s.total ? (s.done / s.total) * 100 : 0}%"></span>
					</span>
				{/each}
			{:else}
				<span class="piece all" style:flex-grow="1"><span class="fill" style:inline-size="{total ? (done / total) * 100 : 0}%"></span></span>
			{/if}
		</div>
	{/if}
</section>

<style>
	.facts {
		display: grid;
		gap: var(--space-1);
		padding: var(--space-5);
		min-inline-size: 0;
	}
	p {
		margin: 0;
	}
	.cap {
		font-size: var(--type-overline-size);
		line-height: var(--type-overline-line);
		letter-spacing: var(--type-overline-tracking);
		font-weight: var(--type-overline-weight);
		text-transform: uppercase;
		color: var(--ink-on-inverse-secondary);
	}
	.figrow {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-1) var(--space-3);
	}
	.fig {
		font-family: var(--font-display);
		font-weight: var(--weight-display);
		font-size: var(--type-display-xl-size);
		line-height: var(--type-display-xl-line);
		letter-spacing: var(--type-display-xl-tracking);
		font-variant-numeric: var(--numeric-figures);
	}
	.figlabel {
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
		font-weight: var(--type-title-weight);
	}
	.line {
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
		color: var(--ink-on-inverse-secondary);
		font-variant-numeric: var(--numeric-figures);
	}
	.line :global(b) {
		color: var(--ink-on-inverse);
		font-weight: var(--weight-semibold);
	}
	.bar {
		display: flex;
		gap: var(--space-0-5);
		margin-block-start: var(--space-3);
	}
	.piece {
		flex-basis: 0;
		min-inline-size: var(--space-2);
		block-size: var(--space-2);
		border-radius: var(--radius-pill);
		background: var(--surface-inverse-tint-strong);
		overflow: hidden;
	}
	.fill {
		display: block;
		block-size: 100%;
		background: var(--aspect);
	}
	.all > .fill {
		background: var(--ink-on-inverse);
	}
</style>
