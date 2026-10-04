<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import RailLayout from '$lib/components/shell/RailLayout.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import ArchivedGroup from '$lib/components/uni/ArchivedGroup.svelte';
	import DeadlineList from '$lib/components/uni/DeadlineList.svelte';
	import GradeLine from '$lib/components/uni/GradeLine.svelte';
	import NewSemesterForm from '$lib/components/uni/NewSemesterForm.svelte';
	import SemesterSection from '$lib/components/uni/SemesterSection.svelte';
	import UniAspectPrompt from '$lib/components/uni/UniAspectPrompt.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const wide = new MediaQuery('min-width: 1280px');
	let adding = $state(false);
	let changing = $state(false);

	const uniAspect = $derived(data.aspects.find((a) => a.id === data.uniAspectId));
	const prompting = $derived(!uniAspect || changing);
	const examAt = $derived(new Map(data.active.flatMap((s) => s.classes).map((c) => [c.id, c.examAt])));
</script>

<svelte:head>
	<title>Uni · Life Manager</title>
</svelte:head>

{#snippet deadlines()}
	<DeadlineList deadlines={data.deadlines} classes={data.classes} {examAt} today={data.today} />
{/snippet}

{#snippet aspectLine()}
	<p class="aspect">
		Todos of the aspect <strong data-testid="uni-aspect">{uniAspect!.name}</strong> can be linked to a class.
		<button type="button" aria-label="Change Uni aspect" onclick={() => (changing = true)}>Change</button>
	</p>
{/snippet}

{#snippet rail()}
	{@render deadlines()}
	{@render aspectLine()}
{/snippet}

<RailLayout railTitle="Deadlines" rail={wide.current && !prompting ? rail : undefined}>
	<PageHeader title="Uni" icon="graduation-cap">
		{#if !prompting}
			<Button type="button" variant="primary" onclick={() => (adding = true)}>
				<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>New semester
			</Button>
		{/if}
	</PageHeader>

	{#if prompting}
		<UniAspectPrompt
			aspects={data.aspects}
			current={uniAspect?.id ?? null}
			linkCount={data.linkCount}
			oncancel={uniAspect ? () => (changing = false) : undefined}
			onsaved={() => (changing = false)}
		/>
	{:else}
		<div class="sub"><GradeLine grades={data.overall} overall /></div>

		{#if !wide.current}
			<div class="deadlines">{@render deadlines()}</div>
		{/if}

		{#if adding}
			<NewSemesterForm oncancel={() => (adding = false)} onsaved={() => (adding = false)} />
		{/if}

		{#if data.active.length === 0 && data.archived.length === 0}
			<p class="empty" data-testid="empty-state">
				Start with the semester you are in now.
				<button type="button" onclick={() => (adding = true)}>New semester</button>
			</p>
		{/if}

		<div class="semesters">
			{#each data.active as semester (semester.id)}
				<SemesterSection {semester} counts={data.counts[semester.id]} today={data.today} />
			{/each}
		</div>

		{#if data.archived.length > 0}
			<ArchivedGroup semesters={data.archived} counts={data.counts} today={data.today} />
		{/if}

		{#if !wide.current}{@render aspectLine()}{/if}
	{/if}
</RailLayout>

<style>
	.sub {
		margin: calc(-1 * var(--space-4)) 0 var(--space-6);
	}

	.deadlines {
		margin-bottom: var(--space-8);
	}

	.semesters {
		display: grid;
		gap: var(--space-8);
	}

	.empty {
		padding: var(--space-8) var(--space-4);
		text-align: center;
		color: var(--ink-3);
	}

	.empty button,
	.aspect button {
		padding: 0;
		border: 0;
		background: none;
		color: var(--accent);
		font: inherit;
		font-weight: var(--weight-medium);
		cursor: pointer;
	}

	.empty button {
		display: block;
		margin: var(--space-1) auto 0;
	}

	.empty button:hover,
	.aspect button:hover {
		text-decoration: underline;
	}

	.aspect {
		margin-top: var(--space-8);
		padding-top: var(--space-4);
		border-top: 1px solid var(--line);
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.aspect strong {
		color: var(--ink-2);
		font-weight: var(--weight-semibold);
	}

	.i {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	@media (min-width: 768px) {
		.sub {
			margin-left: calc(var(--icon-lg) + var(--space-3));
		}
	}
</style>
