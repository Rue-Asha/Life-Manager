<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import type { Aspect, Id, IsoDate, Priority, Target } from '$lib/types';
	import Button from '../ui/Button.svelte';
	import Chip from '../ui/Chip.svelte';
	import Sheet from '../ui/Sheet.svelte';
	import { UI_ICONS } from '../ui/icons';
	import TodoFields from './TodoFields.svelte';
	import { submit, type ActionError } from './form';

	let {
		aspects,
		target,
		defaultAspectId,
		open = $bindable(false)
	}: { aspects: Aspect[]; target: Target; defaultAspectId?: Id; open?: boolean } = $props();

	const desktop = new MediaQuery('min-width: 768px');

	let title = $state('');
	let notes = $state('');
	let chosenAspectId = $state<Id | null>(null);
	let priority = $state<Priority>(0);
	let dueDate = $state<IsoDate | ''>('');
	let projectId = $state<Id | ''>('');
	let checklist = $state<string[]>([]);
	let error = $state<ActionError | null>(null);
	let titleInput = $state<HTMLInputElement>();

	const aspectId = $derived(chosenAspectId ?? defaultAspectId ?? aspects[0].id);

	const MESSAGES: Record<string, string> = {
		required: 'Give the todo a title.',
		'no-aspect': 'Pick an aspect.',
		'no-active-sprint': 'There is no running sprint to add this to.',
		'day-outside-sprint': 'That day is not part of the sprint.'
	};

	function clear() {
		title = '';
		notes = '';
		chosenAspectId = null;
		priority = 0;
		dueDate = '';
		projectId = '';
		checklist = [];
		error = null;
	}

	$effect(() => {
		if (open) titleInput?.focus();
	});

	function close() {
		open = false;
		clear();
	}

	async function added() {
		clear();
		// Desktop keeps the card open for the next capture; the phone sheet steps aside.
		if (desktop.current) titleInput?.focus();
		else open = false;
	}

	async function checklistKey(e: KeyboardEvent, i: number) {
		if (e.key !== 'Enter') return;
		e.preventDefault();
		if (checklist[i].trim() && i === checklist.length - 1) checklist.push('');
		await tick();
		(e.currentTarget as HTMLElement).closest('ul')?.querySelectorAll('input')[i + 1]?.focus();
	}
</script>

{#snippet form()}
	<form
		method="POST"
		action="/todos?/create"
		aria-label="New todo"
		use:enhance={submit({ onerror: (e) => (error = e), onsuccess: added })}
	>
		<input type="hidden" name="target" value={target.kind} />
		{#if target.kind === 'day'}<input type="hidden" name="day" value={target.day} />{/if}

		<input
			class="title"
			name="title"
			placeholder="Add a todo"
			aria-label="Title"
			autocomplete="off"
			aria-invalid={error?.field === 'title'}
			bind:value={title}
			bind:this={titleInput}
			onkeydown={(e) => e.key === 'Escape' && desktop.current && close()}
		/>
		<textarea class="notes" name="notes" placeholder="Notes" aria-label="Notes" rows="1" bind:value={notes}
		></textarea>

		{#if checklist.length}
			<ul class="checklist">
				{#each checklist as _, i (i)}
					<li>
						<i aria-hidden="true"></i>
						<input
							name="checklist"
							placeholder="Checklist item"
							aria-label="Checklist item {i + 1}"
							bind:value={checklist[i]}
							onkeydown={(e) => checklistKey(e, i)}
						/>
					</li>
				{/each}
			</ul>
		{/if}

		<TodoFields {aspects} bind:aspectId={() => aspectId, (id) => (chosenAspectId = id)} bind:priority bind:dueDate bind:projectId>
			<Chip icon="list-checks" pressed={checklist.length > 0} onclick={() => (checklist = checklist.length ? [] : [''])}>
				Checklist
			</Chip>
		</TodoFields>

		{#if error}
			<p class="error" role="alert">{MESSAGES[error.error] ?? `Couldn’t add the todo (${error.error}).`}</p>
		{/if}

		<footer>
			<Button type="button" variant="quiet" onclick={close}>Cancel</Button>
			<Button type="submit" variant="primary">Add todo</Button>
		</footer>
	</form>
{/snippet}

<div class="quick-add">
	{#if open && desktop.current}
		<div class="card">{@render form()}</div>
	{:else}
		<button type="button" class="field" onclick={() => (open = true)}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>Add a todo
		</button>
	{/if}
</div>

{#if !desktop.current}
	<Sheet open={open} title="New todo" onclose={close}>{@render form()}</Sheet>
{/if}

<style>
	.field {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		height: var(--row-height);
		padding: 0 var(--space-3);
		border: 0;
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
		color: var(--ink-3);
		text-align: left;
		cursor: text;
	}

	.field:hover {
		color: var(--ink-2);
	}

	.field svg {
		width: var(--icon-md);
		height: var(--icon-md);
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
	}

	.card {
		padding: var(--space-4) var(--space-4) var(--space-3);
		border-radius: var(--radius-lg);
		background: var(--paper);
		box-shadow: var(--shadow-float);
		animation: expand var(--dur-base) var(--ease-out);
	}

	@keyframes expand {
		from {
			opacity: 0;
			transform: scale(0.98);
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

	.title::placeholder {
		color: var(--ink-3);
		font-weight: var(--weight-regular);
	}

	.notes {
		margin: var(--space-1) 0 var(--space-4);
		resize: none;
		field-sizing: content;
		color: var(--ink-2);
	}

	.notes::placeholder,
	.checklist input::placeholder {
		color: var(--ink-3);
	}

	.checklist {
		margin: calc(-1 * var(--space-2)) 0 var(--space-4);
		padding: 0;
		list-style: none;
	}

	.checklist li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 32px;
		border-bottom: 1px solid var(--line);
	}

	.checklist i {
		width: 12px;
		height: 12px;
		flex: none;
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius-pill);
	}

	.error {
		margin-top: var(--space-3);
		color: var(--overdue);
		font-size: var(--text-sm);
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		margin-top: var(--space-4);
		padding-top: var(--space-3);
		border-top: 1px solid var(--line);
	}

	@media (max-width: 767px) {
		.title {
			font-size: var(--text-lg);
		}

		footer {
			border-top: 0;
		}
	}
</style>
