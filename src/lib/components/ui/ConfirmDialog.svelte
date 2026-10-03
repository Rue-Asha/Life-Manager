<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import Sheet from './Sheet.svelte';

	let {
		open,
		title,
		message,
		confirmLabel,
		onconfirm,
		oncancel,
		children
	}: {
		open: boolean;
		title: string;
		message: string;
		confirmLabel: string;
		onconfirm: () => void;
		oncancel: () => void;
		children?: Snippet;
	} = $props();
</script>

<Sheet {open} {title} onclose={oncancel}>
	<p class="message">{message}</p>
	{@render children?.()}
	<footer>
		<Button type="button" variant="quiet" onclick={oncancel}>Cancel</Button>
		<Button type="button" variant="primary" onclick={onconfirm}>{confirmLabel}</Button>
	</footer>
</Sheet>

<style>
	.message {
		color: var(--ink-2);
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		margin-top: var(--space-6);
	}
</style>
