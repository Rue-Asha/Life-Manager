<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="field-card" data-testid="field-card">
	{@render children()}
</div>

<style>
	.field-card {
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--surface);
	}

	/* Rows come as direct children or as items of one list. */
	.field-card > :global(* + *),
	.field-card > :global(ul > li + li) {
		border-top: 1px solid var(--line);
	}

	.field-card > :global(ul) {
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
