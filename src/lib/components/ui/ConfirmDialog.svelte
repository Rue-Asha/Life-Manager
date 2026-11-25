<!--
	One confirmation pattern: the title asks, the message gives the consequence, Cancel has focus and the verb sits on the right.
	Deleting is the danger pill with the trash; every other confirm is the primary. `danger` defaults to a label that says "delete".
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UI_ICONS } from './icons';
	import Button from './Button.svelte';
	import Sheet from './Sheet.svelte';

	let {
		open,
		title,
		message,
		confirmLabel,
		onconfirm,
		oncancel,
		danger = /\bdelete\b/i.test(confirmLabel),
		children
	}: {
		open: boolean;
		title: string;
		message: string;
		confirmLabel: string;
		onconfirm: () => void;
		oncancel: () => void;
		danger?: boolean;
		children?: Snippet;
	} = $props();
</script>

{#snippet actions()}
	<!-- svelte-ignore a11y_autofocus -->
	<Button type="button" autofocus onclick={oncancel}>Cancel</Button>
	{#if danger}
		<Button type="button" variant="danger" onclick={onconfirm}>
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={UI_ICONS.trash} /></svg>
			{confirmLabel}
		</Button>
	{:else}
		<Button type="button" variant="primary" onclick={onconfirm}>{confirmLabel}</Button>
	{/if}
{/snippet}

<Sheet {open} {title} mode="dialog" onclose={oncancel} {actions}>
	<div class="confirm">
		<p class="message">{message}</p>
		{@render children?.()}
	</div>
</Sheet>

<style>
	.confirm {
		display: grid;
		gap: var(--space-3);
	}
	.message {
		margin: 0;
		overflow-wrap: anywhere;
		color: var(--ink-secondary);
	}
</style>
