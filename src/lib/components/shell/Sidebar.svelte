<script lang="ts" module>
	import type { UiIcon } from '../ui/icons';

	export const NAV_ITEMS: { label: string; href: string; icon: UiIcon }[] = [
		{ label: 'Today', href: '/', icon: 'sun' },
		{ label: 'Sprint', href: '/sprint', icon: 'calendar-days' },
		{ label: 'Backlog', href: '/backlog', icon: 'inbox' },
		{ label: 'Recurring', href: '/recurring', icon: 'repeat' },
		{ label: 'Aspects', href: '/aspects', icon: 'layers' }
	];

	export function isCurrent(href: string, pathname: string) {
		return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
	}
</script>

<script lang="ts">
	import { page } from '$app/state';
	import { UI_ICONS } from '../ui/icons';
</script>

<nav aria-label="Main">
	<a class="brand" href="/">Life Manager</a>
	{#each NAV_ITEMS as item (item.href)}
		<a
			class="item"
			href={item.href}
			aria-current={isCurrent(item.href, page.url.pathname) ? 'page' : undefined}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS[item.icon]} /></svg>
			{item.label}
		</a>
	{/each}
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
