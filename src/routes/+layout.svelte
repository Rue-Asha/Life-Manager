<script lang="ts">
	import { onMount } from 'svelte';

	let { children } = $props();

	// The e2e suite waits for this: input on the server-rendered page before hydration is lost.
	onMount(() => {
		document.documentElement.dataset.hydrated = '';
	});
</script>

{@render children()}
