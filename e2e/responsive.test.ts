import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock, type SeedInput } from './helpers';

// Sunday 11 October 2026 in Berlin: the sprint of 5–11 October is still running and its review is open.
const SUNDAY = '2026-10-11T10:00:00Z';
const WEEK = '2026-10-05';

test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const ASPECTS: SeedInput['aspects'] = [
	{ name: 'Health', color: 'sage', icon: 'heart' },
	{ name: 'University and exams', color: 'lavender', icon: 'cap' },
	{ name: 'Home', color: 'ochre', icon: 'house' },
	{ name: 'IT', color: 'sky', icon: 'briefcase' }
];

const PROJECTS: SeedInput['projects'] = [
	{
		name: 'A self-hosted weekly planner with an unreasonably long name',
		description: 'Plans the week across several life aspects and keeps the notes next to the todos that belong to them',
		repoUrl: 'https://github.com/rue-asha/a-very-long-repository-name-that-keeps-going',
		tags: ['SvelteKit', 'SQLite', 'TypeScript', 'adapter-node', 'Playwright'],
		notes: '## Plan\n\nhttps://example.com/a/very/long/link/that/should/wrap/instead/of/scrolling/sideways/at/any/width\n\n- one\n- two',
		status: 'active'
	},
	{ name: 'Idea', status: 'backlog' },
	{ name: 'Shipped', status: 'implemented' }
];

// Long titles, every kind of meta and every status: the rows most likely to push a screen wide.
const TODOS: SeedInput['todos'] = [
	{ title: 'Morning run', inSprint: true, day: '2026-10-11', status: 'done' },
	{
		title: 'Draft the cover letter for the summer internship application',
		aspect: 1,
		inSprint: true,
		day: '2026-10-11',
		status: 'doing',
		priority: 1,
		dueDate: '2026-10-12',
		notes: 'Mention the lab project',
		checklist: ['Outline', 'First draft', 'Ask for feedback']
	},
	{ title: 'Gym', rule: 0, inSprint: true, day: '2026-10-08' },
	{ title: 'Clean the fridge', aspect: 2, inSprint: true },
	{ title: 'Pay the electricity bill before the reminder arrives', aspect: 2, dueDate: '2026-10-09', priority: 2 },
	{ title: 'Read chapter 4', aspect: 1, priority: 3 },
	{ title: 'Book a physio appointment' },
	{ title: 'Wire the projects overview into the sidebar navigation', aspect: 3, project: 0, inSprint: true },
	{ title: 'Write the migration', aspect: 3, project: 0 },
	{ title: 'Design the mockup', aspect: 3, project: 0, inSprint: true, status: 'done', completedAt: '2026-10-06T09:00:00Z' },
	{ title: 'Exercise sheet 3: eigenvalues and diagonalisation', aspect: 1, class: 0, type: 'EXC', inSprint: true, day: '2026-10-11', dueDate: '2026-10-13', revisedAt: '2026-10-08' },
	{ title: 'Rewatch the lecture on spectral theory', aspect: 1, class: 0, type: 'LEC', dueDate: '2026-10-09' },
	{ title: 'Prepare the seminar presentation', aspect: 1, class: 1, type: 'OTH', status: 'done', completedAt: '2026-10-07T09:00:00Z' }
];

const SEMESTERS: SeedInput['semesters'] = [
	{ name: 'Winter semester 2026/27 with a long name', createdAt: '2026-10-01T09:00:00Z' },
	{ name: 'Summer semester 2026', archivedAt: '2026-09-30T09:00:00Z', createdAt: '2026-04-01T09:00:00Z' }
];

const CLASSES: SeedInput['classes'] = [
	{
		semester: 0,
		name: 'Linear Algebra and Analytic Geometry for Computer Scientists',
		color: 'lavender',
		icon: 'book',
		lecturer: 'Prof. Dr. Maximiliane Schwarzenberger-Hohenstein',
		room: 'Hörsaal 1 im Hauptgebäude, Erdgeschoss',
		ects: 9,
		links: [{ label: 'Moodle course page', url: 'https://moodle.example.edu/course/view.php?id=123456789&section=a-very-long-section' }],
		examAt: '2027-02-10T09:00',
		examRoom: 'Audimax',
		notes: '## Notes\n\nhttps://example.edu/a/very/long/link/that/should/wrap/instead/of/scrolling/sideways/at/any/width',
		grade: '1.3'
	},
	{ semester: 0, name: 'Seminar', color: 'sky', icon: 'cap', ects: 3 },
	{ semester: 1, name: 'Programming I', color: 'sage', icon: 'briefcase', ects: 6, grade: 'passed' }
];

