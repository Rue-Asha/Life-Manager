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
		background: var(--surface-sunken);
		color: var(--ink-secondary);
		font-size: var(--type-label-size);
		white-space: nowrap;
		cursor: pointer;
		transition: background-color var(--motion-quick) var(--ease-out);
	}

	.chip {
		position: relative;
	}

	.chip::after {
		content: '';
		position: absolute;
		inset-block: min(0px, calc((100% - var(--target)) / 2));
		inset-inline: min(0px, calc((100% - var(--target)) / 2));
	}

	@media (hover: hover) and (pointer: fine) {
		.chip:hover {
			background: var(--hairline);
		}
	}

	.chip[aria-pressed='true'] {
		background: var(--surface-inverse);
		color: var(--ink-on-inverse);
	}

	.late {
		color: var(--danger);
		background: var(--danger-soft);
	}

	svg {
		width: 16px;
		height: 16px;
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
