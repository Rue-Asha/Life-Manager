<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import DayList from '$lib/components/calendar/DayList.svelte';
	import MonthGrid from '$lib/components/calendar/MonthGrid.svelte';
	import '$lib/components/calendar/calendar.css';
	import Icon from '$lib/components/shell/Icon.svelte';
	import type { IsoDate } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
	const monthName = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' });
	function shift(month: string, by: number): string {
		const d = new Date(`${month}-01T00:00:00Z`);
		d.setUTCMonth(d.getUTCMonth() + by);
		return d.toISOString().slice(0, 7);
	}

	// A click picks a day; changing the month (or "Today") forgets it, so the default applies again.
	let picked = $state<IsoDate | null>(null);
	// Derived so a reload of the same month (a save from the day list) keeps the pick.
	const month = $derived(data.month);
	$effect.pre(() => {
		month;
		picked = null;
	});
	const selected = $derived(picked ?? (data.today.startsWith(data.month) ? data.today : (`${data.month}-01` as IsoDate)));
	const entries = $derived(data.entries[selected] ?? []);
	const due = $derived(data.due[selected] ?? []);

	const shown = $derived(Object.values(data.entries).flat());
	const count = (kind: string) => shown.filter((e) => e.kind === kind).length;
	const dueCount = $derived(Object.values(data.due).reduce((n, list) => n + list.length, 0));
</script>

<svelte:head>
	<title>Calendar · Life Manager</title>
</svelte:head>

<div class="screen-head">
	<div class="screen-lead">
		<ul class="kicker"><li>Planned by day</li></ul>
		<h1><em class="accent-word">Calendar</em></h1>
		<p class="lede">What is planned on which day, what falls due, and which exams and recurring todos are coming.</p>
	</div>
	<ul class="screen-facts" data-surface="inverse" aria-label="This month">
		<li class="facts-caption">{monthName.format(new Date(`${data.month}-01T00:00:00Z`))}</li>
		<li><span class="n">{count('todo')}</span><span class="fact-name">planned</span></li>
		<li><span class="n">{count('projection')}</span><span class="fact-name">projected</span></li>
		<li><span class="n">{count('exam')}</span><span class="fact-name">exams</span></li>
		<li><span class="n">{dueCount}</span><span class="fact-name">due</span></li>
	</ul>
</div>

<div class="screen-body hc-body" data-settle>
	<section class="card hc-month" aria-labelledby="hc-month-h">
		<div class="hc-nav">
			<h2 id="hc-month-h">{monthLabel.format(new Date(`${data.month}-01T00:00:00Z`))}</h2>
			<nav class="hc-nav-links" aria-label="Month">
				<Button variant="quiet" icon href="?month={shift(data.month, -1)}" label="Previous month"><span class="hc-flip"><Icon name="chevron-right" /></span></Button>
				<Button size="s" href="?month={data.today.slice(0, 7)}" onclick={() => (picked = null)}>Today</Button>
				<Button variant="quiet" icon href="?month={shift(data.month, 1)}" label="Next month"><Icon name="chevron-right" /></Button>
			</nav>
		</div>
		<MonthGrid month={data.month} weeks={data.weeks} entries={data.entries} due={data.due} {selected} today={data.today} onselect={(day) => (picked = day)} />
	</section>
	<div class="hc-side">
		<DayList day={selected} {entries} {due} aspects={data.aspects} uniAspectId={data.uniAspectId} />
	</div>
</div>
