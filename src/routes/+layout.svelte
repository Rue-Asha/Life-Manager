<script lang="ts">
	import '@fontsource-variable/bricolage-grotesque/opsz.css';
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import Sidebar from '../lib/components/shell/Sidebar.svelte';
	import { reducedMotion } from '../lib/motion';

	let { children } = $props();

	onNavigate((navigation) => {
		if (!document.startViewTransition || reducedMotion()) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<div class="shell">
	<div class="sidebar">
		<Sidebar />
	</div>
	<main class="page">
		{@render children()}
	</main>
</div>

<style>
	/* The cross-fade is a snapshot laid over the page; clicks and drags go through to the new page. */
	:global(::view-transition) {
		pointer-events: none;
	}

	:global(::view-transition-old(root)),
	:global(::view-transition-new(root)) {
		animation-duration: var(--dur-base);
		animation-timing-function: var(--ease-out);
	}

	.shell {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		min-height: 100dvh;
	}

	.sidebar {
		display: none;
	}

	.page {
		width: 100%;
		max-width: calc(var(--content-max) + 2 * var(--gutter));
		margin-inline: auto;
		padding: var(--space-5) var(--gutter) var(--space-9);
	}

	@media (min-width: 768px) {
		.shell {
			grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
		}

		/* The nav is a sticky viewport-high column; the cell behind it carries the colour down long pages. */
		.sidebar {
			display: block;
			background: var(--paper-sunk);
		}

		.page {
			padding-top: var(--space-8);
		}
	}

	/* Wide screens: pages with a context rail lay out their own columns and centre the content between
	   sidebar and rail; the rest keep the centred column. */
	@media (min-width: 1280px) {
		:global(.page:has(.rail-layout)) {
			max-width: none;
			padding: 0;
		}
	}
</style>
