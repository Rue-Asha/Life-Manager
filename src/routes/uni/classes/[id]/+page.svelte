<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import RailLayout from '$lib/components/shell/RailLayout.svelte';
	import ClassMeta from '$lib/components/uni/ClassMeta.svelte';
	import AspectIcon from '$lib/components/ui/AspectIcon.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cls = $derived(data.cls);
	const wide = new MediaQuery('min-width: 1280px');
</script>

<svelte:head>
	<title>{cls.name} · Life Manager</title>
</svelte:head>

{#snippet rail()}
	<ClassMeta {cls} todos={data.todos} today={data.today} mode="rail" />
{/snippet}

<RailLayout railTitle="Details" rail={wide.current ? rail : undefined}>
	<a class="back" href="/uni">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['chevron-left']} /></svg>Uni
	</a>
	<div class="title">
		<span class="tile" style:background={ASPECT_COLORS[cls.color].tint}>
			<AspectIcon icon={cls.icon} color={cls.color} />
		</span>
		<h1>{cls.name}</h1>
	</div>
	<p class="sub">{cls.semester.name}</p>
	{#if !wide.current}
		<ClassMeta {cls} todos={data.todos} today={data.today} mode="row" />
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

	.title {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.tile {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		flex: none;
		border-radius: var(--radius-md);
	}

	h1 {
		min-width: 0;
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-title);
		overflow-wrap: anywhere;
	}

	.sub {
		margin-top: var(--space-1);
		color: var(--ink-3);
	}

	@media (min-width: 768px) {
		.back {
			display: none;
		}

		h1 {
			font-size: var(--text-3xl);
		}

		.sub {
			margin-left: calc(44px + var(--space-3));
		}
	}
</style>
