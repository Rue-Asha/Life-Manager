<script lang="ts">
	import { flip } from 'svelte/animate';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import { copy } from '$lib/copy';
	import { syncNeedsAttention } from '$lib/nav';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Field from '$lib/components/field/Field.svelte';
	import Icon from '$lib/components/shell/Icon.svelte';
	import SprintPrompt from '$lib/components/todo/SprintPrompt.svelte';
	import SummaryHeader from '$lib/components/ui/SummaryHeader.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import { planError, submit, type ActionError } from '$lib/components/todo/form';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import { fadeOut, flipOpts, settle } from '$lib/motion';
	import type { Id } from '$lib/types';

	let { data } = $props();

	const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
	const weekdayName = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' });
	const OVERDUE_SHOWN = 5;

	// Review-required means the sprint's week is over, so today is no longer one of its days.
	const inSprint = $derived(data.phase === 'running' || data.phase === 'review-available');
	// On Sunday next week's sprint can already be running, and today is not one of its days.
	const onSprintDay = $derived(data.sprintDays.includes(data.today));
	const aspectOf = (id: Id) => data.aspects.find((a) => a.id === id)!;
	const groups = $derived(
		data.aspects
			.map((aspect) => ({ aspect, todos: [...data.todos, ...data.dueToday].filter((t) => t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0)
	);
	const sprintAspects = $derived(data.aspects.filter((a) => data.progress[a.id]));
	const allTodos = $derived([...data.todos, ...data.overdue, ...data.dueToday]);

	// The summary header counts what is still open on this page, and the sprint as a whole.
	const openToday = $derived(new Set(allTodos.filter((t) => t.status !== 'done').map((t) => t.id)).size);
	const sprintDone = $derived(sprintAspects.reduce((n, a) => n + data.progress[a.id].done, 0));
	const sprintTotal = $derived(sprintAspects.reduce((n, a) => n + data.progress[a.id].total, 0));
	const daysLeft = $derived(data.sprintDays.filter((d) => d > data.today).length);
	const showProgress = $derived(inSprint || (data.phase === 'review-required' && sprintTotal > 0));
	const weekday = $derived(weekdayName.format(new Date(`${data.today}T00:00:00Z`)));
	const prompted = $derived(data.phase !== 'running');

	// A list that mixes ticked rows and rows to add to the sprint keeps the titles on one line.
	const inActive = (sprintId: Id | null) => data.activeSprintId !== null && sprintId === data.activeSprintId;
	const overdueMixed = $derived(data.overdue.some((t) => inActive(t.sprintId)));

	let allOverdue = $state(false);
	const overdueShown = $derived(allOverdue ? data.overdue : data.overdue.slice(0, OVERDUE_SHOWN));

	const banner = $derived(syncNeedsAttention(data.nav) ? copy.syncBanner[data.nav.sync as 'relogin' | 'error'] : null);

	// Inline quick add: a title, the first aspect, the destination under it. Anything else goes through the global "New todo".
	let title = $state('');
	let addError = $state<string | null>(null);
	const destination = $derived(onSprintDay ? copy.today.toSprint : copy.today.toBacklog);

	function addFailed(e: ActionError) {
		addError = e.error === 'required' ? copy.quickAdd.missingTitle : (planError(e) ?? copy.errors.addTodo);
	}
	function added() {
		title = '';
		addError = null;
		if (matchMedia('(pointer: fine)').matches) document.getElementById('today-title')?.focus();
	}

	// Ticking posts at once; the toast follows the saved state, so it never offers an undo for a tick that did not land.
	let ticked = $state<{ id: Id; title: string } | null>(null);
	const toasted = $derived(ticked !== null && allTodos.some((t) => t.id === ticked!.id && t.status === 'done'));

	function onsubmit(e: SubmitEvent) {
		const form = e.target as HTMLFormElement;
		if (!form.action.includes('toggleDone')) return;
		const id = Number(new FormData(form).get('id'));
		const todo = allTodos.find((t) => t.id === id);
		ticked = todo && todo.status !== 'done' ? { id, title: todo.title } : null;
	}

	async function undo() {
		const body = new FormData();
		body.set('id', String(ticked!.id));
		ticked = null;
		await fetch('/todos?/toggleDone', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' }, keepalive: true });
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Today · Life Manager</title>
</svelte:head>

<svelte:window {onsubmit} />

{#snippet sprintLine()}
	{#if data.phase === 'review-required'}
		{copy.today.lastSprint} {sprintDone} / {sprintTotal} done
	{:else if daysLeft === 0}
		Sprint {sprintDone} / {sprintTotal} done · {copy.today.endsToday}
	{:else}
		Sprint {sprintDone} / {sprintTotal} done · {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
	{/if}
{/snippet}

{#snippet promptCard()}
	<SprintPrompt phase={data.phase} />
{/snippet}

<div class="screen-head">
	<div class="screen-lead">
		<ul class="kicker"><li>{longDate.format(new Date(`${data.today}T00:00:00Z`))}</li></ul>
		<h1><em class="accent-word">Today</em></h1>
	</div>
</div>

<div class="screen-body" data-settle>
	<div class="split" data-side={inSprint ? '' : undefined}>
		<div class="main">
			{#if banner}
				<section class="banner" data-surface="solid" aria-label={copy.syncBanner.region}>
					<span class="mark"><Icon name="alert" size={20} /></span>
					<p>{banner}</p>
					<Button variant="secondary" size="s" href="/sync">{copy.syncBanner.open}</Button>
				</section>
			{/if}

			{#if data.phase === 'review-required'}{@render promptCard()}{/if}

			<SummaryHeader
				figure={String(openToday)}
				label="open today"
				context="{weekday}{inSprint ? ' · this sprint' : ''}"
				line={showProgress ? sprintLine : undefined}
				barLabel={data.phase === 'review-required' ? 'Last sprint progress' : 'Sprint progress'}
				segments={showProgress
					? sprintAspects.map((a) => ({ color: a.color, name: a.name, total: data.progress[a.id].total, done: data.progress[a.id].done }))
					: []}
			/>

			{#if prompted && data.phase !== 'review-required'}{@render promptCard()}{/if}

			<form
				class="card add"
				method="POST"
				action="/todos?/create"
				aria-label={copy.today.addTitle}
				use:enhance={submit({ onerror: addFailed, onsuccess: added })}
			>
				<input type="hidden" name="aspectId" value={data.aspects[0].id} />
				<input type="hidden" name="priority" value="0" />
				<input type="hidden" name="target" value={onSprintDay ? 'day' : 'backlog'} />
				{#if onSprintDay}
					<input type="hidden" name="day" value={data.today} />
				{:else}
					<input type="hidden" name="dueDate" value={data.today} />
				{/if}
				<div class="add-line">
					<div class="add-field">
						<Field
							label="Title"
							hideLabel
							id="today-title"
							name="title"
							placeholder={copy.today.addTitle}
							autocomplete="off"
							enterkeyhint="done"
							error={addError ?? undefined}
							bind:value={title}
						/>
					</div>
					<Button variant={prompted ? 'secondary' : 'primary'} type="submit">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>Add
					</Button>
				</div>
				<p class="dest">{destination}</p>
			</form>

			{#if inSprint && groups.length === 0 && data.overdue.length === 0}
				<div class="empty-wide">
					<EmptyState title={copy.empty.today.heading} body={copy.empty.today.body} href="/sprint?view=week" actionLabel={copy.today.weekView} />
				</div>
			{/if}

			{#if data.overdue.length}
				<section class="card group" aria-labelledby="group-overdue">
					<h2 class="gh" id="group-overdue">
						<span class="toggle"><span class="name">Overdue</span><span class="count num late">{data.overdue.length}</span></span>
					</h2>
					<div class="list" role="list" class:unfolded={allOverdue}>
						{#each overdueShown as todo (todo.id)}
							<!-- Done belongs to the running sprint, so backlog and draft todos are offered the sprint instead of a checkbox. -->
							<div class="trow" role="none" in:settle out:fadeOut animate:flip={flipOpts()}>
							{#if inActive(todo.sprintId)}
								<TodoRow {todo} aspect={aspectOf(todo.aspectId)} today={data.today} context="today" mixed indent />
							{:else}
								<TodoRow
									{todo}
									aspect={aspectOf(todo.aspectId)}
									today={data.today}
									context="backlog"
									sprintDays={todo.sprintId === null && inSprint ? data.sprintDays : undefined}
									mixed
									tag={copy.today.fromBacklog}
									indent={overdueMixed}
								/>
							{/if}
							</div>
						{/each}
						{#if data.overdue.length > OVERDUE_SHOWN}
							<div class="more" role="listitem">
								<Button size="s" type="button" aria-expanded={allOverdue} onclick={() => (allOverdue = !allOverdue)}>
									{allOverdue ? copy.today.showFewer : copy.today.showAll(data.overdue.length)}
									<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={UI_ICONS['chevron-down']} /></svg>
								</Button>
							</div>
						{/if}
					</div>
				</section>
			{/if}

			{#each groups as { aspect, todos } (aspect.id)}
				<section
					class="card group"
					aria-labelledby="group-{aspect.id}"
					style:--aspect={ASPECT_COLORS[aspect.color].fg}
					in:settle
					out:fadeOut
					animate:flip={flipOpts()}
				>
					<h2 class="gh" id="group-{aspect.id}">
						<span class="toggle">
							<span class="dot" aria-hidden="true"></span>
							<a class="name" href="/aspects/{aspect.id}" title={aspect.name}>{aspect.name}</a>
							<span class="count num">{todos.length}</span>
						</span>
					</h2>
					<div class="list" role="list">
						{#each todos as todo (todo.id)}
							<div class="trow" role="none" in:settle out:fadeOut animate:flip={flipOpts()}>
							{#if todo.sprintId === null}
								<TodoRow {todo} {aspect} today={data.today} context="backlog" sprintDays={inSprint ? data.sprintDays : undefined} tag={copy.today.fromBacklog} indent={todos.some((t) => t.sprintId !== null)} />
							{:else}
								<TodoRow {todo} {aspect} today={data.today} context="today" />
							{/if}
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>

		{#if inSprint}
			<aside class="side" aria-label="This sprint">
				<div class="card side-card">
					<div class="card-head"><h2>This sprint</h2><p class="card-note">{sprintDone} / {sprintTotal}</p></div>
					{#if sprintAspects.length}
						<ul class="plist">
							{#each sprintAspects as aspect (aspect.id)}
								<li>
									<a class="prow" href="/aspects/{aspect.id}" title={aspect.name} style:--aspect={ASPECT_COLORS[aspect.color].fg}>
										<span class="tile" aria-hidden="true"><Icon aspect={aspect.icon} size={14} /></span>
										<span class="pname" data-user>{aspect.name}</span>
										<span class="pvalue">{data.progress[aspect.id].done} / {data.progress[aspect.id].total}</span>
									</a>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="msg">Nothing in this sprint yet.</p>
					{/if}
				</div>
			</aside>
		{/if}
	</div>
</div>

{#if ticked && toasted}
	{#key ticked.id}
		<Toast message={copy.toast.done(ticked.title)} actionLabel={copy.toast.undo} onaction={undo} ontimeout={() => (ticked = null)} />
	{/key}
{/if}

<style>
	/* ---------- Main column plus the sprint context ---------- */
	.split {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-4);
		align-items: start;
		min-inline-size: 0;
	}
	.main {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-4);
		min-inline-size: 0;
	}
	.side {
		min-inline-size: 0;
	}
	@media (min-width: 1280px) {
		.split[data-side] {
			grid-template-columns: minmax(0, 1fr) 22rem;
		}
		.side {
			position: sticky;
			inset-block-start: var(--space-4);
		}
	}

	/* ---------- Sync attention banner ---------- */
	.banner {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
		border-radius: var(--radius-panel);
		background: var(--surface-raised);
		box-shadow: var(--ring-danger);
		color: var(--ink);
	}
	.banner > .mark {
		display: grid;
		color: var(--danger);
	}
	.banner > p {
		flex: 1;
		min-inline-size: 0;
		margin: 0;
		font-size: var(--type-body-s-size);
		overflow-wrap: anywhere;
	}
	@media (max-width: 479px) {
		.banner {
			flex-wrap: wrap;
		}
		.banner > p {
			flex-basis: calc(100% - var(--space-10));
		}
	}

	/* ---------- A page's own quick add ---------- */
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

	/* The empty card is as wide as the columns it sits in. */
	.empty-wide :global(.empty) {
		max-inline-size: none;
	}
	/* The empty card is white, so its secondary pill takes the 3:1 control edge, as signed. */
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
		min-block-size: var(--target-touch);
		padding: 0 var(--space-3);
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
		color: inherit;
		text-decoration: none;
	}
	a.name {
		align-content: center;
		min-block-size: var(--target-touch);
		min-inline-size: var(--target-touch);
	}
	@media (hover: hover) and (pointer: fine) {
		a.name:hover {
			text-decoration: underline;
			text-underline-offset: 0.2em;
		}
	}
	.count {
		flex: none;
		font-size: var(--type-body-s-size);
		color: var(--ink-secondary);
		font-variant-numeric: var(--numeric-figures);
	}
	.count.late {
		color: var(--danger);
		font-weight: var(--weight-semibold);
	}
	.dot {
		flex: none;
		inline-size: var(--space-2-5);
		block-size: var(--space-2-5);
		border-radius: var(--radius-round);
		background: var(--aspect);
	}
	.list {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	/* A hairline above every row but the first; a row is a component's own li, in a box FLIP can move. */
	.trow + .trow {
		position: relative;
	}
	.trow + .trow::before {
		content: '';
		position: absolute;
		top: 0;
		right: var(--space-3);
		left: var(--space-3);
		border-top: var(--stroke-hairline) solid var(--hairline);
		pointer-events: none;
	}
	/* The rows "Show all" brings in ease up and in; hiding them again is instant (fast where the system answers). */
	.unfolded > .trow:nth-child(n + 6) {
		animation: unfold var(--motion-quick) var(--ease-out) backwards;
	}
	@keyframes unfold {
		from {
			opacity: 0;
			transform: translateY(var(--space-1));
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.unfolded > .trow:nth-child(n + 6) {
			animation-name: unfold-fade;
		}
		@keyframes unfold-fade {
			from {
				opacity: 0;
			}
		}
	}
	.more {
		display: flex;
		padding: var(--space-2) var(--space-2) var(--space-1);
		box-shadow: var(--rule-above);
	}
	.more :global(svg) {
		transition: rotate var(--motion-quick) var(--ease-out);
	}
	.more :global(button[aria-expanded='true'] svg) {
		rotate: 180deg;
	}
	@media (prefers-reduced-motion: reduce) {
		.more :global(svg) {
			transition: none;
		}
	}

	/* ---------- This sprint ---------- */
	.side-card {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-3);
		padding: var(--space-5) var(--space-3) var(--space-3);
		min-inline-size: 0;
	}
	.side-card .card-head {
		padding-inline: var(--space-2);
	}
	.plist {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.prow {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-block-size: var(--target-touch);
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-item);
		color: inherit;
		text-decoration: none;
	}
	@media (hover: hover) and (pointer: fine) {
		.prow:hover {
			background: var(--surface-sunken);
		}
	}
	/* A long aspect name wraps to three lines, as signed, instead of a one-line ellipsis. */
	.pname {
		flex: 1;
		min-inline-size: 0;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		overflow-wrap: anywhere;
		font-weight: var(--weight-medium);
	}
	.pvalue {
		flex: none;
		font-weight: var(--weight-medium);
		font-variant-numeric: var(--numeric-figures);
	}
	.tile {
		display: grid;
		place-items: center;
		flex: none;
		inline-size: var(--space-7);
		block-size: var(--space-7);
		border-radius: var(--radius-round);
		background: var(--aspect);
		color: var(--aspect-ink);
	}
	.msg {
		padding: var(--space-3);
		color: var(--ink-secondary);
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
	}
</style>
