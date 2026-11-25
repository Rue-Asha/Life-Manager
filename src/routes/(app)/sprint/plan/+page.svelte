<script lang="ts">
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { enhance } from '$app/forms';
	import BacklogRail from '$lib/components/rail/BacklogRail.svelte';
	import Icon from '$lib/components/shell/Icon.svelte';
	import { vfade } from '$lib/components/shell/cue';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import { weekLabel } from '$lib/components/todo/format';
	import { copy } from '$lib/copy';
	import { canDrag, draggableTodo, dropZone } from '$lib/dnd';
	import { flipOpts, receive, send } from '$lib/motion';
	import type { Id, Todo } from '$lib/types';

	let { data, form } = $props();

	const ERRORS: Record<string, string> = {
		'review-pending': 'The last sprint needs a review first.',
		'sprint-active': 'A sprint is already running.'
	};
	const errorText = $derived(form?.error ? (ERRORS[form.error] ?? copy.errors.startSprint) : null);

	// Suggestions are pulled when the sprint starts, unless unmarked by then.
	let unmarked = $state<Id[]>([]);
	const marked = $derived(data.suggested.filter((t) => !unmarked.includes(t.id)));
	const count = $derived(data.planned.length + marked.length);
	const figure = $derived(`${count} ${count === 1 ? 'todo' : 'todos'}`);
	const startLabel = $derived(count === 0 ? 'Start sprint' : `Start sprint with ${figure}`);
	const empty = $derived(data.planned.length === 0 && data.suggested.length === 0 && data.auto.length === 0);

	const byAspect = (todos: Todo[]) =>
		data.aspects
			.map((aspect) => ({ aspect, todos: todos.filter((t) => t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0);
	const aspectOf = (todo: Todo) => data.aspects.find((a) => a.id === todo.aspectId)!;

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

<form bind:this={dropForm} method="POST" action={drop.action} use:enhance hidden>
	<input type="hidden" name="id" value={drop.id} />
</form>

<div class="screen-head">
	<div class="screen-lead">
		<ul class="kicker"><li>Next sprint</li></ul>
		<h1>Plan your <em class="accent-word">week</em></h1>
		<p class="lede">{weekLabel(data.weekStart)}</p>
	</div>
	<ul class="screen-facts" data-surface="inverse" aria-label="Next sprint">
		<li class="facts-caption">Next sprint</li>
		<li><span class="n">{count}</span><span class="fact-name">in the sprint</span></li>
		{#if data.suggested.length > 0}
			<li><span class="n">{marked.length}/{data.suggested.length}</span><span class="fact-name">due this week</span></li>
		{/if}
		<li><span class="n">{data.auto.length}</span><span class="fact-name">join by themselves</span></li>
	</ul>
</div>

<!-- Due this week and Joins automatically mix aspects, so their rows name it ("Money · Due Thu 19"). -->
{#snippet bare(todo: Todo, mixed = false)}
	<ul class="bare"><TodoRow {todo} aspect={aspectOf(todo)} today={data.today} context="planning" {mixed} /></ul>
{/snippet}

<div class="screen-body hp-body" data-settle>
	<form id="start-form" class="card hp-start" method="POST" action="?/start" use:enhance aria-label="Start">
		<div class="hp-start-row">
			<p class="hp-figure">
				<strong>{figure} in this sprint</strong>
				<span>Recurring todos join on their days when the sprint starts.</span>
			</p>
			<Button variant="primary" arrow aria-describedby={errorText ? 'start-error' : undefined}>{startLabel}</Button>
		</div>
		{#if errorText}
			<p class="hp-alert" role="alert" id="start-error">
				<Icon name="alert" size={14} /><span>{errorText}{#if form?.error === 'review-pending'}{' '}<a class="hp-link" href="/sprint/review">Review the sprint</a>{/if}</span>
			</p>
		{/if}
	</form>

	<div class="hp-layout">
		<section
			class="card hp-draft"
			aria-labelledby="sprint-heading"
			use:dropZone={{ accepts: (p) => p.from === 'backlog', ondrop: (p) => move(p.id, '?/pull') }}
		>
			<h2 id="sprint-heading" class="hp-head">This sprint <span class="hp-count">{count}</span></h2>

			{#if empty}
				<p class="hp-drop">
					{canDrag.current ? 'Drag todos here from the backlog.' : 'Add todos from the backlog below.'}
				</p>
			{/if}

			{#if data.suggested.length > 0}
				<section class="hp-sub" aria-labelledby="suggestions-heading">
					<div class="hp-sub-head">
						<h3 id="suggestions-heading">Due this week</h3>
						<span class="hp-count">{marked.length} of {data.suggested.length}</span>
					</div>
					{#each data.suggested as todo (todo.id)}
						<div class="hp-row">
							<label class="tick">
								<input
									type="checkbox"
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
								<span aria-hidden="true">{#if !unmarked.includes(todo.id)}<Icon name="check" size={14} />{/if}</span>
							</label>
							{@render bare(todo, true)}
						</div>
					{/each}
				</section>
			{/if}

			{#if data.auto.length > 0}
				<section class="hp-sub" aria-labelledby="auto-heading">
					<div class="hp-sub-head">
						<h3 id="auto-heading">Joins automatically</h3>
						<span class="hp-count">{data.auto.length}</span>
					</div>
					<p class="hp-note">Already planned for a day this week. No button, no drag.</p>
					{#each data.auto as todo (todo.id)}
						<div class="hp-row">{@render bare(todo, true)}</div>
					{/each}
				</section>
			{/if}

			{#each byAspect(data.planned) as { aspect, todos } (aspect.id)}
				<section class="hp-sub" aria-labelledby="sprint-{aspect.id}">
					<div class="hp-sub-head">
						<span class="hp-aspect">
							<i class="dot" style:--aspect="var(--aspect-{aspect.color})" aria-hidden="true"></i>
							<h3 id="sprint-{aspect.id}" class="own" data-user>{aspect.name}</h3>
						</span>
						<span class="hp-count">{todos.length}</span>
					</div>
					{#each todos as todo (todo.id)}
						<div
							class="hp-row"
							role="presentation"
							in:receive={{ key: todo.id }}
							out:send={{ key: todo.id }}
							animate:flip={flipOpts()}
							use:draggableTodo={{ id: todo.id, from: 'sprint', recurring: todo.recurring }}
						>
							{@render bare(todo)}
							<form method="POST" action="?/unpull" use:enhance>
								<input type="hidden" name="id" value={todo.id} />
								<Button size="s" label="Remove from sprint: {todo.title}">Remove</Button>
							</form>
						</div>
					{/each}
				</section>
			{/each}
		</section>

		<section class="card hp-backlog" aria-labelledby="backlog-heading">
			<div class="hp-scroll" use:vfade>
				<h2 id="backlog-heading" class="hp-head">Backlog <span class="hp-count">{data.backlog.length}</span></h2>
				{#if data.backlog.length === 0}
					<div class="hp-empty" use:dropZone={{ accepts: (p) => p.from === 'sprint' && !p.recurring, ondrop: (p) => move(p.id, '?/unpull') }}>
						<EmptyState heading="h3" title={copy.empty.backlogRail.heading} href="/backlog" actionLabel={copy.openBacklog} />
					</div>
				{:else}
					<BacklogRail
						backlog={data.backlog}
						aspects={data.aspects}
						canAdd
						addAction="?/pull"
						onreturn={(id) => move(id, '?/unpull')}
					/>
				{/if}
			</div>
			<p class="more-below" aria-hidden="true"><Icon name="chevron" size={14} />More below</p>
		</section>
	</div>
</div>

<style>
	/* "Join by themselves" is the longest fact label: a little more than --facts-max keeps it on one line */
	:global(.screen-head > .screen-facts) {
		max-inline-size: calc(var(--facts-max) + var(--space-6));
	}
	.hp-start {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-4);
	}
	.hp-start-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3) var(--space-4);
	}
	.hp-figure {
		display: grid;
		flex: 1 1 16rem;
		gap: var(--space-0-5);
		margin: 0;
		min-inline-size: 0;
	}
	.hp-figure strong {
		font-family: var(--font-display);
		font-weight: var(--weight-display);
		font-size: var(--type-display-s-size);
		line-height: var(--type-display-s-line);
		letter-spacing: var(--type-display-s-tracking);
		font-variant-numeric: var(--numeric-figures);
	}
	.hp-figure span {
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
		color: var(--ink-secondary);
	}
	.hp-alert {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		margin: 0;
		padding: var(--space-1-5) var(--space-3);
		border-radius: var(--radius-item);
		background: var(--danger-soft);
		box-shadow: var(--ring-danger);
		color: var(--danger);
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
		font-weight: var(--weight-semibold);
	}
	.hp-alert > :global(svg) {
		flex: none;
		margin-block-start: var(--space-0-5);
	}
	.hp-link {
		display: inline-flex;
		align-items: center;
		min-block-size: var(--target);
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 0.25em;
	}

	.hp-layout {
		display: grid;
		gap: var(--space-4);
		align-items: start;
		min-inline-size: 0;
	}
	@media (min-width: 1280px) {
		.hp-layout {
			grid-template-columns: minmax(0, 1fr) 20rem;
		}
		.hp-backlog {
			position: sticky;
			inset-block-start: calc(var(--bar-h) + var(--space-4));
		}
		/* the backlog scrolls inside its card: the cut edge fades and a thin scrollbar stays visible, so a half row never reads as the end */
		.hp-scroll {
			max-block-size: calc(100dvh - var(--bar-h) - var(--space-16));
			overflow-y: auto;
			overscroll-behavior: contain;
			scrollbar-width: thin;
			scrollbar-color: var(--edge-control) transparent;
			padding-inline-end: var(--space-1);
		}
	}
	.hp-draft,
	.hp-backlog {
		display: grid;
		gap: var(--space-4);
		align-content: start;
		padding: var(--space-4);
		min-inline-size: 0;
	}
	.hp-draft:global([data-over]),
	.hp-empty:global([data-over]) {
		outline: var(--stroke-strong) solid var(--ink);
		outline-offset: calc(-1 * var(--space-0-5));
		background-color: var(--accent-soft);
	}
	.hp-scroll {
		display: grid;
		gap: var(--space-3);
		align-content: start;
		min-inline-size: 0;
	}
	.hp-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
		font-family: var(--font-ui);
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
		font-weight: var(--type-title-weight);
	}
	.hp-count {
		flex: none;
		font-size: var(--type-caption-size);
		font-weight: var(--weight-semibold);
		font-variant-numeric: var(--numeric-figures);
		color: var(--ink-secondary);
	}
	.hp-sub {
		display: grid;
		gap: var(--space-1-5);
		min-inline-size: 0;
	}
	.hp-sub-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		min-inline-size: 0;
	}
	.hp-sub-head h3 {
		margin: 0;
		font-size: var(--type-overline-size);
		line-height: var(--type-overline-line);
		letter-spacing: var(--type-overline-tracking);
		font-weight: var(--type-overline-weight);
		text-transform: uppercase;
		color: var(--ink-secondary);
		overflow-wrap: anywhere;
	}
	.hp-sub-head h3.own {
		color: var(--ink);
	}
	.hp-aspect {
		display: inline-flex;
		flex: 1;
		align-items: center;
		gap: var(--space-1-5);
		min-inline-size: 0;
	}
	.dot {
		flex: none;
		inline-size: var(--space-2);
		block-size: var(--space-2);
		border-radius: var(--radius-round);
		background: var(--aspect);
	}
	.hp-note {
		margin: 0;
		font-size: var(--type-caption-size);
		line-height: var(--type-caption-line);
		color: var(--ink-secondary);
	}
	.hp-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-inline-size: 0;
		min-block-size: var(--space-12);
		padding: var(--space-0-5) var(--space-2) var(--space-0-5) var(--space-1);
		border-radius: var(--radius-panel);
		background: var(--surface-sunken);
	}
	.hp-row > .bare {
		flex: 1;
		min-inline-size: 0;
	}
	/* Plan titles as signed: body size, medium, lighter than a list title. */
	.hp-row :global(.title) {
		font-size: var(--type-body-size);
		line-height: var(--type-body-line);
		font-weight: var(--weight-medium);
	}
	.hp-row form {
		display: contents;
	}
	.bare {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	@media (hover: hover) and (pointer: fine) {
		.hp-row:global([draggable='true']) {
			cursor: grab;
		}
	}
	.hp-row:global([data-dragging]) {
		background: none;
		outline: var(--stroke-rule) dashed var(--edge-control);
		outline-offset: calc(-1 * var(--stroke-rule));
	}
	.hp-row:global([data-dragging]) > :global(*) {
		opacity: 0;
	}

	.tick {
		position: relative;
		display: grid;
		place-items: center;
		flex: none;
		inline-size: max(var(--control-height), var(--target));
		block-size: max(var(--control-height), var(--target));
		cursor: pointer;
	}
	.tick input {
		position: absolute;
		inset: 0;
		inline-size: 100%;
		block-size: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	.tick > span {
		display: grid;
		place-items: center;
		inline-size: var(--space-6);
		block-size: var(--space-6);
		border-radius: var(--radius-round);
		box-shadow: var(--ring-control);
		background: var(--surface-raised);
		color: var(--ink);
	}
	.tick:has(input:checked) > span {
		background: var(--surface-inverse);
		box-shadow: none;
		color: var(--ink-on-inverse);
	}
	.tick:has(input:focus-visible) > span {
		outline: var(--focus-width) solid var(--focus-ring);
		outline-offset: var(--space-0-5);
	}

	.hp-drop {
		display: grid;
		place-items: center;
		min-block-size: var(--space-16);
		margin: 0;
		padding: var(--space-4);
		border-radius: var(--radius-panel);
		outline: var(--stroke-rule) dashed var(--edge-control);
		outline-offset: calc(-1 * var(--stroke-rule));
		color: var(--ink-secondary);
		font-size: var(--type-body-s-size);
		text-align: center;
	}
	.hp-empty {
		border-radius: var(--radius-panel);
	}

	.more-below {
		display: none;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		margin: 0;
		font-size: var(--type-caption-size);
		line-height: var(--type-caption-line);
		font-weight: var(--weight-semibold);
		color: var(--ink-secondary);
	}
	.hp-scroll:global([data-fade-bottom]) + .more-below {
		display: flex;
	}
</style>
