<script lang="ts">
	let {
		message,
		actionLabel,
		onaction,
		ontimeout,
		duration = 5000
	}: { message: string; actionLabel?: string; onaction?: () => void; ontimeout: () => void; duration?: number } =
		$props();

	$effect(() => {
		const timer = setTimeout(ontimeout, duration);
		return () => clearTimeout(timer);
	});
</script>

<div class="toast" role="status" data-testid="toast">
	<span class="message">{message}</span>
	{#if actionLabel && onaction}<button type="button" onclick={onaction}>{actionLabel}</button>{/if}
</div>

<style>
	.toast {
		position: fixed;
		bottom: calc(var(--space-6) + env(safe-area-inset-bottom));
		left: 50%;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: var(--space-4);
		max-width: calc(100vw - 2 * var(--space-4));
		padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
		border-radius: var(--radius-md);
		background: var(--ink);
		color: var(--paper);
		font-size: var(--text-sm);
		box-shadow: var(--shadow-float);
		transform: translateX(-50%);
	}

	.message {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	button {
		flex: none;
		min-height: 32px;
		padding: 0 var(--space-3);
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--paper);
		font: inherit;
		font-weight: var(--weight-semibold);
		cursor: pointer;
	}

	button:hover,
	button:focus-visible {
		background: color-mix(in srgb, var(--paper) 14%, transparent);
	}
</style>
