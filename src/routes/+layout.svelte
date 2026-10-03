<script lang="ts">
	import '@fontsource-variable/bricolage-grotesque/opsz.css';
	import '../app.css';

	let { children } = $props();
</script>

<div class="shell">
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

	.page {
		width: 100%;
		max-width: calc(var(--content-max) + 2 * var(--gutter));
		padding: var(--space-5) var(--gutter) var(--space-9);
	}

	@media (min-width: 768px) {
		.shell {
			grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
		}

		.page {
			grid-column: 2;
			padding-top: var(--space-8);
		}
	}
</style>
