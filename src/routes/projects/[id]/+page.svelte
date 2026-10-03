<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import RailLayout from '$lib/components/shell/RailLayout.svelte';
	import ProjectMeta from '$lib/components/projects/ProjectMeta.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const project = $derived(data.project);
	const wide = new MediaQuery('min-width: 1280px');

	let editing = $state(false);
</script>

<svelte:head>
	<title>{project.name} · Life Manager</title>
</svelte:head>

{#snippet rail()}
	<ProjectMeta {project} todos={data.todos} mode="rail" onedit={() => (editing = true)} />
{/snippet}

<RailLayout railTitle="Details" rail={wide.current ? rail : undefined}>
	<a class="back" href="/projects">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['chevron-left']} /></svg>Projects
	</a>
	<h1>{project.name}</h1>
	{#if project.description}<p class="desc">{project.description}</p>{/if}
	{#if !wide.current}
		<ProjectMeta {project} todos={data.todos} mode="row" onedit={() => (editing = true)} />
	{/if}
</RailLayout>

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-height: var(--row-height);
		margin-left: calc(-1 * var(--space-1));
		color: var(--accent);
		text-decoration: none;
	}

	svg {
		width: var(--icon-md);
		height: var(--icon-md);
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	h1 {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-title);
	}

	.desc {
		margin-top: var(--space-4);
		max-width: 62ch;
		color: var(--ink-2);
	}

	@media (min-width: 768px) {
		.back {
			display: none;
		}

		h1 {
			font-size: var(--text-3xl);
		}
	}
</style>
