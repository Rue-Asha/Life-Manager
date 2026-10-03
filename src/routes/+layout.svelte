<script lang="ts">
	import '@fontsource-variable/bricolage-grotesque/opsz.css';
	import '../app.css';
	import Sidebar from '../lib/components/shell/Sidebar.svelte';

	let { children } = $props();
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

	/* Wide screens: pages with a context rail lay out their own columns; the rest centre in the free space. */
	@media (min-width: 1280px) {
		.page {
			max-width: none;
		}

		:global(.page:not(:has(.rail-layout))) {
			max-width: calc(var(--content-max) + 2 * var(--gutter));
			margin-inline: auto;
		}

		:global(.page:has(.rail-layout)) {
			padding: 0;
		}
	}
</style>
