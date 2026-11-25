<!--
	Uni: the grade line as the key-facts card, the active semesters with their classes, "This week", the collapsed Archived group, and a side panel
	for the notes and the Uni aspect line (a right column from 1280 px, a card below the main column under it). Before the Uni aspect is chosen only
	its one-time prompt is shown.
-->
<script lang="ts">
	import { copy } from '$lib/copy';
	import Icon from '$lib/components/shell/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Disclosure from '$lib/components/ui/Disclosure.svelte';
	import NewSemesterSheet from '$lib/components/uni/NewSemesterSheet.svelte';
	import NotesCard from '$lib/components/ui/NotesCard.svelte';
	import SemesterCard from '$lib/components/uni/SemesterCard.svelte';
	import ThisWeek from '$lib/components/uni/ThisWeek.svelte';
	import UniAspectPrompt from '$lib/components/uni/UniAspectPrompt.svelte';
	import '$lib/components/uni/uni.css';
	import { formatAverage } from '$lib/uni';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let adding = $state(false);
	let changing = $state(false);
	let archivedOpen = $state(false);

	const uniAspect = $derived(data.aspects.find((a) => a.id === data.uniAspectId));
	const prompting = $derived(!uniAspect);
	const empty = $derived(data.active.length === 0 && data.archived.length === 0);
	const average = $derived(formatAverage(data.overall.average));
</script>

<svelte:head>
	<title>Uni · Life Manager</title>
</svelte:head>

<div class="screen-head">
	<div class="screen-lead">
		<ul class="kicker"><li>Life</li><li>{copy.uni.kicker}</li></ul>
		<h1><em class="accent-word">Uni</em></h1>
		{#if !prompting}
			<p class="lede">Semesters, classes and what is due this week.</p>
			<div class="u-head-action">
				<Button aria-haspopup="dialog" onclick={() => (adding = true)}><Icon name="plus" size={18} />New semester</Button>
			</div>
		{/if}
	</div>
	{#if !prompting && !empty}
		<ul class="screen-facts" data-surface="inverse">
			<li class="facts-caption"><span aria-hidden="true">Overall</span><span class="sr-only">Overall average {average} · {data.overall.earnedEcts} ECTS earned</span></li>
			<li><span class="n">{average}</span><span>Average</span></li>
			<li><span class="n">{data.overall.earnedEcts}</span><span>ECTS earned</span></li>
		</ul>
	{/if}
</div>

<div class="screen-body" data-settle>
	{#if prompting}
		<UniAspectPrompt aspects={data.aspects} linkCount={data.linkCount} />
	{:else}
		<div class="u-split">
			<div class="u-main">
				{#if empty}
					<section class="card u-panel" aria-labelledby="uni-empty">
						<div class="u-empty">
							<h2 id="uni-empty">{copy.empty.uni.heading}</h2>
							<div><Button aria-haspopup="dialog" onclick={() => (adding = true)}><Icon name="plus" size={16} />New semester</Button></div>
						</div>
					</section>
				{:else}
					<div class="u-groups" role="group" aria-label="Active semesters">
						{#each data.active as semester (semester.id)}
							<SemesterCard {semester} counts={data.counts[semester.id]} today={data.today} />
						{/each}
					</div>
					<ThisWeek todos={data.sprintTodos} classes={data.classes} today={data.today} />
					{#if data.archived.length > 0}
						<section class="card u-panel">
							<Disclosure id="uni-arch" label="Archived" count={data.archived.length} level={2} name="Archived ({data.archived.length})" bind:open={archivedOpen}>
								<div class="u-stack arch">
									{#each data.archived as semester (semester.id)}
										<Disclosure id="arch-{semester.id}" label={semester.name} level={3} user name="Semester {semester.name}">
											<SemesterCard {semester} counts={data.counts[semester.id]} today={data.today} readOnly />
										</Disclosure>
									{/each}
								</div>
							</Disclosure>
						</section>
					{/if}
				{/if}
			</div>
			<aside class="card u-side" aria-label="Notes and Uni aspect">
				<h2 class="ruled">Notes and Uni aspect</h2>
				<NotesCard bare id="uni-notes" html={data.notesHtml} text={data.notes} empty={copy.uni.notesEmpty} />
				<hr class="u-rule" />
				<p class="u-aspect-line">Todos of the aspect <strong data-user>{uniAspect!.name}</strong> can be linked to a class.</p>
				<div class="u-tail"><Button size="s" label={copy.uni.changeLabel} aria-haspopup="dialog" onclick={() => (changing = true)}>{copy.uni.change}</Button></div>
			</aside>
		</div>
		<UniAspectPrompt aspects={data.aspects} current={data.uniAspectId} linkCount={data.linkCount} open={changing} onclose={() => (changing = false)} />
	{/if}
</div>

<NewSemesterSheet open={adding} onclose={() => (adding = false)} />

<style>
	.u-groups {
		display: grid;
		gap: var(--space-4);
		min-inline-size: 0;
	}
	.u-groups:not(:has(> *)) {
		display: none;
	}
	.u-empty {
		display: grid;
		justify-items: start;
		gap: var(--space-2);
		padding-block: var(--space-8);
	}
	.u-empty > div {
		margin-block-start: var(--space-3);
	}
	.u-empty h2 {
		font-family: var(--font-display);
		font-weight: var(--weight-display);
		font-size: var(--type-display-s-size);
		line-height: var(--type-display-s-line);
		letter-spacing: var(--type-display-s-tracking);
		text-wrap: balance;
	}
	.arch {
		gap: var(--space-4);
	}
</style>
