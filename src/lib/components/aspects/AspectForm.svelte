<script lang="ts" module>
	export const ASPECT_ERRORS: Record<string, string> = {
		required: 'Give the aspect a name.',
		duplicate: 'You already have an aspect with this name.'
	};
</script>

<!--
	The fields of New aspect / Edit aspect: the name, the 8 colours, the 25 icons. Only the fields: the aspects page puts them in a sheet and
	Welcome inside its own form next to the presets. A failed save keeps the entered values and draws an alert at the name.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import type { AspectColor, AspectIcon as AspectIconName } from '../../aspect-style';
	import Field from '../field/Field.svelte';
	import ColorIconPicker from '../ui/ColorIconPicker.svelte';

	let {
		name = '',
		color = 'tangerine',
		icon = 'star',
		error
	}: { name?: string; color?: AspectColor; icon?: AspectIconName; error?: string } = $props();

	let typed = $state(untrack(() => name));
	let chosenColor = $state<AspectColor>(untrack(() => color));
	let chosenIcon = $state<AspectIconName>(untrack(() => icon));
	$effect(() => {
		typed = name;
		chosenColor = color;
		chosenIcon = icon;
	});
</script>

<div class="a-form">
	<!-- svelte-ignore a11y_autofocus -->
	<Field label="Aspect name" name="name" placeholder="Aspect name" autocomplete="off" autofocus data-user error={error ? (ASPECT_ERRORS[error] ?? error) : undefined} bind:value={typed} />
	<ColorIconPicker bind:color={chosenColor} bind:icon={chosenIcon} />
</div>

<style>
	.a-form {
		display: grid;
		gap: var(--space-5);
		min-inline-size: 0;
	}
	.a-form :global(.field input) {
		font-size: max(1rem, var(--type-body-size));
	}
</style>
