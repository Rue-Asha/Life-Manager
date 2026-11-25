<!--
	Project page: the name with its ··· menu, the status pill (a menu), the description, Notes, and the linked todos in Open, Planned and Done.
	The Details panel (repo, tags, created, updated, Edit details) is a right column from 1280 px and a closed disclosure at the top below
	it. The Done group and the disclosure grow open softly.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import AspectTitle from '$lib/components/aspects/AspectTitle.svelte';
	import type { MenuItem } from '$lib/components/menu/Menu.svelte';
	import PopMenu from '$lib/components/menu/PopMenu.svelte';
	import Disclosure from '$lib/components/ui/Disclosure.svelte';
	import NotesCard from '$lib/components/ui/NotesCard.svelte';
	import ProjectForm from '$lib/components/projects/ProjectForm.svelte';
	import Split from '$lib/components/ui/Split.svelte';
	import '$lib/components/projects/projects.css';
	import Icon from '$lib/components/shell/Icon.svelte';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import { copy } from '$lib/copy';
	import { PROJECT_STATUSES, STATUS_LABELS } from '$lib/projects';
	import type { Aspect, ProjectStatus, Todo } from '$lib/types';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const project = $derived(data.project);
	const uid = $props.id();
	let editing = $state(false);
	let deleting = $state(false);
	let confirming = $state(false);
	let showDone = $state(false);
	let target = $state<ProjectStatus>('backlog');
	let statusForm = $state<HTMLFormElement>();
	let deleteForm = $state<HTMLFormElement>();
	let failure = $state<{ error: string; field?: string; values?: { name: string; description: string; repoUrl: string; tags: string } } | null>(null);

	const aspects = $derived(page.data.aspects as Aspect[]);
	const aspectOf = (id: number) => aspects.find((a) => a.id === id) ?? aspects[0];
	const total = $derived(data.todos.open.length + data.todos.planned.length + data.todos.done.length);
	const repoLabel = $derived((project.repoUrl ?? '').replace(/^https?:\/\//, '').replace(/\/$/, ''));
	const year = new Date().getFullYear();
	const day = (iso: string) => {
		const d = new Date(iso);
		const withYear = d.getFullYear() !== year;
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'Europe/Berlin' });
	};
	const statusItems = $derived<MenuItem[]>(PROJECT_STATUSES.map((s) => ({ label: STATUS_LABELS[s], value: s, checked: s === project.status })));

	function pick(next: ProjectStatus) {
		if (next === project.status) return;
		target = next;
		// The warning is a UI step only: the todos stay either way.
		if (next === 'implemented' && data.counts.open > 0) confirming = true;
		else save();
	}

	async function save() {
		confirming = false;
		await tick();
		statusForm?.requestSubmit();
	}

	function edit() {
		failure = null;
		editing = true;
	}

	const groups = $derived([
		{ key: 'open', label: copy.project.open, context: 'backlog', list: data.todos.open },
		{ key: 'planned', label: copy.project.planned, context: 'sprint', list: data.todos.planned }
	] as const);
</script>

