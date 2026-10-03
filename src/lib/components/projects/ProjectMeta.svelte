<script lang="ts">
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

{#snippet repo(label: string)}
	<a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['git-branch']} /></svg>{label}
	</a>
{/snippet}

{#if mode === 'rail'}
	<h2>Details</h2>
	<dl class="props" data-testid="project-meta">
		{#if project.repoUrl}
			<dt>Repo</dt>
			<dd>{@render repo(repoLabel.replace(/^github\.com\//, ''))}</dd>
		{/if}
		{#if project.tags.length}
			<dt>Tags</dt>
			<dd>
				<ul class="tags">
					{#each project.tags as tag (tag)}<li>{tag}</li>{/each}
				</ul>
			</dd>
		{/if}
		<dt>Todos</dt>
		<dd class="num">{todos.open.length} open, {todos.planned.length} planned, {todos.done.length} done</dd>
		<dt>Created</dt>
		<dd class="num">{dateFull.format(new Date(project.createdAt))}</dd>
		<dt>Updated</dt>
		<dd class="num">{dateFull.format(new Date(project.updatedAt))}</dd>
	</dl>
	<button type="button" class="edit" onclick={onedit}>
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS.pen} /></svg>Edit details
	</button>
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
		margin-bottom: var(--space-4);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	.props {
		display: grid;
		grid-template-columns: 76px minmax(0, 1fr);
		align-items: start;
		gap: var(--space-4) var(--space-3);
		margin: 0;
	}

	dt {
		padding-top: 2px;
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	dd {
		margin: 0;
		min-width: 0;
	}

	a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--accent);
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
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tags li {
		display: inline-flex;
		align-items: center;
		height: 22px;
		padding: 0 var(--space-2);
		border-radius: var(--radius-xs);
		background: var(--paper);
		color: var(--ink-2);
		font-size: var(--text-xs);
	}

	.edit {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		height: var(--control-height);
		margin-top: var(--space-6);
		padding: 0 var(--space-4);
		border: 0;
		border-radius: var(--radius-md);
		background: var(--paper);
		font-weight: var(--weight-medium);
		cursor: pointer;
	}

	.edit:hover {
		background: var(--paper-hover);
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
		height: 30px;
		padding: 0 var(--space-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--paper);
		color: var(--ink-2);
		font-size: var(--text-sm);
		white-space: nowrap;
	}

	.pchip.tag {
		border-color: transparent;
		background: var(--paper-sunk);
	}

	button.pchip {
		cursor: pointer;
	}

	button.pchip:hover {
		background: var(--paper-hover);
	}

	.link {
		max-width: 100%;
		overflow: hidden;
	}
</style>
