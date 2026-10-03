<script lang="ts" module>
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { MediaQuery } from 'svelte/reactivity';
	import type { Id, IsoDate, Todo } from '$lib/types';

	// From 1280 the week is one row and its Unscheduled column lives in the rail (UnscheduledList).
	export const wideWeek = new MediaQuery('min-width: 1280px');

	// A dropped card sits on its new day while the move saves, instead of springing back. Shared
	// with UnscheduledList so a card leaves one component as it lands in the other.
	const moved = $state<Record<Id, IsoDate | null>>({});
	export const dayOf = (todo: Todo) => (todo.id in moved ? moved[todo.id] : todo.day);

	export async function moveToDay(todo: Todo | undefined, day: IsoDate | null) {
		if (!todo || dayOf(todo) === day) return;
		moved[todo.id] = day;
		const body = new FormData();
		body.set('id', String(todo.id));
		body.set('day', day ?? '');
		const response = await fetch('/todos?/setDay', {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		});
		if (deserialize(await response.text()).type === 'success') await invalidateAll();
		delete moved[todo.id];
	}
</script>

<script lang="ts">
	import { flip } from 'svelte/animate';
	import { dropZone } from '$lib/dnd';
	import { flipOpts, receive, send } from '$lib/motion';
	import type { Aspect, Placement, Target } from '$lib/types';
	import QuickAdd from '../todo/QuickAdd.svelte';
	import { dayLabel } from '../todo/format';
	import { UI_ICONS } from '../ui/icons';
	import { viewportTop } from './BoardView.svelte';
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

	const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });
	const utc = (d: IsoDate) => new Date(`${d}T00:00:00Z`);

	const columns = $derived([
		...sprintDays.map((day) => ({ key: day, day, target: { kind: 'day', day } as Target })),
		...(wideWeek.current ? [] : [{ key: 'unscheduled', day: null, target: { kind: 'sprint' } as Target }])
	]);

	const aspectOf = (todo: Todo) => aspects.find((a) => a.id === todo.aspectId)!;

	// The phone shows one column at a time, starting on today.
	let chosen = $state<string | null>(null);
	const shown = $derived(chosen ?? (sprintDays.includes(today) ? today : sprintDays[0]));

	// On the phone the other days are hidden; a card has no box to travel from or to there, and
	// crossfade would scale by width / 0.
	const rendered = (node: Element) => node.getClientRects().length > 0;
	const arrive: typeof receive = (node, params) => (rendered(node) ? receive(node, params) : () => ({}));
	const leave: typeof send = (node, params) => (rendered(node) ? send(node, params) : () => ({}));
</script>

