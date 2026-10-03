<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import type { Aspect, Id, IsoDate, Target, Todo } from '$lib/types';
	import QuickAdd from '../todo/QuickAdd.svelte';
	import { submit } from '../todo/form';
	import { dayLabel } from '../todo/format';
	import { UI_ICONS } from '../ui/icons';
	import SprintCard, { dropTarget } from './SprintCard.svelte';

	let {
		todos,
		aspects,
		today,
		sprintDays
	}: { todos: Todo[]; aspects: Aspect[]; today: IsoDate; sprintDays: IsoDate[] } = $props();

	const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });
	const utc = (d: IsoDate) => new Date(`${d}T00:00:00Z`);

	const columns = $derived([
		...sprintDays.map((day) => ({ key: day, day, target: { kind: 'day', day } as Target })),
		{ key: 'unscheduled', day: null, target: { kind: 'sprint' } as Target }
	]);

	const aspectOf = (todo: Todo) => aspects.find((a) => a.id === todo.aspectId)!;

	// The phone shows one column at a time, starting on today.
	let chosen = $state<string | null>(null);
	const shown = $derived(chosen ?? (sprintDays.includes(today) ? today : sprintDays[0]));

	// A dropped card sits on its new day while the move saves, instead of springing back.
	let moved = $state<{ id: Id; day: IsoDate | null } | null>(null);
	let moveForm = $state<HTMLFormElement>();
	const dayOf = (todo: Todo) => (moved?.id === todo.id ? moved.day : todo.day);

	async function drop(id: Id, day: IsoDate | null) {
		if (todos.find((t) => t.id === id)?.day === day) return;
		moved = { id, day };
		await tick();
		moveForm?.requestSubmit();
	}

	const settle = () => (moved = null);
</script>

<form
	bind:this={moveForm}
	method="POST"
	action="/todos?/setDay"
	hidden
	use:enhance={submit({ onsuccess: settle, onerror: settle })}
>
	<input type="hidden" name="id" value={moved?.id} />
	<input type="hidden" name="day" value={moved?.day ?? ''} />
</form>

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

<div class="week">
	{#each columns as { key, day, target } (key)}
		{@const cards = todos.filter((t) => dayOf(t) === day)}
		<section
			class="column"
			class:away={shown !== key}
			use:dropTarget={(id) => drop(id, day)}
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
				<SprintCard {todo} aspect={aspectOf(todo)} {today} {sprintDays} />
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

	/* Priority and due date drop under the meta line instead of squeezing the title. */
	.column :global(.row.checkable) {
		grid-template-columns: var(--checkbox-size) minmax(0, 1fr);
	}

	.column :global(.row .end) {
		grid-column: 2;
	}

	.column :global(.row .end:has(*)) {
		margin-top: var(--space-2);
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
