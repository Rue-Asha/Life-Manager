<!--
	The selected day's list (lifted from hifi/calendar/DayList.svelte): a solid card with its date on top; from 1024 px only the entries scroll
	inside it, with a "More below" cue while more follows. A todo entry opens the todo editor, a projection links its rule, an exam its class.
	Done entries stay listed in their done state; a day with only due todos shows the Due section and no empty text.
-->
<script lang="ts">
	import { copy } from '$lib/copy';
	import { dateLabel } from '$lib/components/todo/format';
	import Icon from '$lib/components/shell/Icon.svelte';
	import { vfade } from '$lib/components/shell/cue';
	import { slotLabel } from '$lib/slot';
	import type { CalendarEntry, DueTodo } from '$lib/server/calendar';
	import type { Aspect, Id, IsoDate } from '$lib/types';
	import TodoEditor from '../todo/TodoEditor.svelte';
	import './calendar.css';

	let {
		day,
		entries,
		due,
		aspects,
		uniAspectId
	}: { day: IsoDate; entries: CalendarEntry[]; due: DueTodo[]; aspects: Aspect[]; uniAspectId: Id | null } = $props();

	const aspectName = (id: Id | null) => aspects.find((a) => a.id === id)?.name ?? 'Uni';
	const aspectOf = (e: CalendarEntry) => aspectName(e.kind === 'exam' ? uniAspectId : e.aspectId);

	let editing = $state<Id | null>(null);
	const editTodo = $derived(entries.flatMap((e) => (e.kind === 'todo' && e.todo.id === editing ? [e.todo] : []))[0]);
</script>

{#snippet body(e: CalendarEntry)}
	{#if e.kind === 'todo'}
		<span class="leading" aria-hidden="true"><span class="hc-tick" data-on={e.done ? '' : undefined}>{#if e.done}<Icon name="check" size={12} />{/if}</span></span>
	{/if}
	<span class="text">
		<span class="title" class:hc-done={e.kind === 'todo' && e.done} data-user>{e.title}{#if e.kind === 'todo' && e.done}<span class="sr-only"> (done)</span>{/if}</span>
		<span class="meta"><span role="time">{slotLabel(e.startTime, e.endTime)}</span> · {aspectOf(e)}</span>
		{#if e.kind === 'projection'}<span class="hc-tag">Projected</span>{/if}
		{#if e.kind === 'exam'}<span class="hc-tag" data-kind="exam">Exam{e.room ? ` · ${e.room}` : ''}</span>{/if}
	</span>
	{#if e.kind !== 'todo'}<span class="leading" aria-hidden="true"><Icon name="chevron-right" /></span>{/if}
{/snippet}

<section class="card hc-list" aria-labelledby="day-title">
	<h2 class="ruled" id="day-title">{dateLabel(day)}</h2>
	<div class="hc-scroll" use:vfade>
		{#if due.length > 0}
			<div role="group" aria-label="Due" class="hc-due-group">
				<h3 class="hc-sub">Due</h3>
				<ul class="hc-entries" role="list">
					{#each due as t (t.id)}
						<li class="row"><span class="main"><span class="text"><span class="title" data-user>{t.title}</span><span class="meta">{aspectName(t.aspectId)}</span></span></span></li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if entries.length > 0}
			<ul class="hc-entries" role="list">
				{#each entries as e, i (i)}
					<li class="row interactive hc-entry" aria-label={e.title}>
						{#if e.kind === 'todo'}
							<button type="button" class="main" data-press onclick={() => (editing = e.todo.id)}>{@render body(e)}</button>
						{:else if e.kind === 'projection'}
							<a class="main" href="/recurring#rule-{e.ruleId}" data-press>{@render body(e)}</a>
						{:else}
							<a class="main" href="/uni/classes/{e.classId}" data-press>{@render body(e)}</a>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		{#if entries.length === 0 && due.length === 0}
			<div class="hc-empty"><h3 class="title">{copy.sprintViews.nothingPlanned}</h3></div>
		{/if}
	</div>
	<p class="more-below" aria-hidden="true"><Icon name="chevron" size={14} />More below</p>
</section>

{#if editTodo}
	<TodoEditor todo={editTodo} {aspects} open onclose={() => (editing = null)} />
{/if}
