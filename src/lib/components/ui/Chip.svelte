<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { UI_ICONS, type UiIcon } from './icons';

	let {
		pressed,
		late = false,
		icon,
		children,
		...rest
	}: HTMLButtonAttributes & { pressed?: boolean; late?: boolean; icon?: UiIcon; children: Snippet } = $props();
</script>

<button type="button" class="chip" class:late aria-pressed={pressed} {...rest}>
	{#if icon}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS[icon]} /></svg>
	{/if}
	{@render children()}
</button>

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 28px;
		padding: 0 var(--space-3) 0 10px;
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--sunk);
		color: var(--ink-2);
		font-size: var(--text-sm);
		white-space: nowrap;
		cursor: pointer;
		transition: background-color var(--dur-fast) var(--ease-out);
	}

	.chip:hover {
		background: var(--line);
	}

	.chip[aria-pressed='true'] {
		background: var(--chrome);
		color: var(--on-chrome);
	}

	.late {
		color: var(--overdue);
		background: var(--overdue-soft);
	}

	svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
