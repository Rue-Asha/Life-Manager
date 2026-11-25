<!--
	/sprint on the fingerprint (lifted from the signed hi-fi, hifi/sprint/Screen.svelte). Phases: running (the views), review-available (the
	prompt above the views), none, planning, review-required (the title and one prompt only). Every move is optimistic: status and day by
	menu or drag, "Add to sprint" from the rail or the Manage sheet, "Move to backlog" / "Remove from sprint" from the row menu; a refused
	move travels back and the alert shows next to the todo. The view switch is the URL's `?view=`, replaced in place on change.
-->
<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { tick, untrack } from 'svelte';
	import BacklogRail from '$lib/components/rail/BacklogRail.svelte';
	import Field from '$lib/components/field/Field.svelte';
	import Icon from '$lib/components/shell/Icon.svelte';
	import '$lib/components/shell/shell.css';
	import AspectView from '$lib/components/sprint/AspectView.svelte';
	import BoardView from '$lib/components/sprint/BoardView.svelte';
	import ManageSheet from '$lib/components/sprint/ManageSheet.svelte';
	import { reloadAfterMove } from '$lib/components/sprint/reload';
	import ViewSwitch from '$lib/components/sprint/ViewSwitch.svelte';
	import WeekView from '$lib/components/sprint/WeekView.svelte';
	import '$lib/components/sprint/sprint.css';
	import QuickAdd from '$lib/components/todo/QuickAdd.svelte';
	import SprintPrompt from '$lib/components/todo/SprintPrompt.svelte';
	import { submit } from '$lib/components/todo/form';
	import { weekLabel } from '$lib/components/todo/format';
	import Button from '$lib/components/ui/Button.svelte';
	import { copy } from '$lib/copy';
	import { railSlide, viewIn, viewOut } from '$lib/motion';
	import { setQuickAddContext } from '$lib/shell/quick-add.svelte';
	import type { AspectProgress, Id, IsoDate, Placement, Target, Todo } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// untracked: the stack it pushes onto is state this effect would otherwise depend on
	$effect(() => untrack(() => setQuickAddContext({ destination: 'sprint' })));

	type View = 'aspect' | 'board' | 'week';
	const asView = (v: string | null): View => (v === 'board' || v === 'week' ? v : 'aspect');
	let view = $state<View>(asView(page.url.searchParams.get('view')));
	// A real navigation (a link, back and forward) decides the view again; a reload of the data (the URL's search unchanged) does not.
	const loadedSearch = $derived(page.url.search);
	$effect(() => {
		const next = asView(new URLSearchParams(loadedSearch).get('view'));
		untrack(() => (view = next));
	});

	// A shallow, replacing goto: the URL moves without a load or a history entry, and the layout's view transition covers the switch.
	function selectView(next: View) {
		view = next;
		const url = new URL(location.href);
		if (next === 'aspect') url.searchParams.delete('view');
		else url.searchParams.set('view', next);
		goto(url, { shallow: true, replace: true });
	}

	// A move shows at once, so the todo travels before the reload confirms it; a refused move
	// drops out of here and travels back.
	let moves = $state<Record<Id, 'sprint' | 'backlog'>>({});
	let placements = $state<Record<Id, Placement>>({});
	let failure = $state<{ error: string; to: 'sprint' | 'backlog' } | null>(null);

	const unplaced = (t: Todo): Todo => ({
		...t,
		status: placements[t.id]?.status ?? 'todo',
		day: placements[t.id]?.day ?? null,
		dueDay: undefined
	});
	const todos = $derived([
		...data.todos.filter((t) => moves[t.id] !== 'backlog'),
		...data.backlog.filter((t) => moves[t.id] === 'sprint').map(unplaced)
	]);
	const backlog = $derived([
		...data.backlog.filter((t) => moves[t.id] !== 'sprint'),
		...data.todos.filter((t) => moves[t.id] === 'backlog').map(unplaced)
	]);

	// From the shown list, so counts change with the motion instead of after the reload.
	const progress = $derived.by(() => {
		const byAspect: Record<Id, AspectProgress> = {};
		for (const t of todos) {
			const p = (byAspect[t.aspectId] ??= { done: 0, total: 0 });
			p.total++;
			if (t.status === 'done') p.done++;
		}
		return byAspect;
	});

	async function move(id: Id, to: 'sprint' | 'backlog', placement?: Placement) {
		moves[id] = to;
		if (placement) placements[id] = placement;
		failure = null;
		const body = new FormData();
		body.set('id', String(id));
		if (placement?.status) body.set('status', placement.status);
		if (placement?.day) body.set('day', placement.day);
		const response = await fetch(to === 'sprint' ? '/todos?/addToSprint' : '/todos?/moveToBacklog', {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		});
		const result = deserialize(await response.text());
		// A todo another tab already moved isn't worth a message: the reload shows where it went.
		if (result.type === 'failure' && result.data?.error !== 'not-found') failure = { error: String(result.data?.error), to };
		else await reloadAfterMove();
		delete moves[id];
		delete placements[id];
	}

	const running = $derived(data.sprintDays !== null);
	const sprintDays = $derived(data.sprintDays ?? []);
	const sprintDone = $derived(todos.filter((t) => t.status === 'done').length);
	const daysLeft = $derived(sprintDays.filter((d) => d > data.today).length);
	const doing = $derived(todos.filter((t) => t.status === 'doing').length);
	const dayNo = $derived(Math.min(7, Math.max(1, sprintDays.filter((d) => d <= data.today).length)));
	const facts = $derived(
		data.aspects.filter((a) => progress[a.id]).map((a) => ({ a, done: progress[a.id].done, total: progress[a.id].total }))
	);
	const lead = $derived(
		sprintDays.length
			? `${weekLabel(sprintDays[0])} · ${daysLeft === 0 ? 'ends today' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}${doing ? ` · ${doing} doing` : ''}`
			: ''
	);
	const phaseKicker = { none: 'No sprint running', planning: 'Planning', 'review-required': 'Review due' } as const;

	// The inline add: a title for the first aspect; another aspect or a day goes through the global "New todo".
	let quickTitle = $state('');
	let quickError = $state(false);

	// Manage (below 1280 px) opens the backlog as a sheet; a day's "+" opens the new-todo dialog for that day.
	let manageOpen = $state(false);
	let addOpen = $state(false);
	let addTarget = $state<Target>({ kind: 'sprint' });
	function addTo(day: IsoDate | null) {
		addTarget = day ? { kind: 'day', day } : { kind: 'sprint' };
		addOpen = true;
	}

	// Week (gate 5, Q5): the docked rail folds away so the seven days get the width; By aspect and Board always keep it.
	let railOpen = $state(false);
	const railShown = $derived(view !== 'week' || railOpen);
	async function setRail(open: boolean) {
		railOpen = open;
		await tick();
		document.getElementById(open ? 'hs-rail-hide' : 'hs-rail-tab')?.focus({ preventScroll: true });
	}
