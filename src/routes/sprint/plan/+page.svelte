<script lang="ts">
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { enhance } from '$app/forms';
	import AspectIcon from '$lib/components/ui/AspectIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import { dateLabel, dayLabel } from '$lib/components/todo/format';
	import type { Id, Todo } from '$lib/types';
	import { addDays } from '$lib/week';

	let { data, form } = $props();

	type Pane = 'sprint' | 'backlog';

	const MOVES: Record<Pane, { action: string; label: string; icon: 'plus' | 'x' }> = {
		backlog: { action: '?/pull', label: 'Add to sprint', icon: 'plus' },
		sprint: { action: '?/unpull', label: 'Remove from sprint', icon: 'x' }
	};

	const ERRORS: Record<string, string> = {
		'review-pending': 'The last sprint needs a review first.',
		'sprint-active': 'A sprint is already running.'
	};

	const weekEnd = $derived(addDays(data.weekStart, 6));
	const weekLabel = $derived(
		`${data.weekStart.slice(5, 7) === weekEnd.slice(5, 7) ? dayLabel(data.weekStart) : dateLabel(data.weekStart)} – ${dateLabel(weekEnd)}`
	);

	const count = $derived(data.planned.length);
	const startLabel = $derived(count === 0 ? 'Start sprint' : `Start sprint with ${count} todo${count === 1 ? '' : 's'}`);

	const byAspect = (todos: Todo[]) =>
		data.aspects
			.map((aspect) => ({ aspect, todos: todos.filter((t) => t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0);

	// Drag is a mouse nicety; every move also has a button, which is the only path on touch.
	const drag = new MediaQuery('(hover: hover) and (pointer: fine)');
	let dragging = $state<{ id: Id; from: Pane } | null>(null);
	let over = $state<Pane | null>(null);
	let dropForm: HTMLFormElement;
	let drop = $state<{ id: Id; action: string }>({ id: 0, action: '' });

	function dragover(e: DragEvent, pane: Pane) {
		if (!dragging || dragging.from === pane) return;
		e.preventDefault();
		over = pane;
	}

	async function dropped(e: DragEvent, pane: Pane) {
		if (!dragging || dragging.from === pane) return;
		e.preventDefault();
		drop = { id: dragging.id, action: MOVES[dragging.from].action };
		dragging = over = null;
		await tick();
		dropForm.requestSubmit();
	}
</script>

<svelte:head>
	<title>Plan your week · Life Manager</title>
</svelte:head>

<PageHeader title="Plan your week" icon="calendar">
	<span class="week num" data-testid="plan-week">{weekLabel}</span>
</PageHeader>

<form bind:this={dropForm} method="POST" action={drop.action} use:enhance hidden>
	<input type="hidden" name="id" value={drop.id} />
</form>

{#snippet list(pane: Pane, items: Todo[])}
	{#each byAspect(items) as { aspect, todos } (aspect.id)}
		<section class="group" aria-labelledby="{pane}-{aspect.id}">
			<h3 id="{pane}-{aspect.id}">
				<AspectIcon icon={aspect.icon} color={aspect.color} size="sm" />{aspect.name}
				<span class="count num">{todos.length}</span>
			</h3>
			{#each todos as todo (todo.id)}
				<div
					class="item"
					role="presentation"
					draggable={drag.current}
					ondragstart={(e) => {
						e.dataTransfer?.setData('text/plain', String(todo.id));
						dragging = { id: todo.id, from: pane };
					}}
					ondragend={() => (dragging = over = null)}
				>
					<ul><TodoRow {todo} {aspect} today={data.today} context="planning" /></ul>
					<form method="POST" action={MOVES[pane].action} use:enhance>
						<input type="hidden" name="id" value={todo.id} />
						<button class="move" aria-label="{MOVES[pane].label}: {todo.title}" title={MOVES[pane].label}>
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS[MOVES[pane].icon]} /></svg>
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
		class:over={over === 'sprint'}
		data-testid="plan-sprint"
		aria-labelledby="sprint-heading"
		ondragover={(e) => dragover(e, 'sprint')}
		ondragleave={() => (over = null)}
		ondrop={(e) => dropped(e, 'sprint')}
	>
		<h2 id="sprint-heading">This sprint <span class="count num">{count}</span></h2>
		{#if count === 0}
			<p class="placeholder">
				{drag.current ? 'Drag todos here from the backlog.' : 'Add todos from the backlog below.'}
			</p>
		{/if}
		{@render list('sprint', data.planned)}
	</section>

	<section
		class="pane backlog"
		class:over={over === 'backlog'}
		data-testid="plan-backlog"
		aria-labelledby="backlog-heading"
		ondragover={(e) => dragover(e, 'backlog')}
		ondragleave={() => (over = null)}
		ondrop={(e) => dropped(e, 'backlog')}
	>
		<h2 id="backlog-heading">Backlog <span class="count num">{data.backlog.length}</span></h2>
		{#if data.backlog.length === 0}
			<p class="placeholder">Nothing left in the backlog.</p>
		{/if}
		{@render list('backlog', data.backlog)}
	</section>
</div>

<form class="start" method="POST" action="?/start" use:enhance>
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

	.pane.over {
		background: var(--accent-soft);
		box-shadow: 0 0 0 2px var(--accent);
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

	.item {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: start;
		gap: var(--space-2);
	}

	.item[draggable='true'] {
		cursor: grab;
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

		.backlog.over {
			background: var(--accent-soft);
		}

		.sprint {
			min-height: 100%;
		}
	}
</style>
