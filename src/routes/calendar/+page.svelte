<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import DayList from '$lib/components/calendar/DayList.svelte';
	import MonthGrid from '$lib/components/calendar/MonthGrid.svelte';
	import RailLayout from '$lib/components/shell/RailLayout.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import type { IsoDate } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const tablet = new MediaQuery('min-width: 768px');

	const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
	function shift(month: string, by: number): string {
		const d = new Date(`${month}-01T00:00:00Z`);
		d.setUTCMonth(d.getUTCMonth() + by);
		return d.toISOString().slice(0, 7);
	}

	// A click picks a day; changing the month (or "Today") forgets it, so the default applies again.
	let picked = $state<IsoDate | null>(null);
	$effect.pre(() => {
		data.month;
		picked = null;
	});
	const selected = $derived(picked ?? (data.today.startsWith(data.month) ? data.today : `${data.month}-01`));
	const entries = $derived(data.entries[selected] ?? []);
</script>

<svelte:head>
	<title>Calendar · Life Manager</title>
</svelte:head>

{#snippet list()}
	<DayList day={selected} {entries} aspects={data.aspects} />
{/snippet}

<RailLayout wide railTitle="Day list" rail={tablet.current ? list : undefined}>
	<PageHeader title="Calendar" />

	<div class="head" data-testid="calendar-head">
		<h2 data-testid="calendar-month">{monthLabel.format(new Date(`${data.month}-01T00:00:00Z`))}</h2>
		<nav aria-label="Month">
			<a class="ctl icon" href="?month={shift(data.month, -1)}" aria-label="Previous month">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['chevron-left']} /></svg>
			</a>
			<a class="ctl" href="?month={data.today.slice(0, 7)}" onclick={() => (picked = null)}>Today</a>
			<a class="ctl icon next" href="?month={shift(data.month, 1)}" aria-label="Next month">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['chevron-left']} /></svg>
			</a>
		</nav>
	</div>

	<MonthGrid
		month={data.month}
		weeks={data.weeks}
		entries={data.entries}
		{selected}
		today={data.today}
		aspects={data.aspects}
		onselect={(day) => (picked = day)}
	/>

	{#if !tablet.current}
		<div class="below">{@render list()}</div>
	{/if}
</RailLayout>

<style>
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	h2 {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
	}

	nav {
		display: flex;
		gap: var(--space-2);
	}

	.ctl {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: var(--control-height);
		padding: 0 var(--space-4);
		border-radius: var(--radius-md);
		background: var(--surface);
		box-shadow: var(--shadow-card);
		color: var(--ink);
		font-size: 14px;
		font-weight: var(--weight-semibold);
		text-decoration: none;
	}

	.ctl:hover {
		background: var(--hover);
	}

	.icon {
		width: var(--control-height);
		padding: 0;
	}

	.next svg {
		transform: scaleX(-1);
	}

	svg {
		width: var(--icon-md);
		height: var(--icon-md);
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.below {
		margin-top: var(--space-6);
	}
</style>
