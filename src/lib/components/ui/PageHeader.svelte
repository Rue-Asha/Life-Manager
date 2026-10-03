<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ASPECT_COLORS, ASPECT_ICONS, type AspectColor, type AspectIcon } from '../../aspect-style';
	import { UI_ICONS, type UiIcon } from './icons';

	let {
		title,
		icon,
		color,
		children
	}: { title: string; icon?: AspectIcon | UiIcon; color?: AspectColor; children?: Snippet } = $props();

	const paths: Record<string, string> = { ...ASPECT_ICONS, ...UI_ICONS };
</script>

<header>
	<a class="back" href="/menu">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['chevron-left']} /></svg>Lists
	</a>
	<div class="row">
		<h1>
			{#if icon}
				<svg
					class="title-icon"
					viewBox="0 0 24 24"
					aria-hidden="true"
					style:color={color ? ASPECT_COLORS[color].fg : 'var(--accent)'}
				>
					<path d={paths[icon]} />
				</svg>
			{/if}
			{title}
		</h1>
		{#if children}
			<div class="actions">{@render children()}</div>
		{/if}
	</div>
</header>

<style>
	header {
		margin-bottom: var(--space-6);
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
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
	}

	h1 {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-width: 0;
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-title);
	}

	.actions {
		display: flex;
		gap: var(--space-2);
		margin-left: auto;
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

	.title-icon {
		width: var(--icon-lg);
		height: var(--icon-lg);
	}

	@media (min-width: 768px) {
		.back {
			display: none;
		}

		h1 {
			font-size: var(--text-3xl);
		}
	}
</style>
