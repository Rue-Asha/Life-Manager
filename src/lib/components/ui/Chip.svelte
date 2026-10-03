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
		gap: var(--space-1);
		height: 30px;
		padding: 0 var(--space-3) 0 var(--space-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--paper);
		color: var(--ink-2);
		font-size: var(--text-sm);
		white-space: nowrap;
		cursor: pointer;
	}

	.chip[aria-pressed='true'] {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--paper);
	}

	.late {
		color: var(--overdue);
		border-color: color-mix(in oklch, var(--overdue) 35%, var(--paper));
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
