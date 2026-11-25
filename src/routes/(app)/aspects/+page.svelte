<!--
	Aspects: one list at every width. Each row holds the drag handle (fine pointer from 1280 px), the icon tile, the name, the todo count and
	the backlog and sprint line. Move up / Move down live in the row's menu on every device; the row glides to its place and focus
	returns to its menu button. A small charcoal card holds the real counts.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { enhance, type SubmitFunction } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import AspectForm from '$lib/components/aspects/AspectForm.svelte';
	import DeleteAspectDialog from '$lib/components/aspects/DeleteAspectDialog.svelte';
	import type { MenuItem } from '$lib/components/menu/Menu.svelte';
	import PopMenu from '$lib/components/menu/PopMenu.svelte';
	import Icon from '$lib/components/shell/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import { copy } from '$lib/copy';
	import { flipOpts } from '$lib/motion';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Row = (typeof data.aspects)[number];

	const uid = $props.id();
	const ASPECT_MIME = 'application/x-lm-aspect';

	let editing = $state<Row | 'new' | null>(null);
	let deleting = $state<Row | null>(null);
	let error = $state<string>();
	let order = $state<number[] | null>(null);
	let saveFailed = $state(false);

	const list = $derived(order ? (order.map((id) => data.aspects.find((a) => a.id === id)).filter(Boolean) as Row[]) : data.aspects);
	const rows = $derived(
		list.map((aspect) => {
			const todos = aspect.usage.todos;
			const progress = data.progress?.[aspect.id];
			const backlog = data.backlogCounts[aspect.id] ?? 0;
			return {
				aspect,
				count: todos === 0 ? 'No todos' : todos === 1 ? '1 todo' : `${todos} todos`,
				line: data.progress ? `${backlog} in backlog · ${progress ? `${progress.done} / ${progress.total} this sprint` : 'Not in this sprint'}` : `${backlog} in backlog`
			};
		})
	);
	const totals = $derived({
		todos: data.aspects.reduce((n, a) => n + a.usage.todos, 0),
		sprint: data.progress ? Object.values(data.progress).reduce((n, p) => n + p.total, 0) : 0
	});
	const only = $derived(data.aspects.length === 1);
	const locked = (aspect: Row) => only && aspect.usage.todos + aspect.usage.rules > 0;

	function open(target: Row | 'new') {
		error = undefined;
		editing = target;
	}

	const save: SubmitFunction = () => {
		return async ({ result, update }) => {
			if (result.type === 'failure') {
				error = result.data?.error;
				return;
			}
			// A form reset would clear the radios' bound colour before the sheet closes.
			await update({ reset: false });
			editing = null;
		};
	};

	// The order posts at once; the list shows it while the save is on its way and falls back to the stored order if it fails.
	async function reorder(ids: number[], focusId?: number) {
		if (ids.every((id, i) => id === list[i].id)) return;
		saveFailed = false;
		order = ids;
		if (focusId !== undefined) {
			await tick();
			document.getElementById(`${uid}-m${focusId}`)?.focus({ preventScroll: true });
		}
		const body = new FormData();
		for (const id of ids) body.append('order', String(id));
		const response = await fetch('?/reorder', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } }).catch(() => null);
		if (!response?.ok) saveFailed = true;
		await invalidateAll();
		order = null;
	}

	function move(index: number, by: number) {
		const to = index + by;
		if (to < 0 || to >= list.length) return;
		const ids = list.map((a) => a.id);
		[ids[index], ids[to]] = [ids[to], ids[index]];
		reorder(ids, ids[to]);
	}

	// Drag by the handle (fine pointer, from 1280 px): a line shows where the row lands.
	let dragging = $state<number | null>(null);
	let drop = $state<{ id: number; after: boolean } | null>(null);

	function dragStart(e: DragEvent, id: number) {
		const row = (e.currentTarget as HTMLElement).closest('li')!;
		e.dataTransfer!.setData(ASPECT_MIME, String(id));
		e.dataTransfer!.effectAllowed = 'move';
		e.dataTransfer!.setDragImage(row, 24, 24);
		requestAnimationFrame(() => (dragging = id));
	}

	function dragOver(e: DragEvent, id: number) {
		if (dragging === null || dragging === id || !e.dataTransfer?.types.includes(ASPECT_MIME)) return;
		e.preventDefault();
		const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
		drop = { id, after: e.clientY > box.top + box.height / 2 };
	}

	function dragEnd() {
		dragging = null;
		drop = null;
	}

	function dropOn(e: DragEvent, id: number) {
		if (dragging === null || !drop) return;
		e.preventDefault();
		const ids = list.map((a) => a.id).filter((x) => x !== dragging);
		ids.splice(ids.indexOf(id) + (drop.after ? 1 : 0), 0, dragging);
		dragEnd();
		reorder(ids);
	}

	const items = (row: Row, index: number) => [
		{ label: 'Move up', value: 'up', disabled: index === 0 },
		{ label: 'Move down', value: 'down', disabled: index === list.length - 1 },
		{ label: 'Edit', value: 'edit', separator: true },
		{ label: 'Delete', value: 'delete', danger: true, disabled: locked(row) }
	];
