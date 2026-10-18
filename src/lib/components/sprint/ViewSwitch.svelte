<script lang="ts">
	let { view }: { view: 'aspect' | 'board' | 'week' } = $props();

	const VIEWS = [
		{ id: 'aspect', label: 'By aspect' },
		{ id: 'board', label: 'Board' },
		{ id: 'week', label: 'Week' }
	] as const;
</script>

<nav aria-label="Sprint view">
	{#each VIEWS as { id, label } (id)}
		<a href="/sprint?view={id}" aria-current={view === id ? 'page' : undefined}>{label}</a>
	{/each}
</nav>

<style>
	nav {
		display: inline-flex;
		gap: var(--space-0);
		padding: 3px;
		border-radius: var(--radius-pill);
		background: var(--sunk);
	}

	a {
		display: inline-flex;
		align-items: center;
		height: 30px;
		padding: 0 var(--space-4);
		border-radius: var(--radius-pill);
		color: var(--ink-2);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		text-decoration: none;
		transition: background-color var(--dur-fast) var(--ease-out);
	}

	a:hover {
		color: var(--ink);
	}

	a[aria-current='page'] {
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-pop);
	}
</style>
