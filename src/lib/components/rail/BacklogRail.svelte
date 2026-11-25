<!--
	Backlog access: the docked rail from 1280 px, the body of the "Manage" sheet below it (same content, same buttons) and Plan's backlog column.
	Grouped by aspect with the backlog count and the sprint progress, collapsible groups (remembered), a filter, "Add to sprint" per todo
	(optimistic with `onadd`; the todo travels out), drag on hover + fine pointer. Lifted from the signed hi-fi (hifi/sprint/Rail.svelte).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import { draggableTodo, dropZone } from '$lib/dnd';
	import { flipOpts, receive, send } from '$lib/motion';
	import { copy } from '$lib/copy';
	import type { Aspect, AspectProgress, Id, Todo } from '$lib/types';
	import Field from '../field/Field.svelte';
	import Icon from '../shell/Icon.svelte';
	import { dayLabel } from '../todo/format';
	import { submit, type ActionError } from '../todo/form';
	import Button from '../ui/Button.svelte';
	import EmptyState from '../ui/EmptyState.svelte';
	import './rail.css';

	let {
		backlog,
		aspects,
		progress = {},
		canAdd,
		addAction,
		addLabel = 'Add to sprint',
		onadd,
		onreturn
	}: {
		backlog: Todo[];
		aspects: Aspect[];
		progress?: Record<Id, AspectProgress>;
		canAdd: boolean;
		addAction: string;
		addLabel?: string;
		onadd?: (id: Id) => void;
		onreturn?: (id: Id) => void;
	} = $props();

	const STORAGE_KEY = 'lm:rail-collapsed';
	const uid = $props.id();

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
	class="hs-rail-body"
	role="group"
	aria-label="Backlog todos"
	use:dropZone={{
		accepts: (p) => !!onreturn && p.from === 'sprint' && !p.recurring,
		ondrop: (p) => onreturn?.(p.id)
	}}
>
	{#if backlog.length === 0}
		<EmptyState heading="h3" title="The backlog is empty" body={copy.sprintViews.railEmptyBody} href="/backlog" actionLabel="Open backlog" />
	{:else}
		<Field label="Filter backlog" type="search" placeholder="Filter backlog" bind:value={query} autocomplete="off" enterkeyhint="search" />
		{#if groups.length === 0}
			<EmptyState heading="h3" title="No backlog todo matches" body={copy.sprintViews.railNoMatchBody}>
				{#snippet action()}<Button variant="secondary" type="button" onclick={() => (query = '')}>{copy.sprintViews.clearFilter}</Button>{/snippet}
			</EmptyState>
		{/if}
		<div class="hs-bl-groups">
			{#each groups as { aspect, count, todos } (aspect.id)}
				{@const shut = collapsed.includes(aspect.id)}
				{@const sprint = progress[aspect.id]}
				<section aria-label="In backlog: {aspect.name}" style:--aspect={ASPECT_COLORS[aspect.color].fg}>
					<h3>
						<button type="button" class="hs-bl-toggle" aria-expanded={!shut} aria-controls="{uid}-g{aspect.id}" data-press onclick={() => toggle(aspect.id)}>
							<Icon name="chevron" size={16} />
							<span class="hs-aspect"><i class="hs-asp" aria-hidden="true"></i><span data-user title={aspect.name}>{aspect.name}</span></span>
							<span class="hs-bl-n" aria-label="{count} in backlog">{count}</span>
							{#if sprint}<span class="hs-bl-p"><span class="sr-only">Sprint progress </span>{sprint.done} / {sprint.total}</span>{/if}
						</button>
					</h3>
					<ul class="hs-bl-list" id="{uid}-g{aspect.id}" hidden={shut}>
						{#each todos as todo (todo.id)}
							<li
								class="hs-bl-row"
								aria-label={todo.title}
								in:receive={{ key: todo.id }}
								out:send={{ key: todo.id }}
								animate:flip={flipOpts()}
								use:draggableTodo={{ id: todo.id, from: 'backlog', recurring: todo.recurring }}
							>
								<span class="hs-bl-text">
									<span class="hs-bl-title" data-user title={todo.title}>{todo.title}</span>
									<span class="sr-only">Status: To do</span>
									<!-- Plain, as signed: the contract's backlog access flags no overdue todo (Today and the Backlog page do). -->
									{#if todo.dueDate}<span class="hs-bl-due">Due {dayLabel(todo.dueDate)}</span>{/if}
								</span>
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
										<Button class="hs-add" size="s" label="{addLabel}: {todo.title}"><Icon name="plus" size={16} />Add</Button>
									</form>
								{/if}
								{#if failure?.id === todo.id}
									<p class="hs-bl-error" role="alert">
										{#if failure.error === 'review-required'}
											The sprint needs its review first. <a class="hs-link" href="/sprint/review">Review</a>
										{:else}
											That didn’t work. Reload and try again.
										{/if}
									</p>
								{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
</div>
