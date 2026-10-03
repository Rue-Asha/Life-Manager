<script lang="ts">
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { draggableTodo, dropZone } from '$lib/dnd';
	import { flipOpts, receive, send } from '$lib/motion';
	import type { Aspect, AspectProgress, Id, IsoDate, Todo } from '$lib/types';
	import TodoRow from '../todo/TodoRow.svelte';
	import { submit, type ActionError } from '../todo/form';
	import AspectIcon from '../ui/AspectIcon.svelte';
	import ProgressBar from '../ui/ProgressBar.svelte';
	import { UI_ICONS } from '../ui/icons';

	let {
		backlog,
		aspects,
		progress = {},
		canAdd,
		addAction,
		addLabel = 'Add to sprint',
		onadd,
		onreturn,
		testid = 'backlog-rail'
	}: {
		backlog: Todo[];
		aspects: Aspect[];
		progress?: Record<Id, AspectProgress>;
		canAdd: boolean;
		addAction: string;
		addLabel?: string;
		onadd?: (id: Id) => void;
		onreturn?: (id: Id) => void;
		testid?: string;
	} = $props();

	const STORAGE_KEY = 'lm:rail-collapsed';
	const today = $derived(page.data.today as IsoDate);

	let query = $state('');
	let collapsed = $state<Id[]>([]);
	let failure = $state<{ id: Id; error: string } | null>(null);

	const matches = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return q ? backlog.filter((t) => t.title.toLowerCase().includes(q)) : backlog;
	});
	const groups = $derived(
		aspects
			.map((aspect) => ({
				aspect,
				count: backlog.filter((t) => t.aspectId === aspect.id).length,
				todos: matches.filter((t) => t.aspectId === aspect.id)
			}))
			.filter((g) => g.todos.length > 0)
	);

	// Collapsed groups are a per-viewer nicety; without storage every group just starts open.
	onMount(() => {
		try {
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
			if (Array.isArray(stored)) collapsed = stored.filter((id) => typeof id === 'number');
		} catch {}
	});

	function toggle(id: Id) {
		collapsed = collapsed.includes(id) ? collapsed.filter((c) => c !== id) : [...collapsed, id];
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
		} catch {}
	}

	// A todo another tab already moved isn't worth a message: the reload shows where it went.
	function failed(id: Id) {
		return (e: ActionError) => {
			if (e.error === 'not-found') invalidateAll();
			else failure = { id, error: e.error };
		};
	}
</script>

<div
	class="rail"
	data-testid={testid}
	use:dropZone={{
		accepts: (p) => !!onreturn && p.from === 'sprint' && !p.recurring,
		ondrop: (p) => onreturn?.(p.id)
	}}
>
	{#if backlog.length === 0}
		<p class="empty">The backlog is empty. <a href="/backlog">Open Backlog</a></p>
	{:else}
		<input
			class="filter"
			type="search"
			placeholder="Filter backlog"
			aria-label="Filter backlog"
			data-testid="rail-filter"
			bind:value={query}
		/>
		{#if groups.length === 0}
			<p class="empty">No backlog todo matches</p>
		{/if}
		{#each groups as { aspect, count, todos } (aspect.id)}
			{@const shut = collapsed.includes(aspect.id)}
			{@const sprint = progress[aspect.id]}
			<section class="group" data-testid="rail-group-{aspect.id}" data-collapsed={String(shut)}>
				<h3>
					<button type="button" class="toggle" aria-expanded={!shut} onclick={() => toggle(aspect.id)}>
						<svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
						<AspectIcon icon={aspect.icon} color={aspect.color} size="sm" />
						<span class="name">{aspect.name}</span>
					</button>
					{#if sprint}<ProgressBar done={sprint.done} total={sprint.total} color={aspect.color} />{/if}
					<span class="count num" data-testid="rail-count" aria-label="{count} in backlog">{count}</span>
				</h3>
				{#if !shut}
					{#each todos as todo (todo.id)}
						<div
							class="item"
							role="presentation"
							in:receive={{ key: todo.id }}
							out:send={{ key: todo.id }}
							animate:flip={flipOpts()}
							use:draggableTodo={{ id: todo.id, from: 'backlog', recurring: todo.recurring }}
						>
							<ul><TodoRow {todo} {aspect} {today} context="planning" /></ul>
							{#if canAdd}
								<!-- With `onadd` the page posts the add itself, so it can move the todo before the reload. -->
								<form
									method="POST"
									action={addAction}
									use:enhance={onadd
										? ({ cancel }) => {
												cancel();
												onadd(todo.id);
											}
										: submit({ onerror: failed(todo.id), onsuccess: () => (failure = null) })}
								>
									<input type="hidden" name="id" value={todo.id} />
									<button class="add" aria-label="{addLabel}: {todo.title}" title={addLabel}>
										<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>
									</button>
								</form>
							{/if}
							{#if failure?.id === todo.id}
								<p class="error" role="alert">
									{#if failure.error === 'review-required'}
										The sprint needs its review first. <a href="/sprint/review">Review</a>
									{:else}
										That didn’t work. Reload and try again.
									{/if}
								</p>
							{/if}
						</div>
					{/each}
				{/if}
			</section>
		{/each}
	{/if}
</div>

<style>
	.rail {
		min-height: 120px;
		border-radius: var(--radius-md);
		transition: background-color var(--dur-fast) var(--ease-out);
	}

	/* The drop slot is a hairline, not a filled target. */
	.rail:global([data-over]) {
		background: var(--accent-soft);
		box-shadow: inset 0 0 0 1px var(--accent);
	}

	.filter {
		width: 100%;
		height: 36px;
		margin-bottom: var(--space-5);
		padding: 0 var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--paper);
		color: var(--ink);
		font: inherit;
		font-size: var(--text-sm);
	}

	.empty {
		padding: var(--space-6) var(--space-4);
		color: var(--ink-3);
		text-align: center;
	}

	a {
		color: var(--accent);
		font-weight: var(--weight-medium);
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	.group + .group {
		margin-top: var(--space-5);
	}

	h3 {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--line);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
	}

	.toggle {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chevron {
		flex: none;
		width: 14px;
		height: 14px;
		fill: none;
		stroke: var(--ink-3);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		transition: transform var(--dur-fast) var(--ease-out);
	}

	[data-collapsed='true'] .chevron {
		transform: rotate(-90deg);
	}

	.count {
		color: var(--ink-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
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

	form {
		display: contents;
	}

	.add {
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

	.add:hover {
		border-color: var(--ink-2);
		color: var(--ink);
	}

	.add svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
	}

	.error {
		grid-column: 1 / -1;
		padding-bottom: var(--space-2);
		color: var(--ink);
		font-size: var(--text-sm);
	}
</style>
