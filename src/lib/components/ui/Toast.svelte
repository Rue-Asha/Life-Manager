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

<div role="status" data-testid="toast">
	{message}
	{#if actionLabel && onaction}<button type="button" onclick={onaction}>{actionLabel}</button>{/if}
</div>
