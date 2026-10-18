<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ASPECT_COLORS, type AspectColor } from '../../aspect-style';

	let {
		figure,
		label,
		context,
		line,
		segments = []
	}: {
		figure: string;
		label: string;
		context?: string;
		line?: Snippet;
		segments?: { color: AspectColor; total: number; done: number }[];
	} = $props();
</script>

<section class="summary" data-testid="summary-header">
	{#if context}<p class="context">{context}</p>{/if}
	<p class="figure"><span data-testid="summary-figure">{figure}</span><small>{label}</small></p>
	{#if line}<p class="line" data-testid="summary-line">{@render line()}</p>{/if}
	{#if segments.length}
		<div class="bar" aria-hidden="true" data-testid="summary-bar">
			{#each segments as s, i (i)}
				<span style:flex={s.total}>
					<i style:width="{s.total ? (s.done / s.total) * 100 : 0}%" style:background={ASPECT_COLORS[s.color].bright}></i>
				</span>
			{/each}
		</div>
	{/if}
</section>

<style>
	.summary {
		display: grid;
		gap: var(--space-1);
		margin-bottom: var(--space-5);
		padding: var(--space-4) var(--space-5);
		border-radius: 18px;
		background: var(--chrome);
		color: var(--on-chrome);
		font-variant-numeric: tabular-nums;
	}

	p {
		margin: 0;
	}

	.context {
		display: none;
		font-size: var(--text-sm);
		color: var(--on-chrome-2);
	}

	.figure {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		font-size: 40px;
		font-weight: var(--weight-heavy);
		letter-spacing: -0.03em;
		line-height: 1.05;
	}

	small {
		font-size: var(--text-md);
		font-weight: var(--weight-medium);
		letter-spacing: 0;
		color: var(--on-chrome-2);
	}

	.line {
		font-size: 14px;
		color: var(--on-chrome-2);
	}

	.line :global(b) {
		color: var(--on-chrome);
		font-weight: var(--weight-semibold);
	}

	.bar {
		display: flex;
		gap: 3px;
		height: 6px;
		margin-top: var(--space-3);
	}

	.bar span {
		min-width: 6px;
		border-radius: 3px;
		overflow: hidden;
		background: rgb(255 255 255 / 0.14);
	}

	.bar i {
		display: block;
		height: 100%;
	}

	@media (min-width: 768px) {
		.summary {
			padding: var(--space-5) var(--space-6);
			border-radius: 20px;
		}

		.context {
			display: block;
		}

		.figure {
			font-size: 44px;
		}
	}
</style>
