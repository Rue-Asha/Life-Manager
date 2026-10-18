<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ASPECT_COLORS, ASPECT_ICONS, type AspectColor, type AspectIcon } from '../../aspect-style';
	import { UI_ICONS, type UiIcon } from './icons';

	// `icon` renders as a tinted tile: entity pages (an aspect, a project, a class) pass one, list pages don't.
	// `children` are the page actions; on a phone they sit on the back-link row.
	let {
		title,
		subtitle,
		icon,
		color,
		children
	}: {
		title: string;
		subtitle?: string | Snippet;
		icon?: AspectIcon | UiIcon;
		color?: AspectColor;
		children?: Snippet;
	} = $props();

	const paths: Record<string, string> = { ...ASPECT_ICONS, ...UI_ICONS };
</script>

<header>
	<a class="back" href="/menu">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['chevron-left']} /></svg>Lists
	</a>
	<div class="row">
		{#if icon}
			<span
				class="tile"
				data-testid="page-icon"
				style:color={color ? ASPECT_COLORS[color].fg : 'var(--accent)'}
				style:background={color ? ASPECT_COLORS[color].tint : 'var(--accent-soft)'}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[icon]} /></svg>
			</span>
		{/if}
		<div class="text">
			<h1>{title}</h1>
			{#if typeof subtitle === 'string'}
				<p class="subtitle">{subtitle}</p>
			{:else if subtitle}
				<p class="subtitle">{@render subtitle()}</p>
			{/if}
		</div>
		{#if children}
			<div class="actions">{@render children()}</div>
		{/if}
	</div>
</header>

<style>
	header {
		position: relative;
		margin-bottom: var(--space-5);
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-height: var(--row-height);
		margin-left: calc(-1 * var(--space-1));
		color: var(--accent);
		text-decoration: none;
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.text {
		min-width: 0;
	}

	h1 {
		font-size: 34px;
		font-weight: var(--weight-heavy);
		line-height: 1.1;
		letter-spacing: -0.025em;
		overflow-wrap: anywhere;
	}

	.subtitle {
		margin: var(--space-1) 0 0;
		font-size: 14px;
		color: var(--ink-3);
	}

	.subtitle :global(b) {
		color: var(--ink-2);
		font-weight: var(--weight-semibold);
	}

	/* Phone: actions sit on the back-link row, like an iOS nav bar, so the title keeps the full width. */
	.actions {
		position: absolute;
		top: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: var(--row-height);
	}

	.tile {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		flex: none;
		border-radius: 12px;
	}

	svg {
		width: var(--icon-md);
		height: var(--icon-md);
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	@media (min-width: 768px) {
		.back {
			display: none;
		}

		h1 {
			font-size: var(--text-3xl);
		}

		.actions {
			position: static;
			margin-left: auto;
		}
	}
</style>
