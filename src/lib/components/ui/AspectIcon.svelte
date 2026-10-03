<script lang="ts">
	import { ASPECT_COLORS, ASPECT_ICONS, type AspectColor, type AspectIcon } from '../../aspect-style';

	let { icon, color, size = 'md' }: { icon: AspectIcon; color: AspectColor; size?: 'sm' | 'md' | 'lg' } =
		$props();
</script>

<svg class={size} viewBox="0 0 24 24" aria-hidden="true" style:color={ASPECT_COLORS[color].fg}>
	<path d={ASPECT_ICONS[icon]} />
</svg>

<style>
	svg {
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.sm {
		width: var(--icon-sm);
		height: var(--icon-sm);
		stroke-width: 1.75;
	}

	.md {
		width: var(--icon-md);
		height: var(--icon-md);
	}

	.lg {
		width: var(--icon-lg);
		height: var(--icon-lg);
	}
</style>
