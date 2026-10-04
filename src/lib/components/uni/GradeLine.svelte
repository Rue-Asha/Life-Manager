<script lang="ts">
	import type { GradeSummary } from '$lib/types';
	import { formatAverage } from '$lib/uni';

	let { grades, overall = false }: { grades: GradeSummary; overall?: boolean } = $props();
</script>

{#if overall}
	<p class="line overall" data-testid="grade-overall">
		Overall average <strong class="num">{formatAverage(grades.average)}</strong> ·
		<strong class="num">{grades.earnedEcts} ECTS</strong> earned
	</p>
{:else}
	<span class="line">
		Average <strong class="num">{formatAverage(grades.average)}</strong> · <span class="num">{grades.earnedEcts} ECTS</span>
	</span>
{/if}

<style>
	.line {
		color: var(--ink-3);
		font-size: var(--text-sm);
		white-space: nowrap;
	}

	strong {
		color: var(--ink-2);
		font-weight: var(--weight-medium);
	}

	.overall {
		font-size: var(--text-md);
		white-space: normal;
	}

	.overall strong {
		color: var(--ink);
		font-weight: var(--weight-semibold);
	}
</style>
