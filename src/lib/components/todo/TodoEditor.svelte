<!--
	The todo editor: every field of the contract on the sheet primitive (a bottom sheet below 768 px, a centred card from 768 px). The body
	scrolls and the footer stays pinned. Checklist edits save at once; the rest, status included, on Save. `readonly` (a todo of an archived
	class) locks every field and drops Save and Delete. `actions` (Add to sprint, Move to backlog) sits under the checklist.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack, type Snippet } from 'svelte';
	import type { Aspect, ClassType, HhMm, Id, IsoDate, Priority, Status, Todo } from '$lib/types';
	import Field from '../field/Field.svelte';
	import Button from '../ui/Button.svelte';
	import ConfirmDialog from '../ui/ConfirmDialog.svelte';
	import Sheet from '../ui/Sheet.svelte';
	import { UI_ICONS } from '../ui/icons';
	import TodoFields from './TodoFields.svelte';
	import { planError, submit, type ActionError } from './form';
	import { postTodo } from './post';

	let {
		todo,
		aspects,
		open,
		onclose,
		actions,
		readonly = false
	}: { todo: Todo; aspects: Aspect[]; open: boolean; onclose: () => void; actions?: Snippet; readonly?: boolean } = $props();

	// A draft of the main fields: checklist edits save at once and reload `todo`, and must not
	// overwrite what is typed here before Save.
	let title = $state('');
	let notes = $state('');
	let aspectId = $state(0);
	let priority = $state<Priority>(0);
	let dueDate = $state<IsoDate | ''>('');
	let projectId = $state<Id | ''>('');
	let classId = $state<Id | ''>('');
	let plannedDay = $state<IsoDate | ''>('');
	let startTime = $state<HhMm | ''>('');
	let endTime = $state<HhMm | ''>('');
	let type = $state<ClassType>('OTH');
	let status = $state<Status>('todo');
	let error = $state<ActionError | null>(null);
	let newItem = $state('');
	let confirming = $state(false);
	let deleteForm = $state<HTMLFormElement>();
	let editForm = $state<HTMLFormElement>();

	$effect.pre(() => {
		if (!open) return;
		untrack(() => {
			({ title, notes, aspectId, priority, status } = todo);
			dueDate = todo.dueDate ?? '';
			projectId = todo.projectId ?? '';
			classId = todo.classId ?? '';
			plannedDay = todo.day ?? '';
			startTime = todo.startTime ?? '';
			endTime = todo.endTime ?? '';
			type = todo.type ?? 'OTH';
			error = null;
		});
	});

	async function saved() {
		// `update` leaves the status alone; it has its own action.
		if (todo.sprintId !== null && status !== todo.status) {
			const failed = await postTodo('setStatus', { id: String(todo.id), status });
			if (failed) return (error = failed);
		}
		onclose();
	}

	function titleKeys(e: KeyboardEvent) {
		if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
		e.preventDefault();
		editForm?.requestSubmit();
	}

	function renameOnEnter(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		// Enter would submit through the item's first button (the checkbox); blurring saves via change.
		e.preventDefault();
		(e.currentTarget as HTMLElement).blur();
	}
</script>

