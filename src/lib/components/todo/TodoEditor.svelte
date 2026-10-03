<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack, type Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import type { Aspect, IsoDate, Priority, Todo } from '$lib/types';
	import Button from '../ui/Button.svelte';
	import ConfirmDialog from '../ui/ConfirmDialog.svelte';
	import Sheet from '../ui/Sheet.svelte';
	import { UI_ICONS } from '../ui/icons';
	import TodoFields from './TodoFields.svelte';
	import { submit, type ActionError } from './form';

	let {
		todo,
		aspects,
		open,
		onclose,
		actions
	}: { todo: Todo; aspects: Aspect[]; open: boolean; onclose: () => void; actions?: Snippet } = $props();

	const desktop = new MediaQuery('min-width: 768px');

	// A draft of the main fields: checklist edits save at once and reload `todo`, and must not
	// overwrite what is typed here before Save.
	let title = $state('');
	let notes = $state('');
	let aspectId = $state(0);
	let priority = $state<Priority>(0);
	let dueDate = $state<IsoDate | ''>('');
	let error = $state<ActionError | null>(null);
	let newItem = $state('');
	let confirming = $state(false);
	let deleteForm = $state<HTMLFormElement>();

	$effect.pre(() => {
		if (!open) return;
		untrack(() => {
			({ title, notes, aspectId, priority } = todo);
			dueDate = todo.dueDate ?? '';
			error = null;
		});
	});

	const aspectColor = $derived(ASPECT_COLORS[(aspects.find((a) => a.id === todo.aspectId) ?? aspects[0]).color].fg);

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open && desktop.current && !confirming) onclose();
	}

	function renameOnEnter(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		// Enter would submit through the item's first button (the checkbox); blurring saves via change.
		e.preventDefault();
		(e.currentTarget as HTMLInputElement).blur();
	}
</script>

<svelte:window {onkeydown} />

{#snippet body()}
	<form
		id="edit-{todo.id}"
		method="POST"
		action="/todos?/update"
		aria-label="Edit todo"
		use:enhance={submit({ onerror: (e) => (error = e), onsuccess: onclose })}
	>
		<input type="hidden" name="id" value={todo.id} />
		<input class="title" name="title" aria-label="Title" autocomplete="off" bind:value={title} />
		{#if error?.field === 'title'}<p class="error" role="alert">Give the todo a title.</p>{/if}
		<textarea class="notes" name="notes" placeholder="Notes" aria-label="Notes" rows="1" bind:value={notes}></textarea>
		<TodoFields {aspects} bind:aspectId bind:priority bind:dueDate />
		{#if error && error.field !== 'title'}
			<p class="error" role="alert">Couldn’t save the todo ({error.error}).</p>
		{/if}
	</form>

	<ul class="checklist" aria-label="Checklist" style:--a={aspectColor}>
		{#each todo.checklist as item, i (item.id)}
			<li>
				<form method="POST" action="/todos?/checklistRename" use:enhance={submit()}>
					<input type="hidden" name="itemId" value={item.id} />
					<button
						class="check"
						role="checkbox"
						aria-checked={item.done}
						aria-label="Done: {item.text}"
						formaction="/todos?/checklistToggle"
						name="done"
						value={String(!item.done)}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.check} /></svg>
					</button>
					<input
						class:done={item.done}
						name="text"
						value={item.text}
						aria-label="Checklist item {i + 1}"
						autocomplete="off"
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
						onkeydown={renameOnEnter}
					/>
					<button class="remove" formaction="/todos?/checklistDelete" aria-label="Delete item: {item.text}">
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.x} /></svg>
					</button>
				</form>
			</li>
		{/each}
	</ul>
	<form
		class="add-item"
		method="POST"
		action="/todos?/checklistAdd"
		use:enhance={submit({ onsuccess: () => (newItem = '') })}
	>
		<input type="hidden" name="todoId" value={todo.id} />
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>
		<input name="text" placeholder="Add a checklist item" aria-label="New checklist item" autocomplete="off" bind:value={newItem} />
	</form>

	<footer>
		<Button type="button" variant="quiet" onclick={() => (confirming = true)}>Delete</Button>
		{@render actions?.()}
		<span class="spacer"></span>
		<Button type="button" variant="quiet" onclick={onclose}>Cancel</Button>
		<Button type="submit" variant="primary" form="edit-{todo.id}">Save</Button>
	</footer>

	<form
		bind:this={deleteForm}
		method="POST"
		action="/todos?/delete"
		use:enhance={submit({ onsuccess: () => ((confirming = false), onclose()) })}
		hidden
	>
		<input type="hidden" name="id" value={todo.id} />
	</form>
{/snippet}

{#if desktop.current}
	{#if open}
		<div class="card">{@render body()}</div>
	{/if}
{:else}
	<Sheet {open} title="Edit todo" {onclose}>{@render body()}</Sheet>
{/if}

<ConfirmDialog
	open={confirming}
	title="Delete this todo?"
	message="“{todo.title}” and its checklist will be gone for good."
	confirmLabel="Delete todo"
	onconfirm={() => deleteForm?.requestSubmit()}
	oncancel={() => (confirming = false)}
/>

<style>
	.card {
		position: relative;
		z-index: 2;
		margin: var(--space-2) calc(-1 * var(--space-4));
		padding: var(--space-4) var(--space-4) var(--space-3);
		border-radius: var(--radius-lg);
		background: var(--paper);
		box-shadow: var(--shadow-float);
		transform-origin: top center;
		animation: expand var(--dur-slow) var(--ease-out);
	}

	@keyframes expand {
		from {
			opacity: 0.4;
			transform: scaleY(0.6);
		}
	}

	input,
	textarea {
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		background: none;
		outline: none;
	}

	input:focus-visible,
	textarea:focus-visible {
		box-shadow: none;
	}

	.title {
		font-weight: var(--weight-medium);
	}

	.notes {
		margin: var(--space-1) 0 var(--space-4);
		resize: none;
		field-sizing: content;
		color: var(--ink-2);
	}

	.notes::placeholder,
	.add-item input::placeholder {
		color: var(--ink-3);
	}

	.error {
		margin-top: var(--space-2);
		color: var(--overdue);
		font-size: var(--text-sm);
	}

	.checklist {
		margin: var(--space-4) 0 0;
		padding: 0;
		list-style: none;
	}

	.checklist form,
	.add-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 36px;
		border-bottom: 1px solid var(--line);
	}

	.check {
		display: grid;
		place-items: center;
		width: 15px;
		height: 15px;
		flex: none;
		padding: 0;
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius-pill);
		background: var(--paper);
		cursor: pointer;
	}

	.check svg {
		width: 9px;
		height: 9px;
		stroke: var(--ink-on-accent);
		stroke-width: 3.5;
		opacity: 0;
	}

	.check[aria-checked='true'] {
		background: var(--a);
		border-color: var(--a);
	}

	.check[aria-checked='true'] svg {
		opacity: 1;
	}

	.checklist input.done {
		color: var(--ink-3);
		text-decoration: line-through;
	}

	.remove {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		flex: none;
		padding: 0;
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--ink-3);
		cursor: pointer;
		opacity: 0;
	}

	.checklist li:hover .remove,
	.remove:focus-visible {
		opacity: 1;
	}

	.remove:hover {
		color: var(--ink);
	}

	.add-item {
		color: var(--ink-3);
	}

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

	footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-4);
	}

	.spacer {
		flex: 1;
	}

	@media (hover: none) {
		.remove {
			opacity: 1;
		}
	}

	@media (max-width: 767px) {
		.title {
			font-size: var(--text-lg);
		}
	}
</style>
