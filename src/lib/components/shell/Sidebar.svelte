<script lang="ts" module>
	import type { Aspect } from '../../types';
	import type { UiIcon } from '../ui/icons';

	export type NavCount = 'today' | 'sprint' | 'backlog' | 'recurring' | 'aspects';

	export interface NavData {
		counts: Record<NavCount | 'overdue', number>;
		aspects: (Aspect & { backlog: number })[];
	}

	export const NAV_ITEMS: { label: string; href: string; icon: UiIcon; count: NavCount }[] = [
		{ label: 'Today', href: '/', icon: 'sun', count: 'today' },
		{ label: 'Sprint', href: '/sprint', icon: 'calendar-days', count: 'sprint' },
		{ label: 'Backlog', href: '/backlog', icon: 'inbox', count: 'backlog' },
		{ label: 'Recurring', href: '/recurring', icon: 'repeat', count: 'recurring' },
		{ label: 'Aspects', href: '/aspects', icon: 'layers', count: 'aspects' }
	];

	export function isCurrent(href: string, pathname: string) {
		return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
	}

	// Today shows its overdue count instead of its own, in red, while anything is late.
	export function navCount(nav: NavData, key: NavCount): { n: number; late: boolean } {
		if (key === 'today' && nav.counts.overdue > 0) return { n: nav.counts.overdue, late: true };
		return { n: nav.counts[key], late: false };
	}
</script>

<script lang="ts">
	import { page } from '$app/state';
	import AspectIcon from '../ui/AspectIcon.svelte';
	import { UI_ICONS } from '../ui/icons';

	const nav = $derived(page.data.nav as NavData);
</script>

<nav aria-label="Main">
	<a class="brand" href="/">Life Manager</a>
	{#each NAV_ITEMS as item (item.href)}
		{@const count = navCount(nav, item.count)}
		<a
			class="item"
			href={item.href}
			aria-current={isCurrent(item.href, page.url.pathname) ? 'page' : undefined}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS[item.icon]} /></svg>
			{item.label}
			{#if count.n > 0}<span class="count num" class:late={count.late} aria-hidden="true">{count.n}</span>{/if}
		</a>
	{/each}
	{#if nav.aspects.length > 0}
		<ul aria-label="Aspects">
			{#each nav.aspects as aspect (aspect.id)}
				<li>
					<a class="item" href="/backlog?aspect={aspect.id}">
						<AspectIcon icon={aspect.icon} color={aspect.color} />
						<span class="name">{aspect.name}</span>
						{#if aspect.backlog > 0}<span class="count num" aria-hidden="true">{aspect.backlog}</span>{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</nav>

<style>
	nav {
		position: sticky;
		top: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-0);
		height: 100dvh;
		overflow-y: auto;
		padding: var(--space-5) var(--space-3);
		background: var(--paper-sunk);
	}

	.brand {
		padding: 0 var(--space-3) var(--space-5);
		color: var(--ink);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-title);
		text-decoration: none;
	}

	.item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		height: var(--control-height);
		padding: 0 var(--space-3);
		border-radius: var(--radius-md);
		color: var(--ink);
		text-decoration: none;
	}

	.item:hover {
		background: var(--paper-hover);
	}

	.item[aria-current='page'] {
		background: var(--paper);
		font-weight: var(--weight-medium);
	}

	.name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.count {
		margin-left: auto;
		color: var(--ink-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
	}

	.count.late {
		color: var(--overdue);
		font-weight: var(--weight-semibold);
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: var(--space-0);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	svg {
		width: var(--icon-md);
		height: var(--icon-md);
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		color: var(--ink-2);
	}

	.item[aria-current='page'] svg {
		color: var(--accent);
	}
</style>
