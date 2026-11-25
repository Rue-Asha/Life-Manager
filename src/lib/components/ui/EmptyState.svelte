<!--
	The app's EmptyState: the fingerprint empty-state primitive. Pass `title` and `body`, or one `message` ("No rules yet. Add one.")
	that splits into both at its first full stop; `href` and `actionLabel` give it its one link.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Base from '../empty-state/EmptyState.svelte';
	import Button from './Button.svelte';

	let {
		message,
		title,
		body,
		href,
		actionLabel,
		heading,
		action
	}: { message?: string; title?: string; body?: string; href?: string; actionLabel?: string; heading?: 'h2' | 'h3'; action?: Snippet } = $props();

	const split = $derived.by(() => {
		if (title !== undefined) return { title, body: body ?? '' };
		const m = (message ?? '').match(/^(.*?[.!?])(?:\s+(.*))?$/s);
		return m ? { title: m[1], body: m[2] ?? '' } : { title: message ?? '', body: '' };
	});
</script>

{#snippet link()}
	<Button variant="secondary" {href}>{actionLabel}</Button>
{/snippet}

<Base title={split.title} body={split.body} {heading} action={action ?? (href && actionLabel ? link : undefined)} />
