<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '../ui/Button.svelte';

	let {
		children,
		rail,
		railTitle,
		wide = false,
		overlay = false
	}: { children: Snippet; rail?: Snippet; railTitle: string; wide?: boolean; overlay?: boolean } = $props();

	const id = $props.id();
	let open = $state(false);

	// Leaving the overlay (Week → Board) closes it, so a later return starts closed.
	$effect.pre(() => {
		if (!overlay) open = false;
	});
</script>

{#if rail}
	<div class="rail-layout" class:wide class:overlay>
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

	/* Wide desktop: the rail docks at the right edge; the content keeps the list measure, centred between
	   sidebar and rail.
	   An overlay layout (Week) keeps the toggle and panel, so the content gets the full width. */
	@media (min-width: 1280px) {
		.rail-layout:not(.overlay) {
			display: grid;
			grid-template-columns: minmax(0, 1fr) var(--rail-width);
			align-items: start;
		}

		.content {
			max-width: calc(var(--content-max) + 2 * var(--gutter));
			margin-inline: auto;
			padding: var(--space-8) var(--gutter) var(--space-9);
		}

		.wide .content {
			max-width: none;
		}

		.rail-layout:not(.overlay) .bar {
			display: none;
		}

		.rail-layout:not(.overlay) .rail {
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
