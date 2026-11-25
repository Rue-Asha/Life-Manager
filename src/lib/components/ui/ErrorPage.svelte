<!--
	The route error page of the three detail routes: a 404 names what is missing and goes back to its list; any other error says it couldn't
	load and offers the same way back. Copy is the contract's (§6 Error pages, §7). The status stays what the route answered.
-->
<script lang="ts">
	import { page } from '$app/state';
	import Button from './Button.svelte';

	let { kind, list, href }: { kind: string; list: string; href: string } = $props();

	const missing = $derived(page.status === 404);
	const Kind = $derived(kind.charAt(0).toUpperCase() + kind.slice(1));
</script>

<svelte:head>
	<title>{missing ? 'Not found' : 'Something went wrong'} · Life Manager</title>
</svelte:head>

<div class="screen-head">
	<div class="screen-lead">
		<ul class="kicker"><li>{missing ? '404' : 'Error'}</li></ul>
		{#if missing}
			<h1>{Kind} <em class="accent-word">not found</em></h1>
			<p class="lede">This {kind} doesn’t exist, or it was deleted. Go back to {list}.</p>
		{:else}
			<h1>Something <em class="accent-word">went wrong</em></h1>
			<p class="lede">Couldn’t load this {kind}. Try again, or go back to {list}.</p>
		{/if}
		<div class="back"><Button variant="primary" arrow {href}>{list}</Button></div>
	</div>
</div>

<style>
	.back {
		display: grid;
		justify-items: start;
	}
</style>
