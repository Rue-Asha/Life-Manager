<script lang="ts">
	let { message, href, actionLabel }: { message: string; href?: string; actionLabel?: string } = $props();
</script>

<p class="empty">
	{message}
	{#if href && actionLabel}<a {href}>{actionLabel}</a>{/if}
</p>

<style>
	.empty {
		padding: var(--space-8) var(--space-4);
		text-align: center;
		color: var(--ink-3);
	}

	a {
		color: var(--accent);
		font-weight: var(--weight-medium);
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
