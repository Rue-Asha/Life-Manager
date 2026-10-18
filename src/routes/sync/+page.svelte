<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Proton sync · Life Manager</title>
</svelte:head>

<PageHeader title="Proton sync" />

{#if data.status.state === 'off'}
	<p class="off" data-testid="sync-off">
		Sync is off. Set <code>PROTON_CLI</code> to the path of the proton binary and restart the app to push planned todos,
		recurring rules and exams to Proton Calendar.
	</p>
{/if}

<style>
	.off {
		padding: var(--space-4);
		border-radius: var(--radius-group);
		background: var(--surface);
		box-shadow: var(--shadow-card);
		color: var(--ink-2);
	}
</style>
