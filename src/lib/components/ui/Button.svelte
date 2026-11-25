<!-- The app's Button: the fingerprint button primitive under the names the pages already use. -->
<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import Base from '../button/Button.svelte';

	// Like a native <button>, it submits the form it sits in unless the page says type="button".
	let { variant = 'secondary', type = 'submit', ...rest }: ComponentProps<typeof Base> = $props();
</script>

<Base {variant} {type} {...rest} />
