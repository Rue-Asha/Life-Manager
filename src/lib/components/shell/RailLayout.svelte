<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		rail
	}: { children: Snippet; rail?: Snippet; railTitle: string; wide?: boolean } = $props();
</script>

<div class="rail-layout">
	{@render children()}
	{@render rail?.()}
</div>
