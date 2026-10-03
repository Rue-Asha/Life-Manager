<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let {
		variant = 'secondary',
		children,
		...rest
	}: HTMLButtonAttributes & { variant?: 'primary' | 'secondary' | 'quiet'; children: Snippet } = $props();
</script>

<button class="btn {variant}" {...rest}>{@render children()}</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		height: var(--control-height);
		padding: 0 var(--space-4);
		border: 0;
		border-radius: var(--radius-md);
		font-size: var(--text-md);
		font-weight: var(--weight-medium);
		white-space: nowrap;
		cursor: pointer;
		transition: background-color var(--dur-fast) var(--ease-out);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.primary {
		background: var(--accent);
		color: var(--ink-on-accent);
	}

	.primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.secondary {
		background: var(--paper-sunk);
		color: var(--ink);
	}

	.secondary:hover:not(:disabled) {
		background: var(--line);
	}

	.quiet {
		background: none;
		color: var(--ink-2);
		padding: 0 var(--space-2);
	}

	.quiet:hover:not(:disabled) {
		color: var(--ink);
	}
</style>
