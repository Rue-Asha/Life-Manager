<!--
	The class a todo belongs to, in a todo row's meta line: the class glyph, its name and the todo's type tag. A link to the class unless `href` is off.
-->
<script lang="ts">
	import type { ClassRef, ClassType } from '$lib/types';
	import Icon from '../shell/Icon.svelte';
	import ClassTag from './ClassTag.svelte';

	let { classRef, type, href = true }: { classRef: ClassRef; type: ClassType | null; href?: boolean } = $props();
</script>

<svelte:element this={href ? 'a' : 'span'} class="badge" href={href ? `/uni/classes/${classRef.id}` : undefined} data-color={classRef.color}>
	<span class="glyph" aria-hidden="true"><Icon aspect={classRef.icon} size={12} /></span><span class="name" data-user>{classRef.name}</span>{#if type}<span class="sr-only">{' · '}</span><ClassTag {type} />{/if}
</svelte:element>

<style>
	.badge {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--space-1-5);
		min-inline-size: 0;
		color: var(--ink-secondary);
		text-decoration: none;
	}
	/* An inline link in a meta line: 24 px is its floor; the row's title and tick carry the 44 px targets. */
	a.badge::after {
		content: '';
		position: absolute;
		inset-block: min(0px, calc((100% - var(--target-min)) / 2));
		inset-inline: 0;
	}
	@media (hover: hover) {
		a.badge:hover .name {
			color: var(--ink);
			text-decoration: underline;
			text-underline-offset: 0.25em;
		}
	}
	.glyph {
		display: grid;
		place-items: center;
		flex: none;
		inline-size: var(--space-5);
		block-size: var(--space-5);
		border-radius: var(--radius-round);
		background: var(--aspect);
		color: var(--aspect-ink);
	}
	.badge[data-color='sage'] { --aspect: var(--aspect-sage); }
	.badge[data-color='sky'] { --aspect: var(--aspect-sky); }
	.badge[data-color='lavender'] { --aspect: var(--aspect-lavender); }
	.badge[data-color='ochre'] { --aspect: var(--aspect-ochre); }
	.badge[data-color='berry'] { --aspect: var(--aspect-berry); }
	.badge[data-color='lagoon'] { --aspect: var(--aspect-lagoon); }
	.badge[data-color='tangerine'] { --aspect: var(--aspect-tangerine); }
	.badge[data-color='slate'] { --aspect: var(--aspect-slate); }
	.name {
		min-inline-size: 0;
		overflow-wrap: anywhere;
	}
</style>
