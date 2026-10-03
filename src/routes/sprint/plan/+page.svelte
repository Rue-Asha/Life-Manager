<script lang="ts">
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { enhance } from '$app/forms';
	import BacklogRail from '$lib/components/rail/BacklogRail.svelte';
	import AspectIcon from '$lib/components/ui/AspectIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import { weekLabel } from '$lib/components/todo/format';
	import { canDrag, draggableTodo, dropZone } from '$lib/dnd';
	import { flipOpts, receive, send } from '$lib/motion';
	import type { Id, Todo } from '$lib/types';

	let { data, form } = $props();

	const ERRORS: Record<string, string> = {
		'review-pending': 'The last sprint needs a review first.',
		'sprint-active': 'A sprint is already running.'
	};

	// Suggestions are pulled when the sprint starts, unless unmarked by then.
	let unmarked = $state<Id[]>([]);
	const marked = $derived(data.suggested.filter((t) => !unmarked.includes(t.id)));
	const count = $derived(data.planned.length + marked.length);
	const startLabel = $derived(count === 0 ? 'Start sprint' : `Start sprint with ${count} todo${count === 1 ? '' : 's'}`);

	const byAspect = (todos: Todo[]) =>
		data.aspects
			.map((aspect) => ({ aspect, todos: todos.filter((t) => t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0);

	// Drag is a mouse nicety; every move also has a button, which is the only path on touch.
	let dropForm: HTMLFormElement;
	let drop = $state<{ id: Id; action: string }>({ id: 0, action: '' });

	async function move(id: Id, action: '?/pull' | '?/unpull') {
		drop = { id, action };
		await tick();
		dropForm.requestSubmit();
	}
</script>

<svelte:head>
	<title>Plan your week · Life Manager</title>
</svelte:head>

<PageHeader title="Plan your week" icon="calendar">
	<span class="week num" data-testid="plan-week">{weekLabel(data.weekStart)}</span>
</PageHeader>

<form bind:this={dropForm} method="POST" action={drop.action} use:enhance hidden>
	<input type="hidden" name="id" value={drop.id} />
</form>

{#snippet planned()}
	{#each byAspect(data.planned) as { aspect, todos } (aspect.id)}
		<section class="group" aria-labelledby="sprint-{aspect.id}">
			<h3 id="sprint-{aspect.id}">
				<AspectIcon icon={aspect.icon} color={aspect.color} size="sm" />{aspect.name}
				<span class="count num">{todos.length}</span>
			</h3>
			{#each todos as todo (todo.id)}
				<div
					class="item"
					role="presentation"
					in:receive={{ key: todo.id }}
					out:send={{ key: todo.id }}
					animate:flip={flipOpts()}
					use:draggableTodo={{ id: todo.id, from: 'sprint', recurring: todo.recurring }}
				>
					<ul><TodoRow {todo} {aspect} today={data.today} context="planning" /></ul>
					<form method="POST" action="?/unpull" use:enhance>
						<input type="hidden" name="id" value={todo.id} />
						<button class="move" aria-label="Remove from sprint: {todo.title}" title="Remove from sprint">
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.x} /></svg>
						</button>
					</form>
				</div>
			{/each}
		</section>
	{/each}
{/snippet}

<div class="panes">
	<section
		class="pane sprint"
		data-testid="plan-sprint"
		aria-labelledby="sprint-heading"
		use:dropZone={{ accepts: (p) => p.from === 'backlog', ondrop: (p) => move(p.id, '?/pull') }}
	>
		<h2 id="sprint-heading">This sprint <span class="count num">{count}</span></h2>
		{#if data.suggested.length > 0}
			<section class="suggestions" data-testid="plan-suggestions" aria-labelledby="suggestions-heading">
				<h3 id="suggestions-heading">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.flag} /></svg>Due this week
					<span class="count num">{marked.length} of {data.suggested.length}</span>
				</h3>
				{#each data.suggested as todo (todo.id)}
					{@const aspect = data.aspects.find((a) => a.id === todo.aspectId)!}
					<div class="item">
						<ul><TodoRow {todo} {aspect} today={data.today} context="planning" /></ul>
						<input
							type="checkbox"
							class="mark"
							form="start-form"
							name="suggested"
							value={todo.id}
							aria-label="Include: {todo.title}"
							checked={!unmarked.includes(todo.id)}
							onchange={(e) =>
								(unmarked = e.currentTarget.checked
									? unmarked.filter((id) => id !== todo.id)
									: [...unmarked, todo.id])}
						/>
					</div>
				{/each}
			</section>
		{/if}
		{#if data.planned.length === 0 && data.suggested.length === 0}
			<p class="placeholder">
				{canDrag.current ? 'Drag todos here from the backlog.' : 'Add todos from the backlog below.'}
			</p>
		{/if}
		{@render planned()}
	</section>

	<section class="pane backlog" aria-labelledby="backlog-heading">
		<h2 id="backlog-heading">Backlog <span class="count num">{data.backlog.length}</span></h2>
		<BacklogRail
			backlog={data.backlog}
			aspects={data.aspects}
			canAdd
			addAction="?/pull"
			onreturn={(id) => move(id, '?/unpull')}
			testid="plan-backlog"
		/>
	</section>
</div>

<form id="start-form" class="start" method="POST" action="?/start" use:enhance>
	{#if form?.error}
		<p class="error" role="alert">{ERRORS[form.error] ?? 'That didn’t work. Reload and try again.'}</p>
	{/if}
	<p class="hint">Recurring todos join on their days when the sprint starts.</p>
	<Button variant="primary">{startLabel}</Button>
</form>

<style>
	.week {
		color: var(--ink-2);
		font-size: var(--text-md);
		font-weight: var(--weight-medium);
	}

	.panes {
		display: grid;
		gap: var(--space-7);
	}

	.pane {
		min-width: 0;
		border-radius: var(--radius-lg);
		transition:
			background-color var(--dur-fast) var(--ease-out),
			box-shadow var(--dur-fast) var(--ease-out);
	}

	/* The drop slot is a hairline, not a filled target. */
	.pane:global([data-over]) {
		background: var(--accent-soft);
		box-shadow: inset 0 0 0 1px var(--accent);
	}

	h2 {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
		letter-spacing: var(--tracking-title);
	}

	.count {
		color: var(--ink-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-body);
	}

	h3 {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--line);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
	}

	h3 .count {
		margin-left: auto;
	}

	.group + .group {
		margin-top: var(--space-6);
	}

	.placeholder {
		padding: var(--space-6) var(--space-4);
		border: 1px dashed var(--line-strong);
		border-radius: var(--radius-md);
		color: var(--ink-3);
		text-align: center;
	}

	.suggestions {
		margin-bottom: var(--space-6);
	}

	.suggestions h3 svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: var(--accent);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.mark {
		appearance: none;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		margin: var(--space-1) 0 0;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--paper);
		cursor: pointer;
	}

	.mark::after {
		content: '';
		width: 10px;
		height: 5px;
		margin-top: -3px;
		border: solid var(--ink-on-accent);
		border-width: 0 0 2px 2px;
		transform: rotate(-45deg);
		opacity: 0;
	}

	.mark:checked {
		border-color: var(--accent);
		background: var(--accent);
	}

	.mark:checked::after {
		opacity: 1;
	}

	.item {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: start;
		gap: var(--space-2);
		border-radius: var(--radius-md);
	}

	.item:global([draggable='true']) {
		cursor: grab;
	}

	.item:global([data-dragging]) {
		background: var(--paper);
		box-shadow: var(--shadow-float);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.move {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		margin-top: var(--space-1);
		padding: 0;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--paper);
		color: var(--ink-2);
		cursor: pointer;
	}

	.move:hover {
		border-color: var(--ink-2);
		color: var(--ink);
	}

	.move svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
	}

	.start {
		position: sticky;
		bottom: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-2) var(--space-4);
		margin-top: var(--space-7);
		padding: var(--space-3) 0 var(--space-4);
		border-top: 1px solid var(--line);
		background: var(--paper);
	}

	.hint {
		margin-right: auto;
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.error {
		width: 100%;
		color: var(--ink);
		font-size: var(--text-sm);
	}

	.start :global(.btn) {
		flex: 1 1 100%;
	}

	@media (min-width: 768px) {
		.start :global(.btn) {
			flex: none;
		}
	}

	/* Desktop: the draft sprint on the left, the backlog as a sunk rail on the right. */
	@media (min-width: 1024px) {
		.panes {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			gap: var(--space-6);
			align-items: start;
		}

		.pane {
			padding: var(--space-4);
			margin: calc(-1 * var(--space-4));
		}

		.backlog {
			margin: 0;
			background: var(--paper-sunk);
		}

		.sprint {
			min-height: 100%;
		}
	}
</style>
