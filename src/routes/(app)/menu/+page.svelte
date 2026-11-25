<script lang="ts">
	import { copy } from '$lib/copy';
	import { formatCount, navCount, syncNeedsAttention } from '$lib/nav';
	import type { SyncState } from '$lib/server/proton/types';
	import ListRow from '$lib/components/list-row/ListRow.svelte';
	import Icon from '$lib/components/shell/Icon.svelte';
	import '$lib/components/shell/shell.css';

	let { data } = $props();

	const nav = $derived(data.nav);
	const needs = $derived(syncNeedsAttention(nav));
	const syncText: Record<SyncState, string> = { off: 'Off', idle: 'Up to date', syncing: 'Syncing', relogin: 'Re-login needed', error: 'Error' };
	const lists = $derived([
		{ label: 'Projects', href: '/projects', icon: 'projects' as const, count: formatCount(navCount(nav, 'projects').n), meta: 'IT projects' },
		{ label: 'Uni', href: '/uni', icon: 'uni' as const, count: formatCount(navCount(nav, 'uni').n), meta: 'Semesters and classes' },
		{ label: 'Recurring', href: '/recurring', icon: 'recurring' as const, count: formatCount(navCount(nav, 'recurring').n), meta: 'Weekly rules' }
	]);
</script>

<svelte:head>
	<title>More · Life Manager</title>
</svelte:head>

<div class="screen-head">
	<div class="screen-lead">
		<ul class="kicker"><li>Life</li></ul>
		<h1><em class="accent-word">More</em></h1>
	</div>
</div>
<div class="screen-body hub" data-settle>
	<section class="card stack" aria-labelledby="hub-aspects">
		<h2 class="ruled" id="hub-aspects">Aspects</h2>
		<ul class="stack" aria-label="Aspects">
			{#each nav.aspects as aspect (aspect.id)}
				<li>
					<ListRow chevron href="/aspects/{aspect.id}" title={aspect.name} value={formatCount(aspect.backlog) ?? undefined}>
						{#snippet leading()}<span class="nav-tile" data-color={aspect.color} aria-hidden="true"><Icon aspect={aspect.icon} size={16} /></span>{/snippet}
					</ListRow>
				</li>
			{/each}
			<li>
				<ListRow chevron href="/aspects" title="All aspects" meta="Add, edit and reorder" value={String(nav.counts.aspects)}>
					{#snippet leading()}<Icon name="aspects" size={20} />{/snippet}
				</ListRow>
			</li>
		</ul>
	</section>
	<section class="card stack" aria-labelledby="hub-lists">
		<h2 class="ruled" id="hub-lists">Lists</h2>
		<ul class="stack" aria-label="Lists">
			{#each lists as item (item.href)}
				<li>
					<ListRow chevron href={item.href} title={item.label} meta={item.meta} value={item.count ?? undefined}>
						{#snippet leading()}<Icon name={item.icon} size={20} />{/snippet}
					</ListRow>
				</li>
			{/each}
			<li>
				<ListRow chevron href="/sync" title="Proton sync" meta={syncText[nav.sync]}>
					{#snippet leading()}<Icon name="sync" size={20} />{/snippet}
					{#snippet action()}
						{#if needs}<span class="hub-mark" role="img" aria-label={copy.nav.needsAttention}><Icon name="alert" size={18} /></span>{/if}
					{/snippet}
				</ListRow>
			</li>
		</ul>
	</section>
</div>

<style>
	.hub > .card {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-5);
		min-inline-size: 0;
	}
	.stack {
		display: grid;
		gap: var(--space-4);
		min-inline-size: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	/* a hub row keeps its count beside the title even in a narrow card (the row primitive drops a value under the title below 22rem) */
	.hub :global(.main) {
		flex-wrap: nowrap;
	}
	.hub :global(.value) {
		flex-basis: auto;
		max-inline-size: 45%;
		text-align: end;
	}
	.hub :global(.title) {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		overflow-wrap: anywhere;
	}
	/* the marker trails the row after its text: a glyph, never colour alone */
	.hub-mark {
		display: grid;
		place-items: center;
		padding-inline: var(--space-2);
		color: var(--danger);
	}
	/* gate 5, Q11: from 1280 px the two groups sit side by side instead of one long column  (the hub is reachable at every width, Rue 2026-11-23) */
	@media (min-width: 1280px) {
		.hub {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
