<!--
	Projects: one row per project in cards by status (In progress, Active, Backlog, Paused), a collapsed Implemented group, and the
	"IT aspect" panel (a right column from 1280 px, a card under the groups below). Before the first use only the IT aspect prompt shows.
	"New project" and "Change IT aspect" open sheets; the Implemented group grows open softly.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import AspectPrompt from '$lib/components/projects/AspectPrompt.svelte';
	import Disclosure from '$lib/components/ui/Disclosure.svelte';
	import ProjectForm from '$lib/components/projects/ProjectForm.svelte';
	import Split from '$lib/components/ui/Split.svelte';
	import '$lib/components/projects/projects.css';
	import Icon from '$lib/components/shell/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import { copy } from '$lib/copy';
	import { OVERVIEW_GROUPS, STATUS_LABELS } from '$lib/projects';
	import type { ProjectSummary } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const uid = $props.id();
	let adding = $state(false);
	let changing = $state(false);
	let showImplemented = $state(false);
	let failure = $state<{ error: string; field?: string; values?: { name: string; description: string; repoUrl: string; tags: string } } | null>(null);

	const groups = $derived(
		OVERVIEW_GROUPS.map((status) => ({ status, projects: data.projects.filter((p) => p.status === status) })).filter((g) => g.projects.length > 0)
	);
	const implemented = $derived(data.projects.filter((p) => p.status === 'implemented'));
	const count = (status: ProjectSummary['status']) => data.projects.filter((p) => p.status === status).length;
	const active = $derived(count('active') + count('in_progress'));
	const open = $derived(data.projects.reduce((n, p) => n + p.openTodos, 0));
	const itAspect = $derived(data.aspects.find((a) => a.id === data.itAspectId));
	const prompting = $derived(!itAspect);

	function create() {
		failure = null;
		adding = true;
	}
</script>

{#snippet row(p: ProjectSummary)}
	<li class="pj-row" aria-label={p.name}>
		<a class="pj-main" href="/projects/{p.id}" data-press>
			<span class="pj-text">
				<span class="pj-title pj-clamp2" data-user>{p.name}</span>
				{#if p.description}<span class="pj-meta pj-clamp2" data-user>{p.description}</span>{/if}
				{#if p.tags.length}
					<span class="pj-tags" role="group" aria-label="Tags">
						{#each p.tags.slice(0, 3) as t (t)}<span class="pj-tag" data-user title={t}>{t}</span>{/each}
						{#if p.tags.length > 3}<span class="pj-tag more">{copy.projects.moreTags(p.tags.length - 3)}</span>{/if}
					</span>
				{/if}
				<span class="pj-meta pj-facts">
					<span class="num">{p.openTodos ? copy.projects.open(p.openTodos) : copy.projects.noOpen}</span>
					{#if p.repoUrl}<span class="pj-cluster"><Icon name="projects" size={14} /><span>{copy.projects.repoLinked}</span></span>{/if}
				</span>
			</span>
			<span class="pj-lead" aria-hidden="true"><Icon name="chevron-right" /></span>
		</a>
	</li>
{/snippet}

<svelte:head>
	<title>Projects · Life Manager</title>
</svelte:head>

<div class="screen-head">
	<div class="screen-lead">
		<ul class="kicker"><li>Life</li><li>{copy.projects.kicker}</li></ul>
		<h1><em class="accent-word">{copy.projects.title}</em></h1>
		{#if !prompting}
			<p class="lede">{copy.projects.ledeCount(active, data.projects.length)}</p>
			{#if data.projects.length > 0}
				<div class="pj-head-action">
					<Button aria-haspopup="dialog" onclick={create}><Icon name="plus" size={18} />{copy.projects.newProject}</Button>
				</div>
			{/if}
		{/if}
	</div>
	{#if !prompting && data.projects.length > 0}
		<ul class="screen-facts" data-surface="inverse" aria-label={copy.projects.factsCaption}>
			<li class="facts-caption">{copy.projects.factsCaption}</li>
			<li><span class="n">{count('in_progress').toLocaleString('en-GB')}</span><span>{copy.projects.inProgress}</span></li>
			<li><span class="n">{count('active').toLocaleString('en-GB')}</span><span>{copy.projects.active}</span></li>
			<li><span class="n">{open.toLocaleString('en-GB')}</span><span>{copy.projects.openTodos}</span></li>
		</ul>
	{/if}
</div>

<div class="screen-body" data-settle>
	{#if prompting}
		<AspectPrompt mode="card" aspects={data.aspects} current={null} linkCount={data.linkCount} />
	{:else}
		<Split id="{uid}-pj" label={copy.projects.panel}>
			{#snippet main()}
				{#if data.projects.length === 0}
					<section class="card pj-panel" aria-label={copy.projects.title}>
						<EmptyState title={copy.empty.projects.heading} body={copy.empty.projects.body}>
							{#snippet action()}
								<Button variant="primary" aria-haspopup="dialog" onclick={create}><Icon name="plus" size={18} />{copy.projects.newProject}</Button>
							{/snippet}
						</EmptyState>
					</section>
				{/if}
				{#each groups as { status, projects } (status)}
					<section class="card pj-panel" aria-labelledby="{uid}-g-{status}">
						<div class="pj-count-head"><h2 class="ruled" id="{uid}-g-{status}">{STATUS_LABELS[status]}</h2><span class="card-note num">{projects.length}</span></div>
						<ul class="pj-stack" aria-label="{STATUS_LABELS[status]} projects">
							{#each projects as p (p.id)}{@render row(p)}{/each}
						</ul>
					</section>
				{/each}
				{#if implemented.length > 0}
					<section class="card pj-panel" aria-label={copy.projects.implemented}>
						<Disclosure id="{uid}-impl" level={2} label={copy.projects.implemented} count={implemented.length} bind:open={showImplemented}>
							<ul class="pj-stack" aria-label="Implemented projects">
								{#each implemented as p (p.id)}{@render row(p)}{/each}
							</ul>
						</Disclosure>
					</section>
				{/if}
			{/snippet}
			{#snippet side()}
				<p class="pj-quiet">{copy.projects.sideNote}</p>
				<p class="aspect-line">{copy.projects.aspectLine} <strong data-user>{itAspect!.name}</strong></p>
				<div class="pj-tail"><Button size="s" aria-haspopup="dialog" onclick={() => (changing = true)}>{copy.projects.changeAspect}</Button></div>
			{/snippet}
		</Split>
	{/if}
</div>

<Sheet open={adding} title={copy.projects.newProject} onclose={() => (adding = false)}>
	<form
		id="{uid}-new"
		method="POST"
		action="?/create"
		aria-label={copy.projects.newProject}
		novalidate
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'failure') {
					failure = result.data as NonNullable<typeof failure>;
					return;
				}
				adding = false;
				await update();
			}}
	>
		<ProjectForm values={failure?.values} {failure} />
	</form>
	{#snippet actions()}
		<Button type="button" onclick={() => (adding = false)}>{copy.projects.cancel}</Button>
		<Button variant="primary" type="submit" form="{uid}-new">{copy.projects.addProject}</Button>
	{/snippet}
</Sheet>

{#if itAspect}
	<AspectPrompt mode="sheet" open={changing} aspects={data.aspects} current={itAspect.id} linkCount={data.linkCount} onclose={() => (changing = false)} onsaved={() => (changing = false)} />
{/if}

<style>
	.aspect-line {
		margin: 0;
		overflow-wrap: anywhere;
	}
</style>
