<script lang="ts">
	import type { Aspect, AspectProgress, Id, Todo } from '$lib/types';
	import BacklogRail from '../rail/BacklogRail.svelte';
	import Sheet from '../ui/Sheet.svelte';

	let {
		open = $bindable(false),
		backlog,
		aspects,
		progress,
		onadd
	}: {
		open?: boolean;
		backlog: Todo[];
		aspects: Aspect[];
		progress: Record<Id, AspectProgress>;
		onadd: (id: Id) => void;
	} = $props();
</script>

<!-- "Manage" below 1280 px: the rail's content as a sheet (bottom sheet on a phone, a centred card from 768 px), without drag. -->
<Sheet {open} title="Backlog" onclose={() => (open = false)}>
	<!-- Mounted only while open, so its rows don't duplicate the docked rail's and its keys don't confuse the move crossfade. -->
	{#if open}
		<BacklogRail {backlog} {aspects} {progress} canAdd addAction="/todos?/addToSprint" {onadd} />
	{/if}
</Sheet>
