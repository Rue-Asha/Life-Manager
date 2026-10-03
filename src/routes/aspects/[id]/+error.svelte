<script lang="ts">
	import { page } from '$app/state';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
</script>

<svelte:head>
	<title>Not found · Life Manager</title>
</svelte:head>

<PageHeader title="Aspect not found" icon="layers" />

{#if page.status === 404}
	<EmptyState message="This aspect doesn’t exist, or it was deleted." href="/aspects" actionLabel="Aspects" />
{:else}
	<EmptyState message="Something went wrong loading this aspect." href="/aspects" actionLabel="Aspects" />
{/if}
