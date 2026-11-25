<script lang="ts" module>
	import { deserialize } from '$app/forms';
	import { shownDay } from '$lib/todo-utils';
	import { reloadAfterMove } from './reload';
	import type { Id, IsoDate, Todo } from '$lib/types';

	// A dropped card sits on its new day while the move saves, instead of springing back.
	const moved = $state<Record<Id, IsoDate | null>>({});
	export const dayOf = (todo: Todo) => (todo.id in moved ? moved[todo.id] : shownDay(todo));

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
		if (deserialize(await response.text()).type === 'success') await reloadAfterMove();
		delete moved[todo.id];
	}
</script>

<script lang="ts">
	import { flip } from 'svelte/animate';
	import { dropZone } from '$lib/dnd';
	import { arrive, flipOpts, leave } from '$lib/motion';
	import { copy } from '$lib/copy';
	import type { Aspect, Placement } from '$lib/types';
	import Icon from '../shell/Icon.svelte';
	import { dayLabel } from '../todo/format';
	import Button from '../ui/Button.svelte';
	import SprintCard from './SprintCard.svelte';

	let {
		todos,
		aspects,
		today,
		sprintDays,
		layout = 'rail',
		onadd,
		onaddto
	}: {
		todos: Todo[];
		aspects: Aspect[];
		today: IsoDate;
		sprintDays: IsoDate[];
		// `full`: the backlog rail is folded away, so from 1280 px the seven days share one row.
		layout?: 'rail' | 'full';
		onadd?: (id: Id, placement: Placement) => void;
		// Opens the new-todo dialog for a day (null: the sprint without a day).
		onaddto?: (day: IsoDate | null, trigger: HTMLElement) => void;
	} = $props();

	const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });
	const utc = (d: IsoDate) => new Date(`${d}T00:00:00Z`);
	const name = (d: IsoDate | null) => (d ? dayLabel(d) : 'Unscheduled');

	const aspectOf = (todo: Todo) => aspects.find((a) => a.id === todo.aspectId)!;
	const onDay = (d: IsoDate | null) => todos.filter((t) => dayOf(t) === d);
	const open = (d: IsoDate | null) => onDay(d).filter((t) => t.status !== 'done').length;

	// The phone shows one day at a time, starting on today.
	let chosen = $state<IsoDate | 'none' | null>(null);
	const shown = $derived<IsoDate | null>(chosen === 'none' ? null : (chosen ?? (sprintDays.includes(today) ? today : sprintDays[0])));

	const zone = (day: IsoDate | null) => ({
		accepts: (p: { from: string }) => p.from === 'sprint' || !!onadd,
		ondrop: (p: { id: Id; from: string }) => (p.from === 'sprint' ? moveToDay(todos.find((t) => t.id === p.id), day) : onadd?.(p.id, { day }))
	});
</script>

{#snippet add(d: IsoDate | null)}
	<Button class="hs-day-add" variant="quiet" icon type="button" label={copy.sprintViews.addTodoTo(name(d))} aria-haspopup="dialog" onclick={(e) => onaddto?.(d, e.currentTarget as HTMLElement)}>
		<Icon name="plus" size={16} />
	</Button>
{/snippet}

<div class="hs-week-phone">
	<nav aria-label="Days">
		<div class="hs-days">
			{#each sprintDays as d (d)}
				<button type="button" class="hs-daybtn" data-press aria-current={d === shown ? 'true' : undefined} data-today={d === today ? '' : undefined} onclick={() => (chosen = d)}>
					<span>{dayLabel(d)}</span>
					<span class="hs-dayflag">{#if open(d) > 0}<i class="hs-dot"></i><span class="sr-only">{open(d)} open</span>{/if}</span>
				</button>
			{/each}
			<button type="button" class="hs-daybtn" data-press aria-current={shown === null ? 'true' : undefined} onclick={() => (chosen = 'none')}>
				<span class="hs-day-long">Unscheduled</span>
				<span class="hs-dayflag">{#if open(null) > 0}<i class="hs-dot"></i><span class="sr-only">{open(null)} open</span>{/if}</span>
			</button>
		</div>
	</nav>
	<section class="card hs-group" aria-labelledby="phone-day">
		<div class="hs-group-head">
			<h2 id="phone-day">{shown ? `${dayLabel(shown)}${shown === today ? ' · Today' : ''}` : 'Unscheduled'}</h2>
			<span class="hs-count">{onDay(shown).length}</span>
		</div>
		<div class="hs-list">
			{#each onDay(shown) as todo (todo.id)}
				<div in:arrive={{ key: todo.id }} out:leave={{ key: todo.id }} animate:flip={flipOpts()}>
					<SprintCard {todo} aspect={aspectOf(todo)} {today} {sprintDays} variant="row" mixed />
				</div>
			{:else}
				<p class="hs-none">{copy.sprintViews.nothingPlanned}</p>
			{/each}
		</div>
		<Button class="hs-addwide" variant="secondary" type="button" aria-haspopup="dialog" onclick={(e) => onaddto?.(shown, e.currentTarget as HTMLElement)}>
			<Icon name="plus" size={18} />{copy.sprintViews.addTodoTo(name(shown))}
		</Button>
	</section>
</div>

<div class="hs-week-wide" role="group" aria-label="Week" data-layout={layout}>
	<div class="hs-week">
		{#each sprintDays as d (d)}
			{@const list = onDay(d)}
			<section class="hs-day" aria-label={dayLabel(d)} aria-current={d === today ? 'date' : undefined} use:dropZone={zone(d)}>
				<div class="hs-day-head">
					<h2><span class="wd">{weekday.format(utc(d))}</span> <span class="dn">{utc(d).getUTCDate()}</span></h2>
					{@render add(d)}
				</div>
				<p class="hs-day-n"><span class="sr-only">Planned </span>{list.length}{#if d === today}<span aria-hidden="true">{' · '}</span><span class="hs-today">Today</span>{/if}</p>
				{#each list as todo (todo.id)}
					<div in:arrive={{ key: todo.id }} out:leave={{ key: todo.id }} animate:flip={flipOpts()}>
						<SprintCard {todo} aspect={aspectOf(todo)} {today} {sprintDays} variant="chip" />
					</div>
				{:else}
					<p class="hs-none">{copy.sprintViews.nothingPlanned}</p>
				{/each}
				<p class="hs-dropnote" aria-hidden="true">{copy.sprintViews.dropOnDay(dayLabel(d))}</p>
			</section>
		{/each}
	</div>
	<section class="hs-day hs-unsched" aria-label="Unscheduled" use:dropZone={zone(null)}>
		<div class="hs-day-head">
			<h2><span class="wd">Unscheduled</span></h2>
			{@render add(null)}
		</div>
		<p class="hs-day-n">{onDay(null).length}</p>
		<div class="hs-list-wide">
			{#each onDay(null) as todo (todo.id)}
				<div in:arrive={{ key: todo.id }} out:leave={{ key: todo.id }} animate:flip={flipOpts()}>
					<SprintCard {todo} aspect={aspectOf(todo)} {today} {sprintDays} variant="chip" />
				</div>
			{:else}
				<p class="hs-none">{copy.sprintViews.nothingUnscheduled}</p>
			{/each}
		</div>
		<p class="hs-dropnote" aria-hidden="true">{copy.sprintViews.dropToClearDay}</p>
	</section>
</div>