{#snippet footer()}
	{#if !readonly}
		<Button variant="danger" type="button" class="editor-delete" onclick={() => (confirming = true)}>
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={UI_ICONS.trash} /></svg>
			<span class="label">Delete todo</span>
		</Button>
		<Button type="button" onclick={onclose}>Cancel</Button>
		<Button variant="primary" type="submit" form="edit-{todo.id}">Save</Button>
	{/if}
{/snippet}

<Sheet {open} title="Edit todo" {onclose} actions={readonly ? undefined : footer}>
	<div class="editor">
		<form
			id="edit-{todo.id}"
			class="form"
			method="POST"
			action="/todos?/update"
			aria-label="Edit todo"
			bind:this={editForm}
			use:enhance={submit({ onerror: (e) => (error = e), onsuccess: saved })}
		>
			<input type="hidden" name="id" value={todo.id} />
			{#if readonly}
				<p class="note">This todo belongs to a class in an archived semester, so its fields are locked. Unarchive the semester to edit it.</p>
			{/if}
			<Field
				multiline
				rows={2}
				label="Title"
				name="title"
				autocomplete="off"
				placeholder="Add a todo"
				{readonly}
				error={error?.field === 'title' ? 'Give the todo a title.' : undefined}
				bind:value={title}
				onkeydown={titleKeys}
			/>
			<TodoFields
				{aspects}
				bind:aspectId
				bind:priority
				bind:dueDate
				bind:projectId
				bind:classId
				bind:type
				bind:status
				showStatus={todo.sprintId !== null}
				planned
				bind:plannedDay
				bind:startTime
				bind:endTime
				linkedId={todo.projectId}
				clearProject
				clearClass
				{readonly}
			/>
			<Field
				multiline
				rows={4}
				label="Description"
				name="notes"
				placeholder="Add a description"
				hint="Markdown. Rendered notes show on the page and can be selected."
				{readonly}
				bind:value={notes}
			/>
			{#if error && error.field !== 'title'}
				<p class="form-error" role="alert">{planError(error) ?? `Couldn’t save the todo (${error.error}).`}</p>
			{/if}
		</form>

		<div class="checklist-block">
			<h3>Checklist</h3>
			<ul class="checklist" aria-label="Checklist">
				{#each todo.checklist as item, i (item.id)}
					<li>
						<form method="POST" action="/todos?/checklistRename" use:enhance={submit()}>
							<input type="hidden" name="itemId" value={item.id} />
							<button
								class="tick"
								role="checkbox"
								aria-checked={item.done}
								aria-label="Done: {item.text}"
								disabled={readonly}
								data-press="round"
								formaction="/todos?/checklistToggle"
								name="done"
								value={String(!item.done)}
							>
								<span>
									{#if item.done}
										<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={UI_ICONS.check} /></svg>
									{/if}
								</span>
							</button>
							<Field
								multiline
								rows={1}
								hideLabel
								label="Checklist item {i + 1}"
								name="text"
								autocomplete="off"
								{readonly}
								value={item.text}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
								onkeydown={renameOnEnter}
							/>
							{#if !readonly}
								<Button variant="quiet" icon type="submit" label="Delete item: {item.text}" formaction="/todos?/checklistDelete">
									<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={UI_ICONS.trash} /></svg>
								</Button>
							{/if}
						</form>
					</li>
				{/each}
			</ul>
			{#if todo.checklist.length === 0}<p class="empty">No items yet.</p>{/if}
			{#if !readonly}
				<form method="POST" action="/todos?/checklistAdd" use:enhance={submit({ onsuccess: () => (newItem = '') })}>
					<input type="hidden" name="todoId" value={todo.id} />
					<Field label="New checklist item" hideLabel name="text" placeholder="Add a checklist item" autocomplete="off" bind:value={newItem} />
				</form>
			{/if}
		</div>

		{#if actions && !readonly}<div class="cluster">{@render actions()}</div>{/if}
	</div>
</Sheet>

{#if !readonly}
	<ConfirmDialog
		open={confirming}
		title="Delete this todo?"
		message="“{todo.title.length > 60 ? `${todo.title.slice(0, 60)}…` : todo.title}” and its checklist will be gone for good."
		confirmLabel="Delete todo"
		onconfirm={() => deleteForm?.requestSubmit()}
		oncancel={() => (confirming = false)}
	/>
	<form
		bind:this={deleteForm}
		method="POST"
		action="/todos?/delete"
		use:enhance={submit({ onsuccess: () => ((confirming = false), onclose()) })}
		hidden
	>
		<input type="hidden" name="id" value={todo.id} />
	</form>
{/if}

<style>
	.editor {
		display: grid;
		gap: var(--space-4);
		min-inline-size: 0;
	}
	.form {
		display: grid;
		gap: var(--space-4);
		min-inline-size: 0;
	}
	.note {
		margin: 0;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-panel);
		background: var(--surface-sunken);
		font-size: var(--type-body-s-size);
		overflow-wrap: anywhere;
	}
	.form-error {
		margin: 0;
		font-size: var(--type-caption-size);
		font-weight: var(--weight-semibold);
		color: var(--danger);
	}
	.empty {
		margin: 0;
		font-size: var(--type-caption-size);
		color: var(--ink-secondary);
	}
	.checklist-block {
		display: grid;
		gap: var(--space-2);
		min-inline-size: 0;
	}
	h3 {
		margin: 0;
		font-family: var(--font-ui);
		font-size: var(--type-overline-size);
		line-height: var(--type-overline-line);
		letter-spacing: var(--type-kicker-tracking);
		font-weight: var(--type-overline-weight);
		text-transform: uppercase;
		color: var(--ink-secondary);
	}
	.checklist {
		display: grid;
		gap: var(--space-1);
		margin: 0 calc(-1 * var(--space-3));
		padding: 0;
		list-style: none;
	}
	.checklist li > form {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		min-inline-size: 0;
	}
	.checklist li > form > :global(.field) {
		flex: 1;
		min-inline-size: 0;
	}
	.tick {
		display: grid;
		place-items: center;
		flex: none;
		inline-size: max(var(--control-height-s), var(--target));
		block-size: max(var(--control-height-s), var(--target));
		padding: 0;
		border: 0;
		border-radius: var(--radius-round);
		background: none;
		color: var(--ink-on-inverse);
	}
	.tick > span {
		display: grid;
		place-items: center;
		inline-size: var(--space-6);
		block-size: var(--space-6);
		border-radius: var(--radius-round);
		background: var(--surface-raised);
		box-shadow: var(--ring-control);
	}
	.tick[aria-checked='true'] > span {
		background: var(--surface-inverse);
		box-shadow: none;
	}
	.tick:focus-visible {
		outline-offset: calc(-1 * var(--focus-width));
	}
	.cluster {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}
	.cluster :global(form) {
		display: contents;
	}

	/* Delete leads the pinned footer; on a phone it shrinks to the trash, its name stays for assistive tech. */
	:global(dialog[data-sheet] > footer > .btn.editor-delete) {
		margin-inline-end: auto;
	}
	@media (max-width: 479px) {
		:global(dialog[data-sheet] > footer > .btn.editor-delete .label) {
			position: absolute;
			inline-size: 1px;
			block-size: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
		:global(dialog[data-sheet] > footer > .btn.editor-delete) {
			padding-inline: 0;
		}
	}
</style>
