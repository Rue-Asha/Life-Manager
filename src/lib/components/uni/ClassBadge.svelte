<script lang="ts">
	import type { ClassRef, ClassType } from '$lib/types';
	import AspectIcon from '../ui/AspectIcon.svelte';

	let { classRef, type, href = true }: { classRef: ClassRef; type: ClassType | null; href?: boolean } = $props();
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	class="badge"
	href={href ? `/uni/classes/${classRef.id}` : undefined}
	data-testid="class-badge"
>
	<AspectIcon icon={classRef.icon} color={classRef.color} size="sm" />{classRef.name}{#if type}<span class="visually-hidden">{' · '}</span><span class="type">{type}</span>{/if}
</svelte:element>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-width: 0;
		color: var(--ink-3);
		font-size: var(--text-sm);
		overflow-wrap: anywhere;
		text-decoration: none;
	}

	a.badge:hover {
		color: var(--ink);
	}

	.badge :global(svg) {
		width: 14px;
		height: 14px;
	}

	.type {
		flex: none;
		overflow-wrap: normal;
		padding: 1px 5px;
		border-radius: var(--radius-xs);
		background: var(--paper-sunk);
		color: var(--ink-2);
		font-size: 11px;
		font-weight: var(--weight-semibold);
		letter-spacing: 0.04em;
		line-height: 16px;
	}
</style>
