<script lang="ts">
	import { ASPECT_COLORS, type AspectColor } from '../../aspect-style';

	let { done, total, color }: { done: number; total: number; color: AspectColor } = $props();

	const percent = $derived(total === 0 ? 0 : Math.round((done / total) * 100));
</script>

<span class="progress" data-testid="progress">
	<span class="count">{done} / {total}</span>
	<span class="track" aria-hidden="true">
		<span class="fill" style:width="{percent}%" style:background={ASPECT_COLORS[color].fg}></span>
	</span>
</span>

<style>
	.progress {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--ink-3);
		font-size: var(--text-xs);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.track {
		width: 48px;
		height: 2px;
		border-radius: var(--radius-pill);
		background: var(--line);
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		transition: width var(--dur-base) var(--ease-out);
	}
</style>
