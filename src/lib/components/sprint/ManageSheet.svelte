<script lang="ts">
	import type { Aspect, AspectProgress, Id, Todo } from '$lib/types';
	import BacklogRail from '../rail/BacklogRail.svelte';
	import Button from '../ui/Button.svelte';
	import Sheet from '../ui/Sheet.svelte';

	let {
		backlog,
		aspects,
		progress,
		onadd
	}: {
		backlog: Todo[];
		aspects: Aspect[];
		progress: Record<Id, AspectProgress>;
		onadd: (id: Id) => void;
	} = $props();

	let open = $state(false);
</script>

<!-- Phone only: from 768 the page's context rail carries the same content. -->
<span class="manage">
	<Button data-testid="manage-button" aria-haspopup="dialog" onclick={() => (open = true)}>Manage</Button>
</span>

<Sheet {open} title="Backlog" onclose={() => (open = false)}>
	<!-- Mounted only while open, so its rows don't duplicate the rail's and its keys don't confuse the move crossfade. -->
	{#if open}
		<BacklogRail {backlog} {aspects} {progress} canAdd addAction="/todos?/addToSprint" {onadd} testid="manage-sheet" />
	{/if}
</Sheet>

<style>
	@media (min-width: 768px) {
		.manage {
			display: none;
		}
	}
</style>
