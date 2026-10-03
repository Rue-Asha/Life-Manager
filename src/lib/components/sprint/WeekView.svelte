<script lang="ts">
	import type { Aspect, IsoDate, Todo } from '$lib/types';
	import SprintCard from './SprintCard.svelte';

	let {
		todos,
		aspects,
		today,
		sprintDays
	}: { todos: Todo[]; aspects: Aspect[]; today: IsoDate; sprintDays: IsoDate[] } = $props();

	const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });
	const utc = (d: IsoDate) => new Date(`${d}T00:00:00Z`);

	const columns = $derived([
		...sprintDays.map((day) => ({ key: day, day })),
		{ key: 'unscheduled', day: null }
	]);

	const aspectOf = (todo: Todo) => aspects.find((a) => a.id === todo.aspectId)!;
</script>

<div class="week">
	{#each columns as { key, day } (key)}
		{@const cards = todos.filter((t) => t.day === day)}
		<section class="column" class:today={day === today} data-testid="day-column-{key}" aria-labelledby="day-{key}">
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
		</section>
	{/each}
</div>

<style>
	.week {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
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

	.today .date {
		background: var(--accent);
		color: var(--ink-on-accent);
	}

	.count {
		margin-left: auto;
		color: var(--ink-3);
		font-weight: var(--weight-regular);
	}

	@media (max-width: 767px) {
		.week {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
