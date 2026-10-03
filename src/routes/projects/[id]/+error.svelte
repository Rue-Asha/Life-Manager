<script lang="ts">
	import { page } from '$app/state';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
</script>

<svelte:head>
	<title>Not found · Life Manager</title>
</svelte:head>

<PageHeader title="Project not found" icon="folder" />

{#if page.status === 404}
	<EmptyState message="This project doesn’t exist, or it was deleted." href="/projects" actionLabel="Projects" />
{:else}
	<EmptyState message="Something went wrong loading this project." href="/projects" actionLabel="Projects" />
{/if}
