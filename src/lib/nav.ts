import type { SyncState } from './server/proton/types';
import type { Aspect, IsoDate } from './types';

// The top bar shows from here, the pill bar below.
export const POSTURE_SWITCH = 768;
export const WIDE_QUERY = `(min-width: ${POSTURE_SWITCH}px)`;

export type NavCount = 'today' | 'sprint' | 'backlog' | 'recurring' | 'aspects' | 'projects' | 'uni';

export interface NavData {
	counts: Record<NavCount | 'overdue', number>;
	aspects: (Aspect & { backlog: number })[];
	sync: SyncState;
	activeWeekStart: IsoDate | null;
	reviewRequired: boolean;
}

export interface NavItem {
	label: string;
	href: string;
	count?: NavCount;
}

export const primaryNav: NavItem[] = [
	{ label: 'Today', href: '/', count: 'today' },
	{ label: 'Sprint', href: '/sprint', count: 'sprint' },
	{ label: 'Backlog', href: '/backlog', count: 'backlog' },
	{ label: 'Calendar', href: '/calendar' }
];

// The aspects follow Aspects, one link each, with their backlog counts.
export const menuNav: NavItem[] = [
	{ label: 'Aspects', href: '/aspects' },
	{ label: 'Projects', href: '/projects', count: 'projects' },
	{ label: 'Uni', href: '/uni', count: 'uni' },
	{ label: 'Recurring', href: '/recurring', count: 'recurring' },
	{ label: 'Proton sync', href: '/sync' }
];

export function formatCount(n: number): string | null {
	if (n <= 0) return null;
	return n >= 100 ? '99+' : String(n);
}

// On an aspect page its own link is current, not Aspects; Today only on exactly /.
export function isCurrent(href: string, url: URL): boolean {
	const path = url.pathname;
	if (href === '/' || href === '/aspects') return path === href;
	return path === href || path.startsWith(`${href}/`);
}

// /welcome is reached from the More hub once aspects exist, so More stays current there (as signed).
export function isMoreCurrent(url: URL): boolean {
	return url.pathname === '/menu' || url.pathname === '/welcome' || url.pathname.startsWith('/aspects/') || menuNav.some((item) => isCurrent(item.href, url));
}

// Today shows its overdue count instead of its own, flagged late, while anything is late.
export function navCount(nav: NavData, key: NavCount): { n: number; late: boolean } {
	if (key === 'today' && nav.counts.overdue > 0) return { n: nav.counts.overdue, late: true };
	return { n: nav.counts[key], late: false };
}

export function syncNeedsAttention(nav: NavData): boolean {
	return nav.sync === 'relogin' || nav.sync === 'error';
}
