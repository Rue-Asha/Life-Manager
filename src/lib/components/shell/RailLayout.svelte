<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '../ui/Button.svelte';

	let {
		children,
		rail,
		railTitle,
		wide = false
	}: { children: Snippet; rail?: Snippet; railTitle: string; wide?: boolean } = $props();

	const id = $props.id();
	let open = $state(false);
</script>

{#if rail}
	<div class="rail-layout" class:wide>
		<div class="content">
			<div class="bar">
				<Button
					data-testid="rail-toggle"
					aria-expanded={open}
					aria-controls="{id}-rail"
					onclick={() => (open = !open)}
				>
					{railTitle}
				</Button>
			</div>
			{@render children()}
		</div>
		<aside id="{id}-rail" class="rail" class:open data-testid="context-rail" aria-label={railTitle}>
			{@render rail()}
		</aside>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	/* Phone: the page brings its own alternative to the rail (Sprint: the Manage sheet). */
	.bar,
	.rail {
		display: none;
	}

	/* Tablet and narrow desktop: the rail is an overlay panel the toggle slides in, without a scrim. */
	@media (min-width: 768px) {
		.bar {
			position: sticky;
			top: var(--space-4);
			z-index: 3;
			display: flex;
			justify-content: flex-end;
			margin-bottom: var(--space-5);
			pointer-events: none;
		}

		.bar > :global(*) {
			pointer-events: auto;
		}

		.rail {
			position: fixed;
			top: 0;
			right: 0;
			z-index: 2;
			display: block;
			width: min(var(--rail-width), 100vw - var(--sidebar-width));
			height: 100dvh;
			overflow-y: auto;
			padding: calc(var(--space-8) + var(--control-height) + var(--space-5)) var(--gutter) var(--space-8);
			background: var(--paper-sunk);
			box-shadow: var(--shadow-float);
			transform: translateX(100%);
			visibility: hidden;
			/* Hidden only after the slide-out ends, which keeps a closed rail out of the tab order. */
			transition:
				transform var(--dur-slow) var(--ease-out),
				visibility 0s linear var(--dur-slow);
		}

		.rail.open {
			transform: none;
			visibility: visible;
			transition: transform var(--dur-slow) var(--ease-out);
		}
	}

	/* Wide desktop: the rail docks at the right edge; the content keeps the list measure, left-aligned. */
	@media (min-width: 1280px) {
		.rail-layout {
			display: grid;
			grid-template-columns: minmax(0, 1fr) var(--rail-width);
			align-items: start;
		}

		.content {
			max-width: calc(var(--content-max) + 2 * var(--gutter));
			padding: var(--space-8) var(--gutter) var(--space-9);
		}

		.wide .content {
			max-width: none;
		}

		.bar {
			display: none;
		}

		.rail,
		.rail.open {
			position: sticky;
			z-index: auto;
			width: auto;
			padding-top: var(--space-8);
			box-shadow: none;
			transform: none;
			visibility: visible;
			transition: none;
		}
	}
</style>
