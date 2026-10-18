<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ASPECT_COLORS, ASPECT_ICONS, type AspectColor, type AspectIcon } from '../../aspect-style';
	import { UI_ICONS, type UiIcon } from './icons';

	let {
		label,
		icon,
		color,
		end,
		children
	}: { label?: string; icon?: AspectIcon | UiIcon; color?: AspectColor; end?: Snippet; children: Snippet } =
		$props();

	const paths: Record<string, string> = { ...ASPECT_ICONS, ...UI_ICONS };
</script>

<div class="field-row">
	<span class="icon" style:color={color ? ASPECT_COLORS[color].fg : undefined}>
		{#if icon}<svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[icon]} /></svg>{/if}
	</span>
	<div class="body">
		{#if label}<span class="label">{label}</span>{/if}
		<div class="value">{@render children()}</div>
	</div>
	{#if end}<span class="end">{@render end()}</span>{/if}
</div>

<style>
	.field-row {
		display: grid;
		grid-template-columns: var(--icon-sm) minmax(0, 1fr) auto;
		align-items: center;
		gap: 0 var(--space-3);
		padding: 10px 14px;
	}

	.icon {
		display: flex;
		color: var(--ink-3);
	}

	svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: currentColor;
		stroke-width: 1.85;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.body {
		min-width: 0;
	}

	.label {
		display: block;
		font-size: var(--text-xs);
		color: var(--ink-3);
	}

	.value {
		font-size: 14px;
		color: var(--ink);
		overflow-wrap: anywhere;
	}

	.end {
		font-size: var(--text-sm);
		color: var(--ink-3);
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
</style>
