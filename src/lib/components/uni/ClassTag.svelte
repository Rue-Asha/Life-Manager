<!--
	Class todo type (gate 5 choice): LEC, EXC and OTH differ by their letters, a small glyph and the fill role, never by hue. LEC: sunken pill
	with the text lines glyph. EXC: raised pill with a ring and the pencil glyph. OTH: no fill, quieter text, a dot. One component for the Uni
	hub, the class page, the class badge on todo rows and Recurring. `bare` drops the fill (inside a chosen pick).
-->
<script lang="ts">
	import type { ClassType } from '$lib/types';
	import './uni.css';

	let { type, bare = false }: { type: ClassType; bare?: boolean } = $props();
	const full = { LEC: 'Lecture', EXC: 'Exercise', OTH: 'Other' } as const;
</script>

<span class="u-type" class:bare data-type={type}>
	<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
		{#if type === 'LEC'}<path d="M4 6h16M4 12h16M4 18h10" />{:else if type === 'EXC'}<path d="M4 20l1-4 11-11 3 3-11 11zM14 7l3 3" />{:else}<circle cx="12" cy="12" r="2.5" />{/if}
	</svg>
	<abbr title={full[type]}>{type}</abbr>
</span>
