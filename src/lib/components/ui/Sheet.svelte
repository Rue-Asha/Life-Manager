<!--
	The app's Sheet: the fingerprint sheet primitive with the props the pages already pass. `open` is the only source of truth: Escape,
	the close control and a click outside ask the parent to close through `onclose`. Optional: kicker, mode ('dialog' is a centred card
	at every width), actions (the pinned footer).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Base from '../sheet/Sheet.svelte';

	let {
		open,
		title,
		onclose,
		kicker,
		mode,
		actions,
		children
	}: {
		open: boolean;
		title: string;
		onclose: () => void;
		kicker?: string;
		mode?: 'sheet' | 'dialog';
		actions?: Snippet;
		children: Snippet;
	} = $props();
</script>

<Base bind:open={() => open, (v) => !v && onclose()} {title} {kicker} {mode} {actions}>{@render children()}</Base>
