<script lang="ts">
	import HomeList from '../../lib/components/shell/HomeList.svelte';
</script>

<svelte:head>
	<title>Lists · Life Manager</title>
</svelte:head>

<h1>Life Manager</h1>
<HomeList />

<style>
	h1 {
		margin: var(--space-4) 0 var(--space-6);
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-title);
	}
</style>
