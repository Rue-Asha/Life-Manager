<script lang="ts">
	import ItAspectPrompt from '$lib/components/projects/ItAspectPrompt.svelte';
	import NewProjectForm from '$lib/components/projects/NewProjectForm.svelte';
	import ProjectCard from '$lib/components/projects/ProjectCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { OVERVIEW_GROUPS, STATUS_LABELS } from '$lib/projects';
	import type { ProjectStatus } from '$lib/types';

	let { data } = $props();

	let adding = $state(false);
	let changing = $state(false);
	let showImplemented = $state(false);

	const groups = $derived(
		OVERVIEW_GROUPS.map((status) => ({ status, projects: data.projects.filter((p) => p.status === status) })).filter(
			(g) => g.projects.length > 0
		)
	);
	const implemented = $derived(data.projects.filter((p) => p.status === 'implemented'));
	const active = $derived(data.projects.filter((p) => p.status === 'active' || p.status === 'in_progress').length);
	const itAspect = $derived(data.aspects.find((a) => a.id === data.itAspectId));
	const prompting = $derived(!itAspect || changing);
</script>

<svelte:head>
	<title>Projects · Life Manager</title>
</svelte:head>

{#snippet glyph(status: ProjectStatus)}
	<svg class="s s-{status}" viewBox="0 0 16 16" aria-hidden="true">
		{#if status === 'backlog'}
			<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.75" stroke-dasharray="2.6 2.6" />
		{:else if status === 'active'}
			<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.75" />
			<path d="M8 4a4 4 0 0 1 0 8Z" fill="currentColor" />
		{:else if status === 'in_progress'}
			<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.75" />
			<path d="M8 8V4a4 4 0 1 1-4 4Z" fill="currentColor" />
		{:else if status === 'paused'}
			<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.75" />
			<path d="M6.4 5.6v4.8 M9.6 5.6v4.8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
		{:else}
			<circle cx="8" cy="8" r="7" fill="currentColor" />
			<path d="m5 8.2 2 2 4-4.2" fill="none" stroke="var(--paper)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
		{/if}
	</svg>
{/snippet}

<PageHeader title="Projects" icon="folder">
	{#if !prompting}
		<Button type="button" variant="primary" onclick={() => (adding = true)}>
			<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>New project
		</Button>
	{/if}
</PageHeader>

{#if prompting}
	<ItAspectPrompt
		aspects={data.aspects}
		current={itAspect?.id ?? null}
		linkCount={data.linkCount}
		oncancel={itAspect ? () => (changing = false) : undefined}
		onsaved={() => (changing = false)}
	/>
{:else}
	<p class="sub">{active} active, {data.projects.length} in total</p>

	{#if adding}
		<NewProjectForm oncancel={() => (adding = false)} onsaved={() => (adding = false)} />
	{/if}

	{#if data.projects.length === 0}
		<p class="empty" data-testid="empty-state">
			Capture your first idea. A project starts in the backlog.
			<button type="button" onclick={() => (adding = true)}>New project</button>
		</p>
	{/if}

	{#each groups as { status, projects } (status)}
		<section class="group" data-testid="project-group-{status}" aria-labelledby="group-{status}">
			<h2 class="head" id="group-{status}">
				{@render glyph(status)}{STATUS_LABELS[status]}<span class="count num">{projects.length}</span>
			</h2>
			<ul class="cards" data-testid="project-grid">
				{#each projects as project (project.id)}
					<li><ProjectCard {project} /></li>
				{/each}
			</ul>
		</section>
	{/each}

	{#if implemented.length > 0}
		<section class="group" data-testid="project-group-implemented">
			<h2 class="head toggle">
				<button type="button" aria-expanded={showImplemented} onclick={() => (showImplemented = !showImplemented)}>
					<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
					{@render glyph('implemented')}Implemented ({implemented.length})
				</button>
			</h2>
			{#if showImplemented}
				<ul class="cards">
					{#each implemented as project (project.id)}
						<li><ProjectCard {project} /></li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}

	<p class="aspect">
		IT aspect: <strong data-testid="it-aspect">{itAspect!.name}</strong>
		<button type="button" onclick={() => (changing = true)}>Change IT aspect</button>
	</p>
{/if}

<style>
	.sub {
		margin: calc(-1 * var(--space-4)) 0 var(--space-6);
		color: var(--ink-3);
	}

	.group + .group {
		margin-top: var(--space-7);
	}

	.head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--line);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
	}

	.count {
		margin-left: auto;
		color: var(--ink-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
	}

	.toggle {
		padding: 0;
		color: var(--ink-2);
	}

	.toggle button {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: 0 0 var(--space-2);
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.toggle button:hover {
		color: var(--ink);
	}

	.chev {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: var(--ink-3);
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	[aria-expanded='true'] .chev {
		transform: rotate(90deg);
	}

	.s {
		width: var(--icon-sm);
		height: var(--icon-sm);
		flex: none;
		color: var(--ink-3);
	}

	.s-active,
	.s-in_progress {
		color: var(--accent);
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-3);
		margin: 0;
		padding: var(--space-4) 0 0;
		list-style: none;
	}

	.cards li {
		min-width: 0;
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

	.empty button:hover,
	.aspect button:hover {
		text-decoration: underline;
	}

	.aspect {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		margin-top: var(--space-8);
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.aspect strong {
		color: var(--ink-2);
		font-weight: var(--weight-medium);
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
