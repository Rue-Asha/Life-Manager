<script lang="ts">
	import { enhance } from '$app/forms';
	import { MediaQuery } from 'svelte/reactivity';
	import RailLayout from '$lib/components/shell/RailLayout.svelte';
	import ProjectMeta from '$lib/components/projects/ProjectMeta.svelte';
	import StatusPill from '$lib/components/projects/StatusPill.svelte';
	import ProjectNotes from '$lib/components/projects/ProjectNotes.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import { GLYPHS } from '$lib/components/projects/glyphs';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import { PROJECT_MESSAGES } from '$lib/projects';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const project = $derived(data.project);
	const wide = new MediaQuery('min-width: 1280px');

	let editing = $state(false);
	let deleting = $state(false);
	let deleteForm = $state<HTMLFormElement>();
	let error = $state<{ error: string; field?: string }>();
	const uid = $props.id();

	function edit() {
		error = undefined;
		editing = true;
	}
</script>

<svelte:head>
	<title>{project.name} · Life Manager</title>
</svelte:head>

{#snippet rail()}
	<ProjectMeta {project} todos={data.todos} mode="rail" onedit={edit} />
{/snippet}

<RailLayout railTitle="Details" rail={wide.current ? rail : undefined}>
	<a class="back" href="/projects">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['chevron-left']} /></svg>Projects
	</a>
	<h1>{project.name}</h1>
	<div class="status"><StatusPill status={project.status} openCount={data.counts.open} /></div>
	{#if project.description}<p class="desc">{project.description}</p>{/if}
	{#if !wide.current}
		<ProjectMeta {project} todos={data.todos} mode="row" onedit={edit} />
	{/if}
	<ProjectNotes html={data.notesHtml} notes={project.notes} />

	<div class="danger">
		<button type="button" onclick={() => (deleting = true)}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS.trash} /></svg>Delete project
		</button>
	</div>
</RailLayout>

<form method="POST" action="?/delete" hidden bind:this={deleteForm} use:enhance></form>

<ConfirmDialog
	open={deleting}
	title="Delete project?"
	message={data.counts.linked === 0
		? 'No todos are linked to it.'
		: `${data.counts.linked} linked ${data.counts.linked === 1 ? 'todo' : 'todos'} will be unlinked and kept.`}
	confirmLabel="Delete project"
	onconfirm={() => deleteForm?.requestSubmit()}
	oncancel={() => (deleting = false)}
/>

<Sheet open={editing} title="Edit details" onclose={() => (editing = false)}>
	<form
		method="POST"
		action="?/update"
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'failure') {
					error = result.data as unknown as { error: string; field?: string };
					return;
				}
				await update({ reset: false });
				editing = false;
			}}
	>
		<div class="field">
			<label for="{uid}-name">Name</label>
			<input id="{uid}-name" name="name" value={project.name} autocomplete="off" aria-invalid={error?.field === 'name' ? 'true' : undefined} />
			{#if error?.field === 'name'}<p class="error">{PROJECT_MESSAGES[error.error] ?? error.error}</p>{/if}
		</div>
		<div class="field">
			<label for="{uid}-desc">Description</label>
			<input id="{uid}-desc" name="description" value={project.description} autocomplete="off" />
		</div>
		<div class="field">
			<label for="{uid}-repo">Repository URL</label>
			<input id="{uid}-repo" name="repoUrl" value={project.repoUrl ?? ''} placeholder="https://github.com/…" autocomplete="off" aria-invalid={error?.field === 'repoUrl' ? 'true' : undefined} />
			{#if error?.field === 'repoUrl'}<p class="error">{PROJECT_MESSAGES[error.error] ?? error.error}</p>{/if}
		</div>
		<div class="field">
			<label for="{uid}-tags">Tags</label>
			<input id="{uid}-tags" name="tags" value={project.tags.join(', ')} autocomplete="off" />
			<p class="hint">Separate with commas.</p>
		</div>
		<footer>
			<Button type="button" variant="quiet" onclick={() => (editing = false)}>Cancel</Button>
			<Button variant="primary">Save</Button>
		</footer>
	</form>
</Sheet>

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

	.status {
		margin-top: var(--space-3);
	}

	.danger {
		display: flex;
		margin-top: var(--space-9);
	}

	.danger button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		height: var(--control-height);
		padding: 0 var(--space-3) 0 var(--space-2);
		border: 0;
		border-radius: var(--radius-md);
		background: none;
		color: var(--ink-2);
		font-weight: var(--weight-medium);
		cursor: pointer;
	}

	.danger button:hover {
		color: var(--ink);
	}

	.danger svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		stroke-width: 1.75;
	}

	.desc {
		margin-top: var(--space-4);
		max-width: 62ch;
		color: var(--ink-2);
	}

	form {
		display: grid;
		gap: var(--space-3);
	}

	.field {
		display: grid;
		gap: var(--space-1);
	}

	label {
		color: var(--ink-2);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	input {
		height: var(--control-height);
		padding: 0 var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--paper);
	}

	input[aria-invalid='true'] {
		border-color: var(--ink);
		box-shadow: inset 0 0 0 1px var(--ink);
	}

	.error {
		color: var(--ink);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	.hint {
		color: var(--ink-2);
		font-size: var(--text-sm);
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		margin-top: var(--space-2);
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
