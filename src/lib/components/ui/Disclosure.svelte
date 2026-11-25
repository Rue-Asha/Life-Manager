<!--
	A collapsible group: a heading holding a button with aria-expanded, and a panel that grows open in 220 ms (the row track from 0 to 1fr, the
	content fading in). Closed content is inert and hidden once the fade ends. Under reduced motion only the opacity changes. `name` makes the
	group a labelled region (the Archived group, an archived semester) or, with `role="group"`, a labelled group (a class's Done todos). `user` marks a label that is the user's own text (a semester name) and opts it back into selection; every other label is chrome.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../shell/Icon.svelte';

	let {
		id,
		label,
		count,
		open = $bindable(false),
		level = 3,
		name,
		role,
		user = false,
		children
	}: { id: string; label: string; count?: number; open?: boolean; level?: 2 | 3; name?: string; role?: 'group'; user?: boolean; children: Snippet } = $props();
</script>

<section class="disc" data-open={open ? '' : undefined} {role} aria-label={name}>
	<svelte:element this={`h${level}`} class="disc-h">
		<button type="button" class="disc-btn" aria-expanded={open} aria-controls="{id}-panel" data-press onclick={() => (open = !open)}>
			<span class="disc-label" data-user={user ? '' : undefined}>{label}{#if count !== undefined}{' '}<span class="disc-count">({count})</span>{/if}</span>
			<Icon name="chevron" size={18} />
		</button>
	</svelte:element>
	<div class="disc-panel" id="{id}-panel" inert={!open}>
		<div class="disc-inner">{@render children()}</div>
	</div>
</section>

<style>
	.disc {
		display: grid;
		gap: var(--space-2);
		min-inline-size: 0;
	}
	.disc-h {
		margin: 0;
		font: inherit;
	}
	.disc-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		inline-size: 100%;
		min-block-size: max(var(--control-height), var(--target));
		padding: 0 var(--space-4);
		border: 0;
		border-radius: var(--radius-control);
		background: var(--surface-control-solid);
		color: var(--ink);
		font-family: var(--font-ui);
		font-size: var(--type-label-size);
		font-weight: var(--type-label-weight);
		text-align: start;
	}
	@media (hover: hover) {
		.disc-btn:hover {
			background: var(--surface-control-solid-hover);
		}
	}
	.disc-label {
		min-inline-size: 0;
		overflow-wrap: anywhere;
	}
	.disc-count {
		font-variant-numeric: var(--numeric-figures);
		color: var(--ink-secondary);
	}
	.disc-btn > :global(svg) {
		flex: none;
		transition: transform var(--motion-glide) var(--ease-out);
	}
	.disc[data-open] > .disc-h > .disc-btn > :global(svg) {
		transform: rotate(180deg);
	}
	.disc-panel {
		display: grid;
		grid-template-rows: 0fr;
		visibility: hidden;
		opacity: 0;
		transition:
			grid-template-rows var(--motion-glide) var(--ease-out),
			opacity var(--motion-quick) var(--ease-out),
			visibility var(--motion-glide);
	}
	.disc[data-open] > .disc-panel {
		grid-template-rows: 1fr;
		visibility: visible;
		opacity: 1;
	}
	.disc-inner {
		min-block-size: 0;
		overflow: hidden;
		padding: var(--space-1);
		margin: calc(-1 * var(--space-1));
	}
	@media (prefers-reduced-motion: reduce) {
		.disc-btn > :global(svg) {
			transition: none;
		}
		.disc-panel,
		.disc[data-open] > .disc-panel {
			transition:
				opacity var(--motion-quick),
				visibility var(--motion-quick);
		}
	}
</style>
