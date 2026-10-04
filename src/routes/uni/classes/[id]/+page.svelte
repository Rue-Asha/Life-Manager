<script lang="ts">
	import { enhance } from '$app/forms';
	import { MediaQuery } from 'svelte/reactivity';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import RailLayout from '$lib/components/shell/RailLayout.svelte';
	import LinkedTodos from '$lib/components/projects/LinkedTodos.svelte';
	import ProjectNotes from '$lib/components/projects/ProjectNotes.svelte';
	import ClassForm from '$lib/components/uni/ClassForm.svelte';
	import QuickAdd from '$lib/components/todo/QuickAdd.svelte';
	import ClassMeta from '$lib/components/uni/ClassMeta.svelte';
	import ClassRules from '$lib/components/uni/ClassRules.svelte';
	import RevisedControl from '$lib/components/uni/RevisedControl.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { GLYPHS } from '$lib/components/projects/glyphs';
	import AspectIcon from '$lib/components/ui/AspectIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import type { Todo } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cls = $derived(data.cls);
	const wide = new MediaQuery('min-width: 1280px');
	// Lucide "lock" (ISC licence, https://lucide.dev).
	const LOCK = 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z M7 11V7a5 5 0 0 1 10 0v4';

	const archived = $derived(cls.semester.archivedAt !== null);
	const edit = $derived(archived ? undefined : openEdit);

	let editing = $state(false);
	let deleting = $state(false);
	let deleteForm = $state<HTMLFormElement>();
	let error = $state<{ error: string; field?: string; fields?: Record<string, string> }>();

	const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
	const deleteMessage = $derived.by(() => {
		const parts = [
			data.counts.todos ? plural(data.counts.todos, 'todo', 'todos') : '',
			data.rules.length ? plural(data.rules.length, 'recurring rule', 'recurring rules') : ''
		].filter(Boolean);
		const what = parts.length ? `This deletes its ${parts.join(' and ')}.` : 'It has no todos or recurring rules.';
		return `${what} This can’t be undone.`;
	});

	function openEdit() {
		error = undefined;
		editing = true;
	}
</script>

<svelte:head>
	<title>{cls.name} · Life Manager</title>
</svelte:head>

{#snippet quickAdd()}
	{#if !archived && data.uniAspectId !== null}
		<div class="quick">
			<QuickAdd
				aspects={data.aspects}
				target={{ kind: 'backlog' }}
				defaultAspectId={data.uniAspectId}
				defaultClassId={cls.id}
				defaultType="OTH"
			/>
		</div>
	{/if}
{/snippet}

{#snippet rowExtra(todo: Todo)}
	{#if todo.type}<span class="type" data-testid="todo-type">{todo.type}</span>{/if}
	<RevisedControl {todo} today={data.today} readonly={archived} />
{/snippet}

{#snippet rail()}
	<ClassMeta {cls} todos={data.todos} today={data.today} mode="rail" onedit={edit} />
{/snippet}

<RailLayout railTitle="Details" rail={wide.current ? rail : undefined}>
	<a class="back" href="/uni">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['chevron-left']} /></svg>Uni
	</a>
	<div class="title">
		<span class="tile" data-testid="class-tile" data-color={cls.color} style:background={ASPECT_COLORS[cls.color].tint}>
			<AspectIcon icon={cls.icon} color={cls.color} />
		</span>
		<h1>{cls.name}</h1>
	</div>
	<p class="sub">{cls.semester.name}</p>
	{#if archived}
		<p class="ro">
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={LOCK} /></svg>{cls.semester.name} is archived. This class is read-only.
		</p>
	{/if}
	{#if !wide.current}
		<ClassMeta {cls} todos={data.todos} today={data.today} mode="row" onedit={edit} />
	{/if}

	<ProjectNotes
		html={data.notesHtml}
		notes={cls.notes}
		testid="class-notes"
		placeholder="No notes yet. Collect exam topics, formulas or links here."
		editable={!archived}
	/>

	<LinkedTodos
		todos={data.todos}
		today={data.today}
		sprintDays={data.sprintDays ?? undefined}
		title="Todos"
		testidPrefix="class-todos"
		emptyText="No todos for this class yet. Add one above."
		top={quickAdd}
		extra={rowExtra}
		readonly={archived}
	/>

	<ClassRules rules={data.rules} />

	<div class="danger">
		<button type="button" onclick={() => (deleting = true)}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS.trash} /></svg>Delete class
		</button>
	</div>
</RailLayout>

<form method="POST" action="?/delete" hidden bind:this={deleteForm} use:enhance></form>

<ConfirmDialog
	open={deleting}
	title="Delete {cls.name}?"
	message={deleteMessage}
	confirmLabel="Delete class"
	onconfirm={() => deleteForm?.requestSubmit()}
	oncancel={() => (deleting = false)}
/>

<Sheet open={editing} title="Edit details" onclose={() => (editing = false)}>
	{#if editing}
		<form
			method="POST"
			action="?/update"
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'failure') {
						error = result.data as unknown as { error: string; field?: string; fields?: Record<string, string> };
						return;
					}
					await update({ reset: false });
					editing = false;
				}}
		>
			<ClassForm {cls} {error} />
			<footer>
				<Button type="button" variant="quiet" onclick={() => (editing = false)}>Cancel</Button>
				<Button variant="primary">Save</Button>
			</footer>
		</form>
	{/if}
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

	.ro {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-3);
		color: var(--ink-2);
	}

	.ro svg,
	.danger svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		stroke-width: 1.75;
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

	.quick {
		margin-bottom: var(--space-5);
	}

	.type {
		padding: 1px 5px;
		border-radius: var(--radius-xs);
		background: var(--paper-sunk);
		color: var(--ink-2);
		font-size: 11px;
		font-weight: var(--weight-semibold);
		letter-spacing: 0.04em;
		line-height: 16px;
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		margin-top: var(--space-5);
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
