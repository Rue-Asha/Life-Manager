<script lang="ts">
	import type { Snippet } from 'svelte';

	// `outline` is for groups on a white surface (rails), where the card lift would vanish. No overflow
	// clipping: a row's action menu has to hang out of the last row.
	let { children, variant = 'card' }: { children: Snippet; variant?: 'card' | 'outline' } = $props();
</script>

<div class="list-group" class:outline={variant === 'outline'} data-testid="list-group">
	{@render children()}
</div>

<style>
	/* Hairlines start where the row text starts: after the checkbox when the rows have one. */
	.list-group {
		--list-inset: var(--space-4);
		background: var(--surface);
		border-radius: var(--radius-group);
		box-shadow: var(--shadow-card);
	}

	.list-group:has(:global(.check)) {
		--list-inset: calc(var(--space-4) + var(--checkbox-size) + var(--space-3));
	}

	/* An empty list draws no card; the group stays mounted so a leaving row can still travel out. */
	.list-group:not(:has(> *)) {
		display: none;
	}

	.outline {
		border: 1px solid var(--line);
		box-shadow: none;
	}

	/* Rows come either as direct children (one wrapper per row, for crossfade and drag) or as items of one
	   list; both get an inset hairline above every row but the first. */
	.list-group > :global(* + *),
	.list-group > :global(ul > li + li) {
		position: relative;
	}

	.list-group > :global(* + *)::before,
	.list-group > :global(ul > li + li)::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		left: var(--list-inset);
		border-top: 1px solid var(--line);
		pointer-events: none;
	}
</style>
