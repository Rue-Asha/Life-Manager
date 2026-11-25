import { describe, expect, it } from 'vitest';
import { formatCount, isCurrent, isMoreCurrent, menuNav, navCount, POSTURE_SWITCH, primaryNav, syncNeedsAttention, WIDE_QUERY, type NavData } from './nav';

const url = (path: string) => new URL(path, 'http://localhost');

const nav = (over: Partial<NavData> = {}): NavData => ({
	counts: { today: 3, overdue: 0, sprint: 5, backlog: 120, recurring: 0, aspects: 2, projects: 1, uni: 0 },
	aspects: [],
	sync: 'idle',
	activeWeekStart: null,
	reviewRequired: false,
	...over
});

describe('nav', () => {
	it('switches posture at 768 px, the one breakpoint', () => {
		expect(POSTURE_SWITCH).toBe(768);
		expect(WIDE_QUERY).toBe('(min-width: 768px)');
	});

	it('formats counts: 0 hidden, 100 and more read 99+', () => {
		expect(formatCount(0)).toBeNull();
		expect(formatCount(1)).toBe('1');
		expect(formatCount(99)).toBe('99');
		expect(formatCount(100)).toBe('99+');
		expect(formatCount(120)).toBe('99+');
	});

	it('lists the primary destinations and the More menu in contract order', () => {
		expect(primaryNav.map((item) => [item.label, item.href])).toEqual([
			['Today', '/'],
			['Sprint', '/sprint'],
			['Backlog', '/backlog'],
			['Calendar', '/calendar']
		]);
		expect(menuNav.map((item) => [item.label, item.href])).toEqual([
			['Aspects', '/aspects'],
			['Projects', '/projects'],
			['Uni', '/uni'],
			['Recurring', '/recurring'],
			['Proton sync', '/sync']
		]);
		expect(primaryNav.find((item) => item.label === 'Calendar')?.count).toBeUndefined();
		expect(menuNav.filter((item) => item.count).map((item) => item.count)).toEqual(['projects', 'uni', 'recurring']);
	});

	it('marks Today only on exactly /', () => {
		expect(isCurrent('/', url('/'))).toBe(true);
		expect(isCurrent('/', url('/sprint'))).toBe(false);
		expect(isCurrent('/', url('/backlog?aspect=2'))).toBe(false);
	});

	it('marks Sprint on its plan and review sub-pages', () => {
		for (const path of ['/sprint', '/sprint?view=week', '/sprint/plan', '/sprint/review']) expect(isCurrent('/sprint', url(path)), path).toBe(true);
		expect(isCurrent('/sprint', url('/sprints'))).toBe(false);
	});

	it('marks Calendar also with ?month=', () => {
		expect(isCurrent('/calendar', url('/calendar?month=2026-12'))).toBe(true);
	});

	it('marks Projects on a project page and Uni on a class page', () => {
		expect(isCurrent('/projects', url('/projects/4'))).toBe(true);
		expect(isCurrent('/uni', url('/uni/classes/7'))).toBe(true);
		expect(isCurrent('/uni', url('/projects'))).toBe(false);
	});

	it('marks the aspect link on its page and not Aspects', () => {
		expect(isCurrent('/aspects/3', url('/aspects/3'))).toBe(true);
		expect(isCurrent('/aspects/3', url('/aspects/30'))).toBe(false);
		expect(isCurrent('/aspects', url('/aspects/3'))).toBe(false);
		expect(isCurrent('/aspects', url('/aspects'))).toBe(true);
	});

	it('marks only the sync entry on /sync', () => {
		const current = [...primaryNav, ...menuNav].filter((item) => isCurrent(item.href, url('/sync')));
		expect(current.map((item) => item.label)).toEqual(['Proton sync']);
	});

	it('marks More on /menu, /welcome and on every route that sits in its menu', () => {
		for (const path of ['/menu', '/aspects', '/aspects/3', '/projects/4', '/uni/classes/7', '/recurring', '/sync', '/welcome']) expect(isMoreCurrent(url(path)), path).toBe(true);
		for (const path of ['/', '/sprint/plan', '/backlog', '/calendar?month=2026-12']) expect(isMoreCurrent(url(path)), path).toBe(false);
	});

	it('shows the overdue count on Today, flagged late, while anything is late', () => {
		expect(navCount(nav(), 'today')).toEqual({ n: 3, late: false });
		expect(navCount(nav({ counts: { ...nav().counts, overdue: 2 } }), 'today')).toEqual({ n: 2, late: true });
		expect(navCount(nav(), 'backlog')).toEqual({ n: 120, late: false });
	});

	it('needs attention only on Re-login needed and Error', () => {
		expect((['off', 'idle', 'syncing', 'relogin', 'error'] as const).filter((sync) => syncNeedsAttention(nav({ sync })))).toEqual(['relogin', 'error']);
	});
});
