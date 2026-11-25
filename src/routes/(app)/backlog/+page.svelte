<script lang="ts">
	import { untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import { enhance } from '$app/forms';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import { copy } from '$lib/copy';
	import { formatCount } from '$lib/nav';
	import { fadeOut, flipOpts, settle } from '$lib/motion';
	import { openQuickAdd, setQuickAddContext } from '$lib/shell/quick-add.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Field from '$lib/components/field/Field.svelte';
	import Icon from '$lib/components/shell/Icon.svelte';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import { planError, submit, type ActionError } from '$lib/components/todo/form';
	import type { Aspect, Id, Todo } from '$lib/types';

	let { data } = $props();

	const planned = $derived(
		data.todos
			.filter((t) => t.day !== null)
			.sort(
				(a, b) =>
					a.day!.localeCompare(b.day!) ||
					Number(a.startTime !== null) - Number(b.startTime !== null) ||
					(a.startTime ?? '').localeCompare(b.startTime ?? '') ||
					a.title.localeCompare(b.title)
			)
	);
	const groups = $derived(
		data.aspects
			.map((aspect) => ({ aspect, todos: data.todos.filter((t) => t.day === null && t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0)
	);
	const selected = $derived(data.aspects.find((a) => a.id === data.aspectId));
	const aspectOf = (id: Id) => data.aspects.find((a) => a.id === id)!;
	const chipCount = (id: Id) => formatCount(data.nav.aspects.find((a) => a.id === id)?.backlog ?? 0);

	$effect(() => {
		const aspectId = data.aspectId;
		return untrack(() => setQuickAddContext(aspectId === null ? {} : { aspectId }));
	});

	// The browser leaves a half-visible chip where it is, with its ring cut off by the strip: bring a focused chip fully in.
	function keepInView(e: FocusEvent) {
		(e.target as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest' });
	}

	let closed = $state<string[]>([]);
	const isOpen = (key: string) => !closed.includes(key);
	const toggle = (key: string) => (closed = isOpen(key) ? [...closed, key] : closed.filter((k) => k !== key));

	// Inline quick add: a title, the filtered aspect else the first, the destination under it. Anything else goes through the global "New todo".
	let title = $state('');
	let addError = $state<string | null>(null);
	const addAspectId = $derived(selected?.id ?? data.aspects[0].id);
	function addFailed(e: ActionError) {
		addError = e.error === 'required' ? copy.quickAdd.missingTitle : (planError(e) ?? copy.errors.addTodo);
	}
</script>

<svelte:head>
	<title>Backlog · Life Manager</title>
</svelte:head>

{#snippet group(id: string, name: string, count: number, color: string | undefined, rows: Todo[], isPlanned: boolean)}
	<section class="card group" aria-labelledby="{id}-h" style:--aspect={color ? ASPECT_COLORS[color as keyof typeof ASPECT_COLORS].fg : undefined}>
		<h2 class="gh" id="{id}-h">
			{#if isPlanned}
				<span class="toggle">
					<span class="name">{name}</span>
					<span class="count num">{count}</span>
				</span>
			{:else}
				<button type="button" class="toggle" aria-expanded={isOpen(id)} aria-controls="{id}-l" onclick={() => toggle(id)}>
					<span class="chev" aria-hidden="true"><Icon name="chevron" size={16} /></span>
					{#if color}<span class="dot" aria-hidden="true"></span>{/if}
					<span class="name" title={name} data-user>{name}</span>
					<span class="count num">{count}</span>
				</button>
			{/if}
		</h2>
		<div class="collapse" id="{id}-l" data-open={isPlanned || isOpen(id)} inert={!isPlanned && !isOpen(id)}>
			<div class="clip">
				<div class="list" role="list">
					{#each rows as todo (todo.id)}
						<div class="trow" role="none" in:settle out:fadeOut animate:flip={flipOpts()}>
							<TodoRow {todo} aspect={aspectOf(todo.aspectId)} today={data.today} context="backlog" sprintDays={data.sprintDays ?? undefined} mixed={isPlanned} planMenu />
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>
{/snippet}

<div class="screen-head">
	<div class="screen-lead">
		<ul class="kicker"><li>{copy.backlog.kicker}</li></ul>
		<h1><em class="accent-word">{copy.backlog.title}</em></h1>
	</div>
	<ul class="screen-facts" data-surface="inverse" aria-label={copy.backlog.factsLabel}>
		<li class="facts-caption">{copy.backlog.factsLabel}</li>
		<li><span class="n">{data.facts.open.toLocaleString('en-GB')}</span><span class="fact-name">{copy.backlog.openTodos(data.facts.open)}</span></li>
		<li><span class="n">{data.facts.planned.toLocaleString('en-GB')}</span><span class="fact-name">{copy.backlog.planned}</span></li>
		<li><span class="n">{data.facts.overdue.toLocaleString('en-GB')}</span><span class="fact-name">{copy.backlog.overdue}</span></li>
	</ul>
</div>

<div class="screen-body" data-settle>
	<div class="main">
		{#if data.aspects.length > 1}
			<nav aria-label={copy.backlog.filterLabel}>
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<ul class="filter" aria-label={copy.backlog.filterLabel} onfocusin={keepInView}>
					<li><a class="chip" href="/backlog" aria-current={data.aspectId === null ? 'true' : undefined}>{copy.backlog.all}</a></li>
					{#each data.aspects as aspect (aspect.id)}
						<li>
							<a class="chip" href="/backlog?aspect={aspect.id}" title={aspect.name} aria-current={data.aspectId === aspect.id ? 'true' : undefined} style:--aspect={ASPECT_COLORS[aspect.color].fg}>
								<span class="dot" aria-hidden="true"></span>
								<span class="chip-name" data-user>{aspect.name}</span>
								{#if chipCount(aspect.id)}<span class="count num">{chipCount(aspect.id)}</span>{/if}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		{/if}

		{#if data.phase === 'review-required'}
			<div class="card prompt" role="status">
				<p>{copy.backlog.reviewNote}</p>
				<Button variant="primary" arrow href="/sprint/review">{copy.backlog.reviewLink}</Button>
			</div>
		{/if}

		<form
			class="card add"
			method="POST"
			action="/todos?/create"
			aria-label={copy.backlog.addTodo}
			use:enhance={submit({ onerror: addFailed, onsuccess: () => ((title = ''), (addError = null)) })}
		>
			<input type="hidden" name="aspectId" value={addAspectId} />
			<input type="hidden" name="priority" value="0" />
			<input type="hidden" name="target" value="backlog" />
			<div class="add-line">
				<div class="add-field">
					<Field label="Title" hideLabel id="backlog-title" name="title" placeholder={copy.backlog.addTodo} autocomplete="off" enterkeyhint="done" error={addError ?? undefined} bind:value={title} />
				</div>
				<Button variant={data.phase === 'review-required' ? 'secondary' : 'primary'} type="submit">
					<Icon name="plus" size={18} />Add
				</Button>
			</div>
			<p class="dest">{selected ? copy.backlog.toBacklogAspect(selected.name) : copy.backlog.toBacklog}</p>
		</form>

		{#if data.todos.length === 0}
			<div class="empty-wide">
				{#if selected}
					{@const e = copy.empty.backlogFiltered(selected.name)}
					<EmptyState title={e.heading} body={e.body}>
						{#snippet action()}<Button variant="secondary" type="button" onclick={(ev) => openQuickAdd(ev.currentTarget)}><Icon name="plus" size={18} />{copy.backlog.addTodo}</Button>{/snippet}
					</EmptyState>
				{:else}
					<EmptyState title={copy.empty.backlog.heading} body={copy.empty.backlog.body}>
						{#snippet action()}<Button variant="secondary" type="button" onclick={(ev) => openQuickAdd(ev.currentTarget)}><Icon name="plus" size={18} />{copy.backlog.addTodo}</Button>{/snippet}
					</EmptyState>
				{/if}
			</div>
		{:else}
			{#if planned.length > 0}
				{@render group('planned', copy.backlog.plannedGroup, planned.length, undefined, planned, true)}
			{/if}
			{#each groups as { aspect, todos } (aspect.id)}
				{@render group(`g${aspect.id}`, aspect.name, todos.length, aspect.color, todos, false)}
			{/each}
		{/if}
	</div>
</div>

<style>
	.main {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-4);
		min-inline-size: 0;
	}

	/* ---------- Aspect filter ---------- */
	.filter {
		display: flex;
		gap: var(--space-2);
		/* The scroller clips the focus ring, so it carries the ring's room (width plus offset) as padding and takes it back as margin. */
		margin: calc(var(--space-1) - var(--space-1-5)) calc(-1 * var(--space-1-5));
		padding: var(--space-1-5);
		scroll-padding-inline: var(--space-1-5);
		list-style: none;
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scrollbar-width: none;
		min-inline-size: 0;
	}
	.filter::-webkit-scrollbar {
		display: none;
	}
	.filter > li {
		display: flex;
		flex: none;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		min-block-size: max(var(--control-height-s), var(--target-touch));
		min-inline-size: var(--target-touch);
		max-inline-size: 14rem;
		padding-inline: var(--space-4);
		border-radius: var(--radius-pill);
		background: var(--surface-glass-strong);
		box-shadow: var(--shadow-rim);
		color: var(--ink);
		font-size: var(--type-label-size);
		line-height: var(--type-label-line);
		font-weight: var(--type-label-weight);
		text-decoration: none;
		white-space: nowrap;
		touch-action: manipulation;
	}
	.chip > .dot {
		inline-size: var(--space-2);
		block-size: var(--space-2);
	}
	.chip-name {
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.chip[aria-current] {
		background: var(--surface-inverse);
		box-shadow: none;
		color: var(--ink-on-inverse);
	}
	.chip[aria-current] .count {
		color: var(--ink-on-inverse-secondary);
	}
	@media (hover: hover) and (pointer: fine) {
		.chip:not([aria-current]):hover {
			background: var(--surface-raised);
		}
	}
	/* A chip strip that scrolls sideways fades out at the edge it continues past; the end padding lets the last chip clear the fade. */
	@media (max-width: 1279px) {
		.filter {
			padding-inline-end: var(--space-10);
			-webkit-mask-image: linear-gradient(90deg, var(--ink) calc(100% - var(--space-12)), transparent);
			mask-image: linear-gradient(90deg, var(--ink) calc(100% - var(--space-12)), transparent);
		}
	}
	@media (min-width: 1280px) {
		.filter {
			flex-wrap: wrap;
			overflow-x: visible;
		}
	}

	/* ---------- Review note ---------- */
	.prompt {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3) var(--space-4);
		padding: var(--space-4) var(--space-4) var(--space-4) var(--space-5);
		min-inline-size: 0;
	}
	.prompt > p {
		flex: 1 1 14rem;
		min-inline-size: 0;
		margin: 0;
		font-size: var(--type-body-size);
		line-height: var(--type-body-line);
		overflow-wrap: anywhere;
	}

	/* ---------- The page's own quick add ---------- */
	.add {
		display: grid;
		gap: var(--space-2);
		padding: var(--space-4);
		min-inline-size: 0;
	}
	.add-line {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
	}
	.add-field {
		flex: 1;
		min-inline-size: 0;
	}
	.add-line > :global(.btn) {
		flex: none;
	}
	.dest {
		margin: 0;
		padding-inline: var(--space-1);
		font-size: var(--type-caption-size);
		line-height: var(--type-caption-line);
		color: var(--ink-secondary);
	}

	.empty-wide :global(.empty .btn.secondary:not(:disabled)) {
		box-shadow: var(--ring-control);
	}

	/* ---------- Groups ---------- */
	.group {
		display: grid;
		padding: var(--space-2);
		min-inline-size: 0;
	}
	.gh {
		margin: 0;
		font-family: var(--font-ui);
		font-size: inherit;
		line-height: inherit;
		font-weight: inherit;
	}
	.toggle {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		inline-size: 100%;
		min-block-size: var(--target-touch);
		padding: 0 var(--space-3);
		border: 0;
		border-radius: var(--radius-item);
		background: none;
		color: inherit;
		font: inherit;
		text-align: start;
	}
	button.toggle {
		cursor: pointer;
		touch-action: manipulation;
	}
	@media (hover: hover) and (pointer: fine) {
		button.toggle:hover {
			background: var(--surface-sunken);
		}
	}
	.chev {
		display: grid;
		place-items: center;
		flex: none;
		transition: transform var(--motion-quick) var(--ease-out);
	}
	.toggle[aria-expanded='false'] .chev {
		transform: rotate(-90deg);
	}
	.name {
		flex: 0 1 auto;
		min-inline-size: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		overflow-wrap: anywhere;
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
		font-weight: var(--weight-semibold);
	}
	.count {
		flex: none;
		font-size: var(--type-body-s-size);
		color: var(--ink-secondary);
		font-variant-numeric: var(--numeric-figures);
	}
	.dot {
		flex: none;
		inline-size: var(--space-2-5);
		block-size: var(--space-2-5);
		border-radius: var(--radius-round);
		background: var(--aspect);
	}

	/* Collapse: the rows glide, the content fades; reduced motion keeps the fade only. */
	.collapse {
		display: grid;
		grid-template-rows: 1fr;
		transition:
			grid-template-rows var(--motion-glide) var(--ease-out),
			opacity var(--motion-quick) var(--ease-out);
	}
	.collapse[data-open='false'] {
		grid-template-rows: 0fr;
		opacity: 0;
		visibility: hidden;
		transition:
			grid-template-rows var(--motion-glide) var(--ease-out),
			opacity var(--motion-quick) var(--ease-out),
			visibility var(--motion-glide) var(--ease-out);
	}
	.clip {
		min-block-size: 0;
		overflow: hidden;
	}
	/* The row menu and its panel hang below the clip's edge while the group is open. */
	.collapse[data-open='true'] .clip {
		overflow: visible;
	}
	.list {
		display: grid;
		margin: 0;
		padding: 0;
	}
	.trow + .trow {
		position: relative;
	}
	/* As signed: hairlines run the card's width less its 8 px padding, and a row's title sits 12 px in from the card. */
	.trow + .trow::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		border-top: var(--stroke-hairline) solid var(--hairline);
		pointer-events: none;
	}
	.trow > :global(.row.bare) {
		padding-inline-start: var(--space-1);
	}
	@media (prefers-reduced-motion: reduce) {
		.collapse {
			transition: opacity var(--motion-quick) var(--ease-out);
		}
		.collapse[data-open='false'] {
			transition:
				opacity var(--motion-quick) var(--ease-out),
				visibility var(--motion-quick) var(--ease-out);
		}
		.chev {
			transition: none;
		}
	}
</style>