async function expectFits(page: Page, name: string, shot = true) {
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	const { scrollWidth, clientWidth } = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	const width = page.viewportSize()!.width;
	expect(scrollWidth, `${name} scrolls horizontally at ${width}`).toBeLessThanOrEqual(clientWidth);
	// Nor anything inside it (a busy day column scrolls down, never sideways), except the backlog's
	// aspect filter, a strip of chips meant to be swiped on a phone.
	const sideways = await page.evaluate(() =>
		[...document.querySelectorAll<HTMLElement>('body *')]
			.filter((el) => ['auto', 'scroll'].includes(getComputedStyle(el).overflowX) && el.scrollWidth > el.clientWidth + 1)
			.filter((el) => el.getAttribute('aria-label') !== 'Filter by aspect')
			.map((el) => el.getAttribute('aria-label') ?? el.className)
	);
	expect(sideways, `${name} has sideways scrollers at ${width}`).toEqual([]);
	if (shot) await page.screenshot({ path: `test-results/shots/${name}-${width}.png`, fullPage: true });
}

const seedSunday = (request: Parameters<typeof seed>[0]) =>
	seed(request, {
		aspects: ASPECTS,
		sprint: { state: 'active', weekStart: WEEK },
		rules: [{ title: 'Gym', weekdays: [1, 4], checklist: ['Warm up'] }],
		itAspect: 3,
		uniAspect: 1,
		semesters: SEMESTERS,
		classes: CLASSES,
		projects: PROJECTS,
		todos: TODOS
	});

// Every screen but Welcome and Plan, which need an empty app and a closed review.
const screens = (aspect: number, project: number, cls: number) => [
	['/', 'today'],
	['/sprint?view=aspect', 'sprint-aspect'],
	['/sprint?view=board', 'sprint-board'],
	['/sprint?view=week', 'sprint-week'],
	['/sprint/review', 'review'],
	['/calendar', 'calendar'],
	['/backlog', 'backlog'],
	['/aspects', 'aspects'],
	[`/aspects/${aspect}`, 'aspect-page'],
	['/recurring', 'recurring'],
	['/projects', 'projects'],
	[`/projects/${project}`, 'project-detail'],
	['/uni', 'uni'],
	[`/uni/classes/${cls}`, 'class-detail']
];

test('Scenario: Every screen fits 320 and 390 px without horizontal scroll', async ({ page, request }) => {
	test.setTimeout(240_000);
	await reset(request);
	await page.goto('/welcome');
	for (const width of [320, 390]) {
		await page.setViewportSize({ width, height: 812 });
		await expectFits(page, 'welcome');
	}

	await setClock(request, SUNDAY);
	const { aspects, projects, classes } = await seedSunday(request);
	for (const width of [320, 390]) {
		await page.setViewportSize({ width, height: 812 });
		for (const [path, name] of [...screens(aspects[1], projects[0], classes[0]), ['/menu', 'menu'], ['/sync', 'sync']]) {
			await page.goto(path);
			await expectFits(page, name);
		}

		await page.goto('/sprint');
		await page.getByRole('button', { name: 'Manage', exact: true }).tap();
		await expect(page.getByRole('dialog', { name: 'Backlog' })).toBeVisible();
		await expectFits(page, 'sprint-manage');
	}

	// Planning opens once the review is closed.
	for (const width of [320, 390]) {
		await page.setViewportSize({ width, height: 812 });
		await reset(request);
		await setClock(request, SUNDAY);
		await seedSunday(request);
		await page.goto('/sprint/review');
		await page.getByRole('button', { name: /close/i }).tap();
		await expect(page).toHaveURL(/\/sprint\/plan$/);
		await expectFits(page, 'plan');
	}
});

test.describe('on desktop', () => {
	test.use({ hasTouch: false, isMobile: false });

	const WIDTHS = [768, 1024, 1280, 1600];
	// Only the 1280 shots are kept; the other widths just have to fit.
	const fits = async (page: Page, name: string) => expectFits(page, name, page.viewportSize()!.width === 1280);

	test('Scenario: No screen scrolls horizontally at any width', async ({ page, request }) => {
		test.setTimeout(120_000);
		await reset(request);
		await page.goto('/welcome');
		for (const width of WIDTHS) {
			await page.setViewportSize({ width, height: 800 });
			await fits(page, 'welcome');
		}

		await setClock(request, SUNDAY);
		const { aspects, projects, classes } = await seedSunday(request);
		for (const width of WIDTHS) {
			await page.setViewportSize({ width, height: 800 });
			for (const [path, name] of screens(aspects[1], projects[0], classes[0])) {
				await page.goto(path);
				await fits(page, name);
			}
		}

		// Below 1280 px the backlog is the Manage sheet, not an overlay rail.
		await page.setViewportSize({ width: 1100, height: 800 });
		await page.goto('/sprint');
		await page.getByRole('button', { name: 'Manage', exact: true }).click();
		await expect(page.getByRole('dialog', { name: 'Backlog' })).toBeVisible();
		await expectFits(page, 'sprint-manage');

		await page.goto('/sprint/review');
		await page.getByRole('button', { name: /close/i }).click();
		await expect(page).toHaveURL(/\/sprint\/plan$/);
		for (const width of WIDTHS) {
			await page.setViewportSize({ width, height: 800 });
			await fits(page, 'plan');
		}
	});
});