{#snippet rows(list: Todo[], context: 'backlog' | 'sprint')}
	<div class="pj-trows" role="list">
		{#each list as todo (todo.id)}
			<div class="pj-trow" role="none">
				<TodoRow {todo} aspect={aspectOf(todo.aspectId)} today={data.today} {context} sprintDays={data.sprintDays ?? undefined} flat={context === 'sprint'} planMenu={context === 'backlog'} hideProject />
			</div>
		{/each}
	</div>
{/snippet}

{#snippet details()}
	<div role="group" aria-label={copy.project.detailsLabel}>
		<dl class="pj-kv">
			{#if project.repoUrl}
				<div>
					<dt>{copy.project.repository}</dt>
					<dd><a class="pj-ext" href={project.repoUrl} rel="noopener noreferrer" target="_blank" title={project.repoUrl}><span>{repoLabel}</span></a></dd>
				</div>
			{/if}
			{#if project.tags.length}
				<div>
					<dt>{copy.project.tags}</dt>
					<dd class="pj-tags">{#each project.tags as t (t)}<span class="pj-tag" data-user title={t}>{t}</span>{/each}</dd>
				</div>
			{/if}
			<div class="pj-hide-phone"><dt>{copy.project.created}</dt><dd>{day(project.createdAt)}</dd></div>
			<div class="pj-hide-phone"><dt>{copy.project.updated}</dt><dd>{day(project.updatedAt)}</dd></div>
		</dl>
	</div>
	<div class="pj-tail"><Button size="s" aria-haspopup="dialog" onclick={edit}>{copy.project.editDetails}</Button></div>
{/snippet}

<svelte:head>
	<title>{project.name} · Life Manager</title>
</svelte:head>

<form method="POST" action="?/status" hidden bind:this={statusForm} use:enhance={() => async ({ update }) => { await update({ reset: false }); }}>
	<input type="hidden" name="status" value={target} />
</form>
<form method="POST" action="?/delete" hidden bind:this={deleteForm} use:enhance></form>

<div class="screen-head">
	<div class="screen-lead">
		<ol class="kicker pj-kicker">
			<li><a href="/projects">{copy.project.kickerList}</a></li>
			<li aria-current="page">{copy.project.kickerHere}</li>
		</ol>
		<div class="pj-title-row">
			<AspectTitle name={project.name} userText={false} />
			<span class="pj-title-trail">
				<PopMenu name={copy.project.actions} items={[{ label: copy.project.delete, value: 'delete', danger: true }]} onselect={() => (deleting = true)}>
					{#snippet icon()}<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={UI_ICONS.trash} /></svg>{/snippet}
					{#snippet trigger(attrs)}
						<Button variant="quiet" icon type="button" label={copy.project.actions} {...attrs}><Icon name="more" size={20} /></Button>
					{/snippet}
				</PopMenu>
			</span>
		</div>
		<div class="pj-head-action">
			<PopMenu name={copy.project.setStatus} items={statusItems} radio wide onselect={(item) => pick(item.value as ProjectStatus)}>
				{#snippet trigger(attrs)}
					<Button class="pj-status" type="button" label={copy.project.statusLabel(STATUS_LABELS[project.status])} {...attrs}>
						<span>{STATUS_LABELS[project.status]}</span><Icon name="chevron" size={18} />
					</Button>
				{/snippet}
			</PopMenu>
		</div>
		{#if project.description}<p class="lede" data-user>{project.description}</p>{/if}
	</div>
	<ul class="screen-facts pj-wide-only" data-surface="inverse" aria-label={copy.project.factsCaption}>
		<li class="facts-caption">{copy.project.factsCaption}</li>
		<li><span class="n">{data.todos.open.length}</span><span>{copy.project.open}</span></li>
		<li><span class="n">{data.todos.planned.length}</span><span>{copy.project.planned}</span></li>
		<li><span class="n">{data.todos.done.length}</span><span>{copy.project.done}</span></li>
	</ul>
</div>

<div class="screen-body" data-settle>
	<Split id="{uid}-pd" mode="b" label={copy.project.details}>
		{#snippet main()}
			<NotesCard html={data.notesHtml} text={project.notes} empty={copy.project.notesEmpty} />
			<section class="card pj-panel" aria-labelledby="{uid}-todos">
				<div class="card-head"><h2 id="{uid}-todos">{copy.project.linkedTodos}</h2></div>
				{#if total === 0}
					<div class="empty"><p>{copy.project.noLinked}</p></div>
				{/if}
				{#each groups as g (g.key)}
					{#if g.list.length}
						<div class="pj-group" role="group" aria-label={g.label}>
							<div class="card-head"><h3 class="pj-group-h">{g.label}</h3><span class="card-note num">{g.list.length}</span></div>
							{@render rows(g.list, g.context)}
						</div>
					{/if}
				{/each}
				{#if data.todos.done.length}
					<div class="pj-group" role="group" aria-label={copy.project.done}>
						<Disclosure id="{uid}-done" label={copy.project.done} count={data.todos.done.length} bind:open={showDone}>
							{@render rows(data.todos.done, 'sprint')}
						</Disclosure>
					</div>
				{/if}
			</section>
		{/snippet}
		{#snippet side()}
			{@render details()}
		{/snippet}
	</Split>
</div>

<Sheet open={editing} title={copy.project.editDetails} onclose={() => (editing = false)}>
	<form
		id="{uid}-edit"
		method="POST"
		action="?/update"
		aria-label={copy.project.editDetails}
		novalidate
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'failure') {
					failure = result.data as NonNullable<typeof failure>;
					return;
				}
				await update({ reset: false });
				editing = false;
			}}
	>
		<ProjectForm
			values={failure?.values ?? { name: project.name, description: project.description, repoUrl: project.repoUrl ?? '', tags: project.tags.join(', ') }}
			{failure}
		/>
	</form>
	{#snippet actions()}
		<Button type="button" onclick={() => (editing = false)}>{copy.project.cancel}</Button>
		<Button variant="primary" type="submit" form="{uid}-edit">{copy.project.save}</Button>
	{/snippet}
</Sheet>

<ConfirmDialog
	open={confirming}
	title={copy.project.implementedTitle}
	message={copy.project.implementedMessage(data.counts.open)}
	confirmLabel={copy.project.implementedConfirm}
	onconfirm={save}
	oncancel={() => (confirming = false)}
/>
<ConfirmDialog
	open={deleting}
	title={copy.project.deleteTitle}
	message={copy.project.deleteMessage(data.counts.linked)}
	confirmLabel={copy.project.delete}
	onconfirm={() => deleteForm?.requestSubmit()}
	oncancel={() => (deleting = false)}
/>

<style>
	.pj-group {
		display: grid;
		gap: var(--space-2);
		min-inline-size: 0;
	}
	.pj-group-h {
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
	}
	.pj-trows {
		display: grid;
		min-inline-size: 0;
	}
	.pj-trow {
		position: relative;
	}
	.pj-trow + .pj-trow::before {
		content: '';
		position: absolute;
		inset-inline: 0;
		inset-block-start: 0;
		border-block-start: var(--stroke-hairline) solid var(--hairline);
		pointer-events: none;
	}
	:global(.btn.pj-status) {
		justify-content: space-between;
		gap: var(--space-3);
		max-inline-size: 100%;
		text-align: start;
	}
	:global(.btn.pj-status > span) {
		min-inline-size: 0;
		overflow-wrap: anywhere;
	}
</style>
