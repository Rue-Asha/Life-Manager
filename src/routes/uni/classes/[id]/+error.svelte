<script lang="ts">
	import { page } from '$app/state';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
</script>

<svelte:head>
	<title>Not found · Life Manager</title>
</svelte:head>

<PageHeader title="Class not found" icon="graduation-cap" />

{#if page.status === 404}
	<EmptyState message="This class doesn’t exist, or it was deleted." href="/uni" actionLabel="Uni" />
{:else}
	<EmptyState message="Something went wrong loading this class." href="/uni" actionLabel="Uni" />
{/if}
