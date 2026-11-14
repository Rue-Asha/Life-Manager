<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { WIDE_QUERY } from '../../lib/layout';
	import HomeList from '../../lib/components/shell/HomeList.svelte';

	onMount(() => {
		if (matchMedia(WIDE_QUERY).matches) goto('/', { replaceState: true });
	});
</script>

<svelte:head>
	<title>Lists · Life Manager</title>
</svelte:head>

<h1>Life Manager</h1>
<HomeList />

<style>
	h1 {
		margin: var(--space-4) 0 var(--space-6);
		font-size: 34px;
		font-weight: var(--weight-heavy);
		line-height: 1.1;
		letter-spacing: -0.025em;
	}
</style>
