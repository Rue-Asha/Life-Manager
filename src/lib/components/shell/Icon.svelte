<script lang="ts" module>
	export type IconName =
		| 'today'
		| 'sprint'
		| 'backlog'
		| 'calendar'
		| 'more'
		| 'plus'
		| 'close'
		| 'check'
		| 'alert'
		| 'chevron'
		| 'chevron-right'
		| 'trash'
		| 'arrow'
		| 'dots'
		| 'aspects'
		| 'projects'
		| 'uni'
		| 'recurring'
		| 'sync'
		| 'lost';
</script>

<script lang="ts">
	import { ASPECT_ICONS, type AspectIcon } from '$lib/aspect-style';

	let { name, aspect, size = 18 }: { name?: IconName; aspect?: AspectIcon; size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
	{#if aspect}
		<path d={ASPECT_ICONS[aspect]} />
	{:else if name === 'today'}
		<circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
	{:else if name === 'sprint'}
		<path d="M5 21V4M5 5h11l-2 4 2 4H5" />
	{:else if name === 'backlog'}
		<path d="M4 6h16M4 12h16M4 18h10" />
	{:else if name === 'calendar'}
		<rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M9 3v4M15 3v4" />
	{:else if name === 'more'}
		<circle cx="6" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="18" cy="12" r="1" />
	{:else if name === 'plus'}
		<path d="M12 5v14M5 12h14" />
	{:else if name === 'close'}
		<path d="M6 6l12 12M18 6L6 18" />
	{:else if name === 'check'}
		<path d="M5 12.5l4.5 4.5L19 7.5" />
	{:else if name === 'alert'}
		<path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7.5v5M12 16.5h.01" />
	{:else if name === 'chevron'}
		<path d="M6 9l6 6 6-6" />
	{:else if name === 'chevron-right'}
		<path d="M9 6l6 6-6 6" />
	{:else if name === 'trash'}
		<path d="M4 7h16M9.5 7V4h5v3M6 7l1 13h10l1-13" />
	{:else if name === 'arrow'}
		<path d="M5 12h14M13 6l6 6-6 6" />
	{:else if name === 'dots'}
		<path d="M5 12h.01M12 12h.01M19 12h.01" />
	{:else if name === 'aspects'}
		<path d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z" />
	{:else if name === 'projects'}
		<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
	{:else if name === 'uni'}
		<path d="M3 9l9-4 9 4-9 4zM7 11.5V16c0 1.3 2.2 2.5 5 2.5s5-1.2 5-2.5v-4.5" />
	{:else if name === 'recurring'}
		<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" />
	{:else if name === 'sync'}
		<path d="M12 3a9 9 0 1 0 9 9M12 7v5l3 2" />
	{:else if name === 'lost'}
		<path d="M10 4.5l-7.5 13A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.5L14 4.5a2 2 0 0 0-4 0zM12 9.5v4M12 17h.01" />
	{/if}
</svg>
