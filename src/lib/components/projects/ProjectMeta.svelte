<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UI_ICONS } from '../ui/icons';
	import { GLYPHS } from './glyphs';
	import type { Project, ProjectTodos } from '$lib/types';

	let {
		project,
		todos,
		mode,
		onedit
	}: { project: Project; todos: ProjectTodos; mode: 'rail' | 'row'; onedit: () => void } = $props();

	const dateFull = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Berlin' });
	const dateShort = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/Berlin' });

	// The URL is validated as http(s) on save, so the host and path read as a label.
	const repoLabel = $derived(
		(project.repoUrl ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '')
	);
</script>

{#snippet repo(label: string, glyph = true)}
	<a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
		{#if glyph}<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['git-branch']} /></svg>{/if}{label}
	</a>
{/snippet}

{#snippet field(icon: string, label: string, value: Snippet)}
	<div class="field">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={icon} /></svg>
		<dt>{label}</dt>
		<dd>{@render value()}</dd>
	</div>
{/snippet}

{#if mode === 'rail'}
	<h2>Details</h2>
	<!-- Proton Pass-style field card: icon, small label over the value, hairlines between. -->
	<div class="card">
		<dl class="props" data-testid="project-meta">
			{#if project.repoUrl}
				{#snippet repoValue()}{@render repo(repoLabel.replace(/^github\.com\//, ''), false)}{/snippet}
				{@render field(UI_ICONS['git-branch'], 'Repo', repoValue)}
			{/if}
			{#if project.tags.length}
				{#snippet tagsValue()}
					<ul class="tags">
						{#each project.tags as tag (tag)}<li>{tag}</li>{/each}
					</ul>
				{/snippet}
				{@render field(UI_ICONS.flag, 'Tags', tagsValue)}
			{/if}
			{#snippet todosValue()}
				<span class="num">{todos.open.length} open, {todos.planned.length} planned, {todos.done.length} done</span>
			{/snippet}
			{@render field(UI_ICONS['list-checks'], 'Todos', todosValue)}
			{#snippet createdValue()}<span class="num">{dateFull.format(new Date(project.createdAt))}</span>{/snippet}
			{@render field(UI_ICONS.calendar, 'Created', createdValue)}
			{#snippet updatedValue()}<span class="num">{dateFull.format(new Date(project.updatedAt))}</span>{/snippet}
			{@render field(UI_ICONS.repeat, 'Updated', updatedValue)}
		</dl>
		<button type="button" class="edit" onclick={onedit}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS.pen} /></svg>Edit details
		</button>
	</div>
{:else}
	<div class="row" data-testid="project-meta">
		{#if project.repoUrl}<span class="pchip link">{@render repo(repoLabel)}</span>{/if}
		{#each project.tags as tag (tag)}<span class="pchip tag">{tag}</span>{/each}
		<span class="pchip">Created {dateShort.format(new Date(project.createdAt))}</span>
		<span class="pchip">Updated {dateShort.format(new Date(project.updatedAt))}</span>
		<button type="button" class="pchip" onclick={onedit}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS.pen} /></svg>Edit details
		</button>
	</div>
{/if}

<style>
	svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	h2 {
		margin-bottom: var(--space-3);
		color: var(--ink-2);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}

	.card {
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--surface);
	}

	.props {
		margin: 0;
	}

	.field {
		display: grid;
		grid-template-columns: var(--icon-sm) minmax(0, 1fr);
		align-items: center;
		gap: 0 var(--space-3);
		padding: 10px 14px;
		border-bottom: 1px solid var(--line);
	}

	.field svg {
		grid-row: span 2;
		color: var(--ink-3);
	}

	dt {
		color: var(--ink-3);
		font-size: var(--text-xs);
	}

	dd {
		margin: 0;
		min-width: 0;
		font-size: 14px;
	}

	a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--accent-hover);
		text-decoration: none;
		word-break: break-all;
	}

	a:hover {
		text-decoration: underline;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		margin: 2px 0 0;
		padding: 0;
		list-style: none;
	}

	.tags li {
		display: inline-flex;
		align-items: center;
		height: 22px;
		padding: 0 var(--space-2);
		border-radius: var(--radius-pill);
		background: var(--sunk);
		color: var(--ink-2);
		font-size: var(--text-xs);
	}

	.edit {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: 12px 14px;
		border: 0;
		border-radius: 0 0 12px 12px;
		background: none;
		color: var(--accent-hover);
		font-size: 14px;
		font-weight: var(--weight-medium);
		text-align: left;
		cursor: pointer;
	}

	.edit:hover {
		background: var(--hover);
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-4);
	}

	.pchip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: 28px;
		padding: 0 var(--space-3);
		border: 0;
		border-radius: var(--radius-pill);
		background: var(--sunk);
		color: var(--ink-2);
		font-size: var(--text-sm);
		white-space: nowrap;
	}

	.pchip.link {
		background: var(--accent-soft);
	}

	button.pchip {
		cursor: pointer;
	}

	button.pchip:hover {
		background: var(--line);
	}

	.link {
		max-width: 100%;
		overflow: hidden;
	}
</style>
