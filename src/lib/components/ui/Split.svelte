<!--
	Secondary context (gate 4 picks). From 1280 px the main column has a sticky right rail. Below 1280:
	  mode "a"  the context is a card stacked below the main column (Projects, Sync)
	  mode "b"  the context is a collapsible disclosure at the top, closed (Project details)
	The side snippet must hold no ids: in mode "b" it is rendered twice (the rail and the disclosure) and CSS shows one.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Disclosure from './Disclosure.svelte';

	let { id, mode = 'a', label, main, side }: { id: string; mode?: 'a' | 'b'; label: string; main: Snippet; side: Snippet } = $props();
	let open = $state(false);
</script>

<div class="split pj-split" data-mode={mode}>
	{#if mode === 'b'}
		<div class="top card pj-panel"><Disclosure id="{id}-top" {label} level={2} bind:open>{@render side()}</Disclosure></div>
	{/if}
	<div class="main">{@render main()}</div>
	<aside class="side card pj-panel" aria-label={label}>
		<h2 class="ruled">{label}</h2>
		{@render side()}
	</aside>
</div>

<style>
	.split {
		display: grid;
		gap: var(--space-4);
		align-items: start;
		min-inline-size: 0;
	}
	.main {
		display: grid;
		gap: var(--space-4);
		min-inline-size: 0;
	}
	.split[data-mode='b'] > .side {
		display: none;
	}
	.top :global(.pj-kv) {
		margin-block-start: var(--space-1);
	}
	@media (min-width: 1280px) {
		.split {
			grid-template-columns: minmax(0, 1fr) 20rem;
		}
		.split > .main {
			grid-column: 1;
		}
		.split > .side,
		.split[data-mode='b'] > .side {
			grid-column: 2;
			grid-row: 1;
			position: sticky;
			inset-block-start: var(--space-4);
			display: grid;
		}
		.split > .top {
			display: none;
		}
	}
</style>
