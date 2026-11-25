<!--
	The sprint prompt: one sentence and the one action, a card above the lists. Shown on Today and Sprint whenever the phase is not running.
	The action is the primary pill with the inline arrow (the one arrow style, R1).
-->
<script lang="ts">
	import type { SprintPhase } from '$lib/types';
	import Button from '../ui/Button.svelte';

	let { phase }: { phase: SprintPhase } = $props();

	const PROMPTS: Record<SprintPhase, { message: string; href: string; action: string } | null> = {
		none: { message: 'No sprint is running.', href: '/sprint/plan', action: 'Plan your week' },
		planning: { message: 'Your next sprint is being planned.', href: '/sprint/plan', action: 'Continue planning' },
		running: null,
		'review-available': { message: 'This sprint ends today.', href: '/sprint/review', action: 'Review it' },
		'review-required': {
			message: 'Last week’s sprint needs a review before the next one can start.',
			href: '/sprint/review',
			action: 'Review the sprint'
		}
	};

	const prompt = $derived(PROMPTS[phase]);
</script>

{#if prompt}
	<section class="card prompt" aria-label="Sprint prompt">
		<p>{prompt.message}</p>
		<Button variant="primary" arrow href={prompt.href}>{prompt.action}</Button>
	</section>
{/if}

<style>
	.prompt {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3) var(--space-4);
		padding: var(--space-4) var(--space-4) var(--space-4) var(--space-5);
		min-inline-size: 0;
	}
	p {
		flex: 1 1 14rem;
		min-inline-size: 0;
		margin: 0;
		font-size: var(--type-body-size);
		line-height: var(--type-body-line);
		overflow-wrap: anywhere;
	}
</style>