<nav class="strip" aria-label="Days">
	{#each columns as { key, day } (key)}
		{@const open = todos.some((t) => dayOf(t) === day && t.status !== 'done')}
		<button
			type="button"
			class:today={day === today}
			class:busy={open}
			aria-pressed={shown === key}
			aria-label={day ? dayLabel(day) : 'Unscheduled'}
			onclick={() => (chosen = key)}
		>
			{#if day}
				<span class="wd">{weekday.format(utc(day))}</span>
				<span class="dn num">{utc(day).getUTCDate()}</span>
			{:else}
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.inbox} /></svg>
			{/if}
		</button>
	{/each}
</nav>

<div class="week" use:viewportTop>
	{#each columns as { key, day, target } (key)}
		{@const cards = todos.filter((t) => dayOf(t) === day)}
		<section
			class="column"
			class:unscheduled={!day}
			class:away={shown !== key}
			use:dropZone={{
				accepts: (p) => p.from === 'sprint' || !!onadd,
				ondrop: (p) =>
					p.from === 'sprint' ? moveToDay(todos.find((t) => t.id === p.id), day) : onadd?.(p.id, { day })
			}}
			data-testid="day-column-{key}"
			aria-labelledby="day-{key}"
		>
			<h2 id="day-{key}">
				{#if day}
					{weekday.format(utc(day))}
					<span class="date num" aria-current={day === today ? 'date' : undefined}>{utc(day).getUTCDate()}</span>
				{:else}
					Unscheduled
				{/if}
				<span class="count num">{cards.length || ''}</span>
			</h2>
			{#each cards as todo (todo.id)}
				<div in:arrive={{ key: todo.id }} out:leave={{ key: todo.id }} animate:flip={flipOpts()}>
					<SprintCard {todo} aspect={aspectOf(todo)} {today} {sprintDays} />
				</div>
			{/each}
			<div class="add"><QuickAdd {aspects} {target} /></div>
		</section>
	{/each}
</div>

<style>
	.strip {
		display: none;
	}

	.week {
		display: grid;
		/* Up to four columns: the week reads as two rows, Monday–Thursday over Friday–Unscheduled. */
		grid-template-columns: repeat(auto-fill, minmax(max(200px, (100% - 3 * var(--space-3)) / 4), 1fr));
		gap: var(--space-3);
		align-items: start;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-height: 160px;
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
		transition: background-color var(--dur-fast) var(--ease-out);
	}

	.column:global([data-over]) {
		background: var(--accent-soft);
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		height: 26px;
		margin-bottom: var(--space-1);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}

	.date {
		display: inline-grid;
		place-items: center;
		min-width: 24px;
		height: 24px;
		padding: 0 var(--space-1);
		border-radius: var(--radius-sm);
	}

	.date[aria-current='date'] {
		background: var(--accent);
		color: var(--ink-on-accent);
	}

	.count {
		margin-left: auto;
		color: var(--ink-3);
		font-weight: var(--weight-regular);
	}

	.add {
		margin: 0 calc(-1 * var(--space-1));
	}

	@media (min-width: 768px) {
		/* Priority and due date drop under the meta line instead of squeezing the title. */
		.column :global(.row.checkable) {
			grid-template-columns: var(--checkbox-size) minmax(0, 1fr);
		}

		.column :global(.row .meta) {
			column-gap: var(--space-2);
		}

		.column :global(.row .end) {
			grid-column: 2;
		}

		.column :global(.row .end:has(*)) {
			margin-top: var(--space-2);
		}
	}

	/* Wide desktop: Monday–Sunday in one row. Where seven columns don't fit next to the rail the
	   week scrolls sideways inside itself, never the page; a busy day scrolls inside its column. */
	@media (min-width: 1280px) {
		.week {
			grid-template-columns: repeat(7, minmax(var(--day-col-min), 1fr));
			gap: var(--space-2);
			align-items: stretch;
			overflow-x: auto;
		}

		/* Narrow columns: tighter insets leave the card's chips room. */
		.column {
			height: calc(100dvh - var(--top, 0px) - var(--space-9));
			overflow-y: auto;
			padding: var(--space-2);
		}

		.column :global(.card) {
			padding-inline: var(--space-2);
		}

		h2 {
			position: sticky;
			top: calc(-1 * var(--space-2));
			z-index: 1;
			height: auto;
			margin: calc(-1 * var(--space-2)) calc(-1 * var(--space-2)) 0;
			padding: var(--space-2) var(--space-2) var(--space-1);
			background: var(--paper-sunk);
		}

		/* The server renders Unscheduled before the width is known; from 1280 it is in the rail. */
		.unscheduled {
			display: none;
		}

		/* A scrolling column would cut off the row menu; fixed at its static place it escapes the
		   clip, shifted left to line up with its trigger. */
		.column :global(.menu) {
			position: fixed;
			top: auto;
			right: auto;
			margin-top: var(--space-1);
			transform: translateX(calc(-100% + 28px));
		}
	}

	@media (max-width: 767px) {
		.strip {
			display: grid;
			grid-template-columns: repeat(8, minmax(0, 1fr));
			gap: var(--space-1);
			margin-bottom: var(--space-4);
		}

		.strip button {
			position: relative;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: var(--space-0);
			height: 60px;
			padding: var(--space-2) 0 var(--space-3);
			border: 0;
			border-radius: var(--radius-md);
			background: none;
			color: var(--ink-2);
			cursor: pointer;
		}

		.strip svg {
			width: var(--icon-md);
			height: var(--icon-md);
			margin: auto 0;
			fill: none;
			stroke: currentColor;
			stroke-width: 2;
			stroke-linecap: round;
			stroke-linejoin: round;
		}

		.wd {
			color: var(--ink-3);
			font-size: var(--text-xs);
		}

		.dn {
			font-weight: var(--weight-semibold);
		}

		.strip .today .dn {
			color: var(--accent);
		}

		.strip [aria-pressed='true'] {
			background: var(--paper-sunk);
			color: var(--ink);
		}

		.strip .today[aria-pressed='true'] {
			background: var(--accent);
			color: var(--ink-on-accent);
		}

		.strip .today[aria-pressed='true'] :is(.wd, .dn) {
			color: var(--ink-on-accent);
		}

		/* A dot under a day that still has open todos. */
		.busy::after {
			content: '';
			position: absolute;
			bottom: 6px;
			width: 4px;
			height: 4px;
			border-radius: var(--radius-pill);
			background: currentColor;
			opacity: 0.5;
		}

		.week {
			grid-template-columns: minmax(0, 1fr);
		}

		.column {
			min-height: 0;
			padding: 0;
			background: none;
		}

		.away {
			display: none;
		}
	}
</style>
