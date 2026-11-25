<!--
	The pill bar below 768 px: glass pill group with the charcoal pill gliding to the current tab, and the detached round "+"
	("New todo"). Hidden and inert while a text field has focus (cue.ts), sticky above the safe area. Icon-only below 360 px
	(fingerprint dock). Lifted from the signed hi-fi Dock.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { copy } from '$lib/copy';
	import { isCurrent, isMoreCurrent, primaryNav, syncNeedsAttention, type NavData } from '$lib/nav';
	import { isQuickAddOpen, openQuickAdd } from '$lib/shell/quick-add.svelte';
	import { hideOnType } from './cue';
	import Icon, { type IconName } from './Icon.svelte';
	import { pill } from './pill';
	import './shell.css';

	const nav = $derived(page.data.nav as NavData);
	const url = $derived(new URL(page.url.href));
	const needs = $derived(syncNeedsAttention(nav));
	const icons: Record<string, IconName> = { '/': 'today', '/sprint': 'sprint', '/backlog': 'backlog', '/calendar': 'calendar' };
	const tabs = $derived([
		...primaryNav.map((item) => ({ label: item.label, href: item.href, icon: icons[item.href], current: isCurrent(item.href, url) })),
		{ label: copy.nav.more, href: '/menu', icon: 'more' as IconName, current: isMoreCurrent(url) }
	]);

	// iOS only shows :active when something listens for touchstart
	const touch = (_node: HTMLElement) => {
		const noop = () => {};
		document.addEventListener('touchstart', noop, { passive: true });
		return { destroy: () => document.removeEventListener('touchstart', noop) };
	};
</script>

<nav class="dock" aria-label={copy.nav.main} use:hideOnType use:touch>
	<ul class="dock-tabs" data-pill use:pill>
		{#each tabs as tab (tab.href)}
			<li>
				<a href={tab.href} aria-current={tab.current ? 'page' : undefined} data-press>
					<Icon name={tab.icon} size={20} /><span>{tab.label}</span>
					{#if tab.href === '/menu' && needs}<span class="dock-dot" role="img" aria-label={copy.nav.needsAttention}><Icon name="alert" size={10} /></span>{/if}
				</a>
			</li>
		{/each}
	</ul>
	<button type="button" class="dock-add" aria-label={copy.nav.newTodo} aria-haspopup="dialog" aria-expanded={isQuickAddOpen()} data-press="round" data-focus="halo" onclick={(e) => openQuickAdd(e.currentTarget)}>
		<Icon name="plus" size={24} />
	</button>
</nav>
