<script lang="ts" module>
	import type { Aspect } from '../../types';
	import type { SyncState } from '../../server/proton/types';
	import type { UiIcon } from '../ui/icons';

	export type NavCount = 'today' | 'sprint' | 'backlog' | 'recurring' | 'aspects' | 'projects' | 'uni';

	export interface NavData {
		counts: Record<NavCount | 'overdue', number>;
		aspects: (Aspect & { backlog: number })[];
		sync: SyncState;
	}

	export const NAV_ITEMS: { label: string; href: string; icon: UiIcon; count?: NavCount }[] = [
		{ label: 'Today', href: '/', icon: 'sun', count: 'today' },
		{ label: 'Sprint', href: '/sprint', icon: 'calendar-days', count: 'sprint' },
		{ label: 'Calendar', href: '/calendar', icon: 'calendar' },
		{ label: 'Backlog', href: '/backlog', icon: 'inbox', count: 'backlog' },
		{ label: 'Recurring', href: '/recurring', icon: 'repeat', count: 'recurring' },
		{ label: 'Projects', href: '/projects', icon: 'folder', count: 'projects' },
		{ label: 'Uni', href: '/uni', icon: 'graduation-cap', count: 'uni' },
		{ label: 'Aspects', href: '/aspects', icon: 'layers', count: 'aspects' }
	];

	export function syncNeedsAttention(nav: NavData) {
		return nav.sync === 'relogin' || nav.sync === 'error';
	}

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
	import { ASPECT_COLORS, ASPECT_ICONS } from '../../aspect-style';
	import QuickAdd from '../todo/QuickAdd.svelte';
	import { UI_ICONS } from '../ui/icons';

	const nav = $derived(page.data.nav as NavData);
	// On an aspect's page its own link is the current one, not Aspects as well.
	const aspectHref = $derived(nav.aspects.map((a) => `/aspects/${a.id}`).find((h) => h === page.url.pathname));

	let adding = $state(false);
</script>

<nav aria-label="Main">
	<a class="brand" href="/">
		<span class="logo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.check} /></svg></span>Life Manager
	</a>
	{#if nav.aspects.length > 0}
		<button type="button" class="new" onclick={() => (adding = true)}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>New todo
		</button>
	{/if}
	{#each NAV_ITEMS as item (item.href)}
		{@const count = item.count ? navCount(nav, item.count) : null}
		<a
			class="item"
			href={item.href}
			aria-current={isCurrent(item.href, page.url.pathname) && !aspectHref ? 'page' : undefined}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS[item.icon]} /></svg>
			{item.label}
			{#if count && count.n > 0}<span class="count num" class:late={count.late} aria-hidden="true">{count.n}</span>{/if}
		</a>
	{/each}
	{#if nav.aspects.length > 0}
		<ul aria-label="Aspects">
			{#each nav.aspects as aspect (aspect.id)}
				<li>
					<a
						class="item"
						href="/aspects/{aspect.id}"
						aria-current={aspectHref === `/aspects/${aspect.id}` ? 'page' : undefined}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true" style:color={ASPECT_COLORS[aspect.color].bright}>
							<path d={ASPECT_ICONS[aspect.icon]} />
						</svg>
						<span class="name">{aspect.name}</span>
						{#if aspect.backlog > 0}<span class="count num" aria-hidden="true">{aspect.backlog}</span>{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
	<a
		class="item sync"
		href="/sync"
		data-testid="sync-link"
		aria-current={isCurrent('/sync', page.url.pathname) ? 'page' : undefined}
	>
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['refresh-cw']} /></svg>
		Proton sync
		{#if syncNeedsAttention(nav)}<span class="marker" data-testid="sync-marker" role="img" aria-label="Needs attention"></span>{/if}
	</a>
</nav>

{#if nav.aspects.length > 0}
	<QuickAdd aspects={nav.aspects} target={{ kind: 'backlog' }} variant="dialog" bind:open={adding} />
{/if}

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
		background: var(--chrome);
		color: var(--on-chrome);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0 var(--space-2) var(--space-4);
		color: var(--on-chrome);
		font-weight: var(--weight-bold);
		letter-spacing: -0.01em;
		text-decoration: none;
	}

	.logo {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: var(--radius-sm);
		background: var(--accent);
		color: var(--ink-on-accent);
	}

	.logo svg {
		width: 14px;
		height: 14px;
		color: inherit;
		stroke-width: 2.5;
	}

	.new {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		height: 40px;
		margin-bottom: var(--space-4);
		border: 0;
		border-radius: var(--radius-md);
		background: var(--accent);
		color: var(--ink-on-accent);
		font-size: 14px;
		font-weight: var(--weight-semibold);
		cursor: pointer;
		transition: background-color var(--dur-fast) var(--ease-out);
	}

	.new:hover {
		background: var(--accent-hover);
	}

	.new svg {
		color: inherit;
	}

	.item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		height: var(--control-height);
		padding: 0 var(--space-3);
		border-radius: 8px;
		color: var(--on-chrome);
		font-size: 14px;
		text-decoration: none;
	}

	.item:hover {
		background: var(--chrome-hover);
	}

	.item[aria-current='page'] {
		background: var(--chrome-hover);
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
		color: var(--on-chrome-2);
		font-size: var(--text-xs);
		font-weight: var(--weight-regular);
	}

	.count.late {
		color: var(--overdue-on-chrome);
		font-weight: var(--weight-semibold);
	}

	/* Aspects are the setup list, so a hairline and a label set them apart from the lists. */
	ul {
		display: flex;
		flex-direction: column;
		gap: var(--space-0);
		margin: var(--space-3) 0 0;
		padding: var(--space-3) 0 0;
		border-top: 1px solid var(--chrome-hover);
		list-style: none;
	}

	ul::before {
		content: 'Aspects' / '';
		padding: var(--space-1) var(--space-3) var(--space-1);
		color: var(--on-chrome-2);
		font-size: var(--text-xs);
	}

	.sync {
		margin-top: var(--space-3);
	}

	.marker {
		width: 8px;
		height: 8px;
		margin-left: auto;
		border-radius: 50%;
		background: var(--overdue-on-chrome);
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
		color: var(--on-chrome-2);
	}

	.item[aria-current='page'] svg {
		color: var(--on-chrome);
	}
</style>
