import { expect, test, type Page } from '@playwright/test';
import { reset, seed, setClock, type SeedInput } from './helpers';

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
	{ name: 'Home', color: 'ochre', icon: 'house' }
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
	{ title: 'Book a physio appointment' }
];

async function expectFits(page: Page, name: string) {
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	const { scrollWidth, clientWidth } = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	expect(scrollWidth, `${name} scrolls horizontally`).toBeLessThanOrEqual(clientWidth);
	await page.screenshot({ path: `test-results/shots/${name}-375.png`, fullPage: true });
}

test('Scenario: Every screen fits 375 px without horizontal scroll', async ({ page, request }) => {
	await reset(request);
	await page.goto('/welcome');
	await expectFits(page, 'welcome');

	await setClock(request, SUNDAY);
	await seed(request, {
		aspects: ASPECTS,
		sprint: { state: 'active', weekStart: WEEK },
		rules: [{ title: 'Gym', weekdays: [1, 4], checklist: ['Warm up'] }],
		todos: TODOS
	});
	for (const [path, name] of [
		['/', 'today'],
		['/sprint?view=aspect', 'sprint-aspect'],
		['/sprint?view=board', 'sprint-board'],
		['/sprint?view=week', 'sprint-week'],
		['/sprint/review', 'review'],
		['/backlog', 'backlog'],
		['/aspects', 'aspects'],
		['/recurring', 'recurring']
	]) {
		await page.goto(path);
		await expectFits(page, name);
	}

	// Planning opens once the review is closed.
	await page.goto('/sprint/review');
	await page.getByRole('button', { name: /close/i }).tap();
	await expect(page).toHaveURL(/\/sprint\/plan$/);
	await expectFits(page, 'plan');
});

test('Scenario: Phone home list drills into each list', async ({ page, request }) => {
	await reset(request);
	await seed(request, { aspects: ASPECTS });
	await page.goto('/menu');

	for (const [name, path] of [
		['Today', '/'],
		['Sprint', '/sprint'],
		['Backlog', '/backlog'],
		['Recurring', '/recurring'],
		['Aspects', '/aspects']
	]) {
		await page.getByRole('navigation', { name: 'Lists' }).getByRole('link', { name, exact: true }).tap();
		await expect.poll(() => new URL(page.url()).pathname).toBe(path);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
		await page.getByRole('link', { name: 'Lists' }).tap();
		await expect(page).toHaveURL(/\/menu$/);
	}
});

test('Scenario: Touch-only device completes the sprint ritual', async ({ page, request }) => {
	await reset(request);
	await setClock(request, '2026-10-07T10:00:00Z');
	await seed(request, {
		aspects: ASPECTS,
		todos: [{ title: 'Book a physio appointment' }, { title: 'Read chapter 4', aspect: 1 }, { title: 'Clean the fridge', aspect: 2 }]
	});
	const row = (title: string) => page.getByTestId('todo-row').filter({ hasText: title });

	await page.goto('/sprint/plan');
	await expect(page.locator('[draggable="true"]')).toHaveCount(0);
	await page.getByRole('button', { name: 'Add to sprint: Book a physio appointment' }).tap();
	await page.getByRole('button', { name: 'Add to sprint: Read chapter 4' }).tap();
	await expect(page.getByTestId('plan-sprint').getByTestId('todo-row')).toHaveCount(2);
	await page.getByRole('button', { name: 'Start sprint with 2 todos' }).tap();
	await expect(page).toHaveURL(/\/sprint$/);

	await page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name: 'Board' }).tap();
	await expect(page).toHaveURL(/view=board$/);
	await expect(page.locator('[draggable="true"]')).toHaveCount(0);
	await row('Read chapter 4').getByLabel('Status').selectOption('doing');
	await expect(page.getByTestId('board-column-doing')).toContainText('Read chapter 4');

	await page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name: 'Week' }).tap();
	await expect(page).toHaveURL(/view=week$/);
	await expect(page.locator('[draggable="true"]')).toHaveCount(0);
	await page.getByRole('navigation', { name: 'Days' }).getByRole('button', { name: 'Unscheduled' }).tap();
	await row('Book a physio appointment').getByLabel('Day').selectOption({ label: 'Thu 8' });
	await page.getByRole('navigation', { name: 'Days' }).getByRole('button', { name: 'Thu 8' }).tap();
	await expect(page.getByTestId('day-column-2026-10-08')).toContainText('Book a physio appointment');
	await page.getByRole('checkbox', { name: 'Done: Book a physio appointment' }).tap();
	await expect(row('Book a physio appointment')).toHaveAttribute('data-status', 'done');

	await setClock(request, '2026-10-11T16:00:00Z');
	await page.goto('/sprint/review');
	await page.getByRole('radiogroup', { name: 'Read chapter 4' }).getByText('Back to backlog').tap();
	await page.getByRole('button', { name: 'Return 1 and close' }).tap();
	await expect(page).toHaveURL(/\/sprint\/plan$/);
	await expect(page.getByTestId('plan-backlog').getByTestId('todo-row')).toHaveText([/Read chapter 4/, /Clean the fridge/]);
	await expect(page.getByTestId('plan-sprint').getByTestId('todo-row')).toHaveCount(0);
});
