<script lang="ts" module>
	import { receive, send } from '$lib/motion';

	// A hidden column (the phone's other days) has no box to travel from or to, and crossfade
	// would scale by width / 0; such a card just appears.
	const rendered = (node: Element) => node.getClientRects().length > 0;

	// While it fades out, the old card is only a picture of the move: the todo already lives in its
	// new place, so the copy leaves the accessibility tree and stops being a row. A refused move
	// brings the same element back, so this is undone when it arrives again.
	function ghost(node: Element, leaving: boolean) {
		if (leaving) node.setAttribute('aria-hidden', 'true');
		else node.removeAttribute('aria-hidden');
		const [from, to] = leaving ? ['data-testid', 'data-left-testid'] : ['data-left-testid', 'data-testid'];
		for (const el of node.querySelectorAll(`[${from}]`)) {
			el.setAttribute(to, el.getAttribute(from)!);
			el.removeAttribute(from);
		}
	}

	export const arrive: typeof receive = (node, params) => {
		ghost(node, false);
		return rendered(node) ? receive(node, params) : () => ({});
	};

	export const leave: typeof send = (node, params) => {
		ghost(node, true);
		return rendered(node) ? send(node, params) : () => ({});
	};

	// From 1280 the columns run down to the viewport bottom; how far down they start depends on
	// the header and bar above them.
	export function viewportTop(node: HTMLElement) {
		const measure = () => node.style.setProperty('--top', `${node.getBoundingClientRect().top + scrollY}px`);
		measure();
		addEventListener('resize', measure);
		return { destroy: () => removeEventListener('resize', measure) };
	}
</script>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { dropZone } from '$lib/dnd';
	import { flipOpts } from '$lib/motion';
	import type { Aspect, Id, IsoDate, Placement, Status, Todo } from '$lib/types';
	import { STATUS_LABELS } from '../todo/StatusControl.svelte';
	import { submit } from '../todo/form';
	import SprintCard from './SprintCard.svelte';

	let {
		todos,
		aspects,
		today,
		sprintDays,
		onadd
	}: {
		todos: Todo[];
		aspects: Aspect[];
		today: IsoDate;
		sprintDays: IsoDate[];
		onadd?: (id: Id, placement: Placement) => void;
	} = $props();

	const STATUSES: Status[] = ['todo', 'doing', 'done'];
	const PLACEHOLDERS: Record<Status, string> = {
		todo: 'Nothing left to start',
		doing: 'Nothing in progress',
		done: 'Nothing done yet'
	};

	const aspectOf = (todo: Todo) => aspects.find((a) => a.id === todo.aspectId)!;

	// A dropped card sits in its new column while the move saves, instead of springing back.
	let moved = $state<{ id: Id; status: Status } | null>(null);
	let moveForm = $state<HTMLFormElement>();
	const statusOf = (todo: Todo) => (moved?.id === todo.id ? moved.status : todo.status);

	async function drop(id: Id, status: Status) {
		if (todos.find((t) => t.id === id)?.status === status) return;
		moved = { id, status };
		await tick();
		moveForm?.requestSubmit();
	}

	const settle = () => (moved = null);
</script>

<form
	bind:this={moveForm}
	method="POST"
	action="/todos?/setStatus"
	hidden
	use:enhance={submit({ onsuccess: settle, onerror: settle })}
>
	<input type="hidden" name="id" value={moved?.id} />
	<input type="hidden" name="status" value={moved?.status} />
</form>

<div class="board" use:viewportTop>
	{#each STATUSES as status (status)}
		{@const cards = todos.filter((t) => statusOf(t) === status)}
		<section
			class="column"
			use:dropZone={{
				accepts: (p) => p.from === 'sprint' || !!onadd,
				ondrop: (p) => (p.from === 'sprint' ? drop(p.id, status) : onadd?.(p.id, { status }))
			}}
			data-testid="board-column-{status}"
			aria-labelledby="column-{status}"
		>
			<h2 id="column-{status}">{STATUS_LABELS[status]}<span class="num">{cards.length}</span></h2>
			{#each cards as todo (todo.id)}
				<div in:arrive={{ key: todo.id }} out:leave={{ key: todo.id }} animate:flip={flipOpts()}>
					<SprintCard {todo} aspect={aspectOf(todo)} {today} {sprintDays} />
				</div>
			{:else}
				<p class="placeholder" data-testid="column-placeholder">{PLACEHOLDERS[status]}</p>
			{/each}
		</section>
	{/each}
</div>

<style>
	.board {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-3);
		align-items: start;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-height: 180px;
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
		transition:
			background-color var(--dur-fast) var(--ease-out),
			box-shadow var(--dur-fast) var(--ease-out);
	}

	/* The drop slot is a hairline, not a filled target. */
	.column:global([data-over]) {
		background: var(--accent-soft);
		box-shadow: inset 0 0 0 1px var(--accent);
	}

	h2 {
		display: flex;
		justify-content: space-between;
		margin-bottom: var(--space-1);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}

	h2 span {
		color: var(--ink-3);
		font-weight: var(--weight-regular);
	}

	.placeholder {
		display: grid;
		place-items: center;
		height: 64px;
		border: 1px dashed var(--line-strong);
		border-radius: var(--radius-md);
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	@media (min-width: 768px) {
		/* Priority, due date and the row menu drop under the meta line instead of squeezing the
		   title to nothing in a third-width column. */
		.column :global(.row.checkable) {
			grid-template-columns: var(--checkbox-size) minmax(0, 1fr);
		}

		.column :global(.row .end) {
			grid-column: 2;
			flex-wrap: wrap;
		}

		.column :global(.row .end:has(*)) {
			margin-top: var(--space-2);
		}
	}

	@media (min-width: 1280px) {
		.column {
			min-height: calc(100dvh - var(--top, 0px) - var(--space-9));
		}
	}

	@media (max-width: 767px) {
		.board {
			grid-template-columns: minmax(0, 1fr);
		}

		.column {
			min-height: 0;
		}
	}
</style>