</script>

<svelte:head>
	<title>Sprint · Life Manager</title>
</svelte:head>

<div class="screen-head">
	<div class="screen-lead">
		{#if running}
			<ul class="kicker"><li>This sprint</li><li><span class="position"><span class="sr-only">Day </span>{dayNo} <span class="of">/ 7</span></span></li></ul>
			<h1>Sprint <em class="accent-word hs-count-title">{sprintDone} / {todos.length} done</em></h1>
			<p class="lede hs-lead">{lead}</p>
		{:else}
			<ul class="kicker"><li>{phaseKicker[data.phase as keyof typeof phaseKicker]}</li></ul>
			<h1><em class="accent-word">Sprint</em></h1>
		{/if}
	</div>
	{#if running}
		<div class="seg-bar hs-bar">
			<div class="hs-bar-row">
				<ViewSwitch {view} onselect={selectView} />
				<div class="seg-actions hs-manage">
					<Button variant="secondary" size="s" type="button" aria-haspopup="dialog" onclick={() => (manageOpen = true)}>Manage</Button>
				</div>
			</div>
			{#if view !== 'week'}
				<form
					class="seg hs-quick"
					method="POST"
					action="/todos?/create"
					use:enhance={submit({
						onerror: () => (quickError = true),
						onsuccess: () => ((quickTitle = ''), (quickError = false))
					})}
				>
					<input type="hidden" name="target" value="sprint" />
					<input type="hidden" name="aspectId" value={data.aspects[0].id} />
					<Field name="title" label={copy.sprintViews.addTodo} placeholder={copy.sprintViews.addTodo} bind:value={quickTitle} hideLabel autocomplete="off" enterkeyhint="done" />
					<Button variant="primary">Add</Button>
				</form>
			{/if}
		</div>
		<ul class="screen-facts hs-facts-card" data-surface="inverse" aria-label={copy.sprintViews.donePerAspect}>
			<li class="facts-caption">{copy.sprintViews.donePerAspect}</li>
			{#each facts.slice(0, 5) as f, i (f.a.id)}
				<li class:hs-fact-wide={i >= 3}><span class="n">{f.done}/{f.total}</span><span class="fact-name" data-user>{f.a.name}</span></li>
			{/each}
			{#if facts.length > 3}<li class="hs-fact-phone"><span class="n">+{facts.length - 3}</span><span class="fact-name">{copy.sprintViews.moreAspects(facts.length - 3)}</span></li>{/if}
			{#if facts.length > 5}<li class="hs-fact-wide"><span class="n">+{facts.length - 5}</span><span class="fact-name">{copy.sprintViews.moreAspects(facts.length - 5)}</span></li>{/if}
		</ul>
	{/if}
</div>

<div class="screen-body hs-body" class:hs-solo={!running} data-settle>
	{#if data.phase !== 'running'}
		<div class="hs-prompt-slot" data-phase={data.phase}><SprintPrompt phase={data.phase} /></div>
	{/if}
	{#if running}
		<div class="hs-main">
			{#if quickError}<p class="hs-alert-line" role="alert">{copy.errors.addTodo}</p>{/if}
			{#if failure}
				<p class="hs-alert-line" role="alert">
					{#if failure.error === 'review-required'}
						The sprint needs its review first. <a class="hs-link" href="/sprint/review">Review the sprint</a>
					{:else}
						{failure.to === 'sprint' ? copy.errors.addToSprint : copy.errors.moveTodo}
					{/if}
				</p>
			{/if}
			<div class="hs-views">
				<!-- a new layout (the rail folding in or out) crossfades the view instead of letting the day columns jump -->
				{#key `${view}-${railShown}`}
					<div class="hs-view" in:viewIn out:viewOut>
						{#if view === 'aspect'}
							<AspectView {todos} aspects={data.aspects} today={data.today} {sprintDays} onadd={(id) => move(id, 'sprint')} />
						{:else if view === 'board'}
							<BoardView {todos} aspects={data.aspects} today={data.today} {sprintDays} onadd={(id, placement) => move(id, 'sprint', placement)} />
						{:else}
							<WeekView
								{todos}
								aspects={data.aspects}
								today={data.today}
								{sprintDays}
								layout={railShown ? 'rail' : 'full'}
								onadd={(id, placement) => move(id, 'sprint', placement)}
								onaddto={addTo}
							/>
						{/if}
					</div>
				{/key}
			</div>
		</div>
		{#if railShown}
			<aside class="card hs-rail" id="hs-rail" aria-label="Backlog" in:railSlide out:railSlide={{ out: true }}>
				<div class="hs-rail-head">
					<h2>Backlog</h2><span class="hs-count">{backlog.length}</span>
					{#if view === 'week'}
						<Button class="hs-rail-hide" variant="quiet" icon type="button" id="hs-rail-hide" aria-expanded="true" aria-controls="hs-rail" label="Hide backlog" onclick={() => setRail(false)}>
							<Icon name="chevron-right" size={18} />
						</Button>
					{/if}
				</div>
				<div class="hs-rail-scroll">
					<BacklogRail {backlog} aspects={data.aspects} {progress} canAdd addAction="/todos?/addToSprint" onadd={(id) => move(id, 'sprint')} onreturn={(id) => move(id, 'backlog')} />
				</div>
			</aside>
		{:else}
			<button type="button" class="hs-rail-tab" id="hs-rail-tab" aria-expanded="false" aria-controls="hs-rail" data-press in:railSlide out:railSlide={{ out: true }} onclick={() => setRail(true)}>
				<Icon name="backlog" size={20} />
				<span class="hs-rail-tab-label">Backlog</span>
				<span class="hs-count">{backlog.length}<span class="sr-only"> todos, show the backlog</span></span>
			</button>
		{/if}
	{/if}
</div>

{#if running}
	<ManageSheet bind:open={manageOpen} {backlog} aspects={data.aspects} {progress} onadd={(id) => move(id, 'sprint')} />
	<QuickAdd variant="dialog" aspects={data.aspects} target={addTarget} sprintWeekStart={sprintDays[0]} reviewRequired={data.phase === 'review-required'} bind:open={addOpen} />
{/if}

<style>
	/* the signed prompt stacks its sentence over its one action, on a card with the page's padding */
	.hs-prompt-slot :global(section.prompt) {
		display: grid;
		justify-items: start;
		gap: var(--space-3);
		padding: var(--space-5);
	}
	.hs-alert-line {
		margin-block-end: var(--space-3);
		padding: var(--space-1-5) var(--space-3);
		border-radius: var(--radius-item);
		background: var(--danger-soft);
		box-shadow: var(--ring-danger);
		color: var(--danger);
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
		font-weight: var(--weight-semibold);
	}
	.hs-alert-line :global(a) {
		color: inherit;
	}
</style>
