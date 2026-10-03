<script lang="ts">
	import type { ProjectSummary } from '$lib/types';
	import { UI_ICONS } from '../ui/icons';

	let { project }: { project: ProjectSummary } = $props();
</script>

<a class="card" href="/projects/{project.id}" data-testid="project-card">
	<span class="name">{project.name}</span>
	{#if project.description}<span class="desc">{project.description}</span>{/if}
	{#if project.tags.length}
		<ul aria-label="Tags">
			{#each project.tags as tag (tag)}<li>{tag}</li>{/each}
		</ul>
	{/if}
	<span class="foot">
		{#if project.repoUrl}
			<span class="repo" data-testid="project-repo">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['git-branch']} /></svg>
				<span class="visually-hidden">Repository linked</span>
			</span>
		{/if}
		{#if project.openTodos}
			<span class="num">{project.openTodos} open</span>
		{:else}
			<span>No open todos</span>
		{/if}
	</span>
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		height: 100%;
		padding: var(--space-4);
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--paper);
		color: inherit;
		text-decoration: none;
		transition: background-color var(--dur-fast) var(--ease-out);
	}

	.card:hover {
		background: var(--paper-hover);
	}

	.name {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
		letter-spacing: var(--tracking-title);
	}

	.desc {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--ink-2);
	}

	ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: inline-flex;
		align-items: center;
		height: 22px;
		padding: 0 var(--space-2);
		border-radius: var(--radius-xs);
		background: var(--paper-sunk);
		color: var(--ink-2);
		font-size: var(--text-xs);
	}

	.foot {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-3);
		margin-top: auto;
		padding-top: var(--space-2);
		font-size: var(--text-sm);
		color: var(--ink-3);
	}

	.repo {
		display: inline-flex;
		margin-right: auto;
	}

	svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
