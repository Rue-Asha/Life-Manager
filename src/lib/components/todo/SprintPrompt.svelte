<script lang="ts">
	import type { SprintPhase } from '$lib/types';
	import { UI_ICONS, type UiIcon } from '../ui/icons';

	let { phase }: { phase: SprintPhase } = $props();

	const PROMPTS: Record<SprintPhase, { icon: UiIcon; message: string; href: string; action: string } | null> = {
		none: { icon: 'calendar', message: 'No sprint is running.', href: '/sprint/plan', action: 'Plan your week' },
		planning: {
			icon: 'calendar',
			message: 'Your next sprint is being planned.',
			href: '/sprint/plan',
			action: 'Continue planning'
		},
		running: null,
		'review-available': {
			icon: 'flag',
			message: 'This sprint ends today.',
			href: '/sprint/review',
			action: 'Review it'
		},
		'review-required': {
			icon: 'flag',
			message: 'Last week’s sprint needs a review before the next one can start.',
			href: '/sprint/review',
			action: 'Review the sprint'
		}
	};

	const prompt = $derived(PROMPTS[phase]);
</script>

{#if prompt}
	<div class="prompt" data-testid="sprint-prompt" data-phase={phase}>
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS[prompt.icon]} /></svg>
		<p>{prompt.message} <a href={prompt.href}>{prompt.action}</a></p>
	</div>
{/if}

<style>
	.prompt {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
		color: var(--ink-2);
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

	a {
		font-weight: var(--weight-medium);
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