</script>

{#snippet icon(item: MenuItem)}
	{#if item.value === 'up'}
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
	{:else if item.value === 'down'}
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={UI_ICONS['chevron-down']} /></svg>
	{:else if item.value === 'delete'}
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={UI_ICONS.trash} /></svg>
	{/if}
{/snippet}

<svelte:head>
	<title>Aspects · Life Manager</title>
</svelte:head>

<div class="screen-head">
	<div class="screen-lead">
		<ul class="kicker"><li>Your life areas</li></ul>
		<h1><em class="accent-word">Aspects</em></h1>
		<div class="head-actions">
			<Button aria-haspopup="dialog" onclick={() => open('new')}><Icon name="plus" size={18} />New aspect</Button>
		</div>
	</div>
	<ul class="screen-facts facts" data-surface="inverse" aria-label="Your aspects">
		<li class="facts-caption">Your aspects</li>
		<li><span class="n">{list.length.toLocaleString('en-GB')}</span><span class="fact-name">{list.length === 1 ? 'aspect' : 'aspects'}</span></li>
		<li><span class="n">{totals.todos.toLocaleString('en-GB')}</span><span class="fact-name">{totals.todos === 1 ? 'todo' : 'todos'}</span></li>
		<li><span class="n">{totals.sprint.toLocaleString('en-GB')}</span><span class="fact-name">in this sprint</span></li>
	</ul>
</div>

<div class="screen-body" data-settle>
	{#if saveFailed}
		<p class="card note" role="alert"><Icon name="alert" size={16} />{copy.aspects.saveOrderFailed}</p>
	{/if}
	<section class="card list-card" aria-label="Aspects">
		<ul class="list">
			{#each rows as { aspect, count, line }, i (aspect.id)}
				<li
					class="item"
					aria-label={aspect.name}
					data-lifted={dragging === aspect.id ? '' : undefined}
					data-drop={drop?.id === aspect.id ? (drop.after ? 'after' : 'before') : undefined}
					animate:flip={flipOpts()}
					ondragover={(e) => dragOver(e, aspect.id)}
					ondrop={(e) => dropOn(e, aspect.id)}
				>
					<span class="handle" data-testid="aspect-handle" aria-hidden="true" draggable="true" ondragstart={(e) => dragStart(e, aspect.id)} ondragend={dragEnd}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
					</span>
					<a class="link" href="/aspects/{aspect.id}" title={aspect.name} data-press>
						<span class="nav-tile" data-color={aspect.color} aria-hidden="true"><Icon aspect={aspect.icon} size={16} /></span>
						<span class="text">
							<span class="name" data-user>{aspect.name}</span>
							<span class="sub">{count}</span>
							<span class="sub">{line}</span>
						</span>
					</a>
					<PopMenu
						name="Actions for {aspect.name}"
						items={items(aspect, i)}
						{icon}
						wide
						onselect={(item) => (item.value === 'up' ? move(i, -1) : item.value === 'down' ? move(i, 1) : item.value === 'edit' ? open(aspect) : (deleting = aspect))}
					>
						{#snippet trigger(attrs)}
							<Button variant="quiet" icon type="button" label="Actions for {aspect.name}" id="{uid}-m{aspect.id}" {...attrs}>
								<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d={UI_ICONS.more} /></svg>
							</Button>
						{/snippet}
					</PopMenu>
				</li>
			{/each}
		</ul>
		{#if only}<p class="only">One aspect: both moves in its menu are disabled, and Delete is disabled while it still holds todos or rules.</p>{/if}
	</section>
</div>

<Sheet open={editing !== null} title={editing === 'new' ? 'New aspect' : 'Edit aspect'} onclose={() => (editing = null)}>
	{#if editing}
		{@const current = editing === 'new' ? null : editing}
		<form id="aspect-form" method="POST" action={current ? '?/update' : '?/create'} aria-label={current ? 'Edit aspect' : 'New aspect'} use:enhance={save}>
			{#if current}<input type="hidden" name="id" value={current.id} />{/if}
			<AspectForm name={current?.name} color={current?.color ?? 'tangerine'} icon={current?.icon} {error} />
			{#if current && locked(current)}
				<p class="locked" id="locked-note">This is your only aspect and it still has todos or rules. Add another aspect to move them to first.</p>
			{/if}
		</form>
	{/if}
	{#snippet actions()}
		{#if editing && editing !== 'new'}
			{@const current = editing}
			<Button
				type="button"
				variant="danger"
				class="delete-aspect"
				disabled={locked(current)}
				aria-describedby={locked(current) ? 'locked-note' : undefined}
				onclick={() => {
					deleting = current;
					editing = null;
				}}
			>
				<Icon name="trash" size={18} />Delete aspect
			</Button>
		{/if}
		<Button type="button" onclick={() => (editing = null)}>Cancel</Button>
		<Button variant="primary" type="submit" form="aspect-form">{editing === 'new' ? 'Create aspect' : 'Save'}</Button>
	{/snippet}
</Sheet>

<DeleteAspectDialog
	aspect={deleting}
	usage={deleting?.usage ?? { todos: 0, rules: 0 }}
	targets={data.aspects.filter((a) => a.id !== deleting?.id)}
	onclose={() => (deleting = null)}
/>

<style>
	.head-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
	}
	/* The small key-facts card sits beside the title from 768 px, under it on phones. */
	@media (max-width: 767px) {
		.facts {
			justify-self: start;
		}
	}

	.note {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0;
		padding: var(--space-4) var(--space-5);
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
		color: var(--danger);
	}

	.list-card {
		display: grid;
		padding: var(--space-2);
		min-inline-size: 0;
	}
	.list {
		display: grid;
		min-inline-size: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.item {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-1) var(--space-2);
		padding: var(--space-2) var(--space-2) var(--space-2) var(--space-1);
		border-radius: var(--radius-item);
		min-inline-size: 0;
	}
	.item + .item {
		border-block-start: var(--stroke-hairline) solid var(--hairline);
		border-start-start-radius: 0;
		border-start-end-radius: 0;
	}
	.item[data-lifted] {
		opacity: 0.5;
	}
	.item[data-drop='before'] {
		border-block-start: var(--stroke-strong) solid var(--surface-inverse);
	}
	.item[data-drop='after'] {
		border-block-end: var(--stroke-strong) solid var(--surface-inverse);
	}
	.handle {
		display: none;
		flex: none;
		place-items: center;
		inline-size: var(--space-6);
		color: var(--ink-muted);
		cursor: grab;
	}
	.link {
		flex: 1 1 0;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-block-size: var(--target-touch);
		min-inline-size: 0;
		padding-inline: var(--space-1);
		border-radius: var(--radius-item);
		color: inherit;
		text-decoration: none;
	}
	@media (hover: hover) and (pointer: fine) {
		.link:hover {
			background: var(--surface-sunken);
		}
	}
	.text {
		display: grid;
		gap: var(--space-0-5);
		flex: 1;
		min-inline-size: 0;
	}
	.name {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		overflow-wrap: anywhere;
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
		font-weight: var(--type-title-weight);
	}
	.sub {
		font-size: var(--type-caption-size);
		line-height: var(--type-caption-line);
		color: var(--ink-secondary);
		font-variant-numeric: var(--numeric-figures);
		overflow-wrap: anywhere;
	}
	@media (min-width: 1280px) and (hover: hover) and (pointer: fine) {
		.handle {
			display: grid;
		}
	}
	.only {
		margin: var(--space-3) 0 0;
		padding: var(--space-3);
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
		color: var(--ink-secondary);
	}
	.locked {
		margin: var(--space-4) 0 0;
		font-size: var(--type-body-s-size);
		color: var(--ink-secondary);
	}
	:global(dialog[data-sheet] > footer .delete-aspect) {
		margin-inline-end: auto;
	}
</style>
