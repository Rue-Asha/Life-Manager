<!--
	The top bar from 768 px: glass capsule with the charcoal gliding pill on the current link, the "More" menu (Aspects, one link per
	aspect, Projects, Uni, Recurring, Proton sync) and "New todo" as the dark pill. Lifted from the signed hi-fi Frame.
	Below 768 px the pill bar (PillBar.svelte) replaces it. Chrome text is not selectable (app.css); text Rue wrote herself is `data-user`.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { copy } from '$lib/copy';
	import { formatCount, isCurrent, isMoreCurrent, menuNav, navCount, primaryNav, syncNeedsAttention, type NavData } from '$lib/nav';
	import { isQuickAddOpen, openQuickAdd } from '$lib/shell/quick-add.svelte';
	import Button from '../button/Button.svelte';
	import { scrolled, vfade } from './cue';
	import Icon from './Icon.svelte';
	import { pill } from './pill';
	import './shell.css';

	const nav = $derived(page.data.nav as NavData);
	const url = $derived(new URL(page.url.href));
	const needs = $derived(syncNeedsAttention(nav));
	const aspectPath = $derived(nav.aspects.find((a) => page.url.pathname === `/aspects/${a.id}`)?.id);
	const lists = menuNav.filter((item) => item.label !== 'Aspects');

	const uid = $props.id();
	let menu = $state<HTMLElement>();
	let shown = $state(false);

	function toggled(e: Event) {
		shown = (e as ToggleEvent).newState === 'open';
		if (shown) menu?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
	}
	function keys(e: KeyboardEvent) {
		const items = [...(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
		const at = items.indexOf(document.activeElement as HTMLElement);
		const to = e.key === 'ArrowDown' ? at + 1 : e.key === 'ArrowUp' ? at - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : null;
		if (to === null || !items.length) return;
		e.preventDefault();
		items[(to + items.length) % items.length].focus();
	}
</script>

<header class="app-bar" use:scrolled>
	<a class="brand" href="/"><span class="brand-mark" aria-hidden="true">L</span><span class="brand-name">Life</span></a>
	<nav class="nav-landmark" aria-label={copy.nav.main}>
		<div class="app-nav">
		<ul data-pill use:pill>
			{#each primaryNav as item (item.href)}
				{@const count = item.count ? navCount(nav, item.count) : null}
				{@const shownCount = count ? formatCount(count.n) : null}
				<li>
					<a href={item.href} aria-current={isCurrent(item.href, url) ? 'page' : undefined} data-press>
						{item.label}
						{#if shownCount}<span class="nav-count" data-late={count?.late ? '' : undefined}>{#if count?.late}<Icon name="alert" size={12} />{/if}{shownCount}{#if count?.late}<span class="visually-hidden"> overdue</span>{/if}</span>{/if}
					</a>
				</li>
			{/each}
			<li>
				<button type="button" popovertarget="{uid}-more" style:anchor-name="--{uid}-more" aria-haspopup="menu" aria-expanded={shown} aria-current={isMoreCurrent(url) ? 'page' : undefined} data-press>
					{copy.nav.more}
					{#if needs}<span class="nav-mark" role="img" aria-label={copy.nav.needsAttention}><Icon name="alert" size={14} /></span>{/if}
				</button>
			</li>
		</ul>
		</div>
		<div class="app-actions">
			<Button variant="primary" size="s" aria-haspopup="dialog" aria-expanded={isQuickAddOpen()} onclick={(e) => openQuickAdd(e.currentTarget as HTMLElement)}><Icon name="plus" />{copy.nav.newTodo}</Button>
		</div>
	</nav>
	<div class="nav-menu" id="{uid}-more" role="menu" aria-label={copy.nav.more} popover style:position-anchor="--{uid}-more" bind:this={menu} ontoggle={toggled} onkeydown={keys} onclick={(e) => (e.target as HTMLElement).closest('a') && menu?.hidePopover()} tabindex="-1">
		<a class="nav-menu-item" role="menuitem" href="/aspects" aria-current={isCurrent('/aspects', url) ? 'page' : undefined}>
			<span class="grow">Aspects</span>
			<span class="nav-count">{nav.counts.aspects}</span>
		</a>
		<div class="nav-menu-scroll" role="group" aria-label="Aspects" use:vfade>
			{#each nav.aspects as aspect (aspect.id)}
				<a class="nav-menu-item" role="menuitem" data-sub href="/aspects/{aspect.id}" title={aspect.name} aria-current={aspectPath === aspect.id ? 'page' : undefined}>
					<span class="nav-tile" data-color={aspect.color} aria-hidden="true"><Icon aspect={aspect.icon} size={14} /></span>
					<span class="grow" data-user>{aspect.name}</span>
					{#if formatCount(aspect.backlog)}<span class="nav-count">{formatCount(aspect.backlog)}</span>{/if}
				</a>
			{/each}
		</div>
		<div class="nav-menu-foot" role="group" aria-label="Lists">
			<div class="nav-menu-rule" role="separator"></div>
			{#each lists as item (item.href)}
				{@const count = item.count ? formatCount(navCount(nav, item.count).n) : null}
				<a class="nav-menu-item" role="menuitem" href={item.href} aria-current={isCurrent(item.href, url) ? 'page' : undefined}>
					<span class="grow">{item.label}</span>
					{#if item.href === '/sync' && needs}<span class="nav-mark" role="img" aria-label={copy.nav.needsAttention}><Icon name="alert" size={14} /></span>{/if}
					{#if count}<span class="nav-count">{count}</span>{/if}
				</a>
			{/each}
		</div>
	</div>
</header>
