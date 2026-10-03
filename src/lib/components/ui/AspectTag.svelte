<script lang="ts">
	import { ASPECT_COLORS, type AspectColor, type AspectIcon as AspectIconName } from '../../aspect-style';
	import AspectIcon from './AspectIcon.svelte';

	let { name, color, icon }: { name: string; color: AspectColor; icon: AspectIconName } = $props();
</script>

<span class="tag" style:background={ASPECT_COLORS[color].tint}>
	<AspectIcon {icon} {color} size="sm" />{name}
</span>

<style>
	.tag {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: 26px;
		padding: 0 var(--space-2) 0 6px;
		border-radius: var(--radius-sm);
		color: var(--ink);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		white-space: nowrap;
	}
</style>
