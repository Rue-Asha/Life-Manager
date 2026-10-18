import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock } from './helpers';

// Wednesday 14 October 2026 in Berlin.
const WEDNESDAY = '2026-10-14T10:00:00Z';

const HEALTH = { name: 'Health', color: 'sage', icon: 'heart' } as const;
const JOB = { name: 'Job', color: 'sky', icon: 'briefcase' } as const;

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, WEDNESDAY);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const cell = (page: Page, day: string) => page.getByTestId(`calendar-cell-${day}`);
const head = (page: Page) => page.getByTestId('calendar-head');

async function openCalendar(page: Page, path = '/calendar') {
	await page.goto(path);
	await expect(page.getByRole('heading', { level: 1, name: 'Calendar' })).toBeVisible();
	if ((page.viewportSize()?.width ?? 0) >= 768) await expect(page.getByTestId('context-rail')).toBeAttached();
}

test('Scenario: Calendar opens on the current month', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH] });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page);

	const cells = page.getByTestId('calendar-grid').locator('[data-testid^="calendar-cell-"]');
	await expect(cells).toHaveCount(35);
	await expect(cells.first()).toHaveAttribute('data-testid', 'calendar-cell-2026-09-28');
	await expect(cells.last()).toHaveAttribute('data-testid', 'calendar-cell-2026-11-01');
	for (const day of ['2026-09-28', '2026-09-29', '2026-09-30', '2026-11-01']) {
		await expect(cell(page, day)).toHaveAttribute('data-outside', 'true');
	}
	await expect(cell(page, '2026-10-01')).toHaveAttribute('data-outside', 'false');
	await expect(page.getByTestId('calendar-month')).toHaveText('October 2026');
});

test('Scenario: Month navigation and deep link', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH] });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page);

	await head(page).getByRole('link', { name: 'Next month' }).click();
	await expect(page).toHaveURL(/\/calendar\?month=2026-11$/);
	await expect(page.getByTestId('calendar-month')).toHaveText('November 2026');

	await head(page).getByRole('link', { name: 'Previous month' }).click();
	await expect(page).toHaveURL(/\?month=2026-10$/);
	await head(page).getByRole('link', { name: 'Previous month' }).click();
	await expect(page).toHaveURL(/\?month=2026-09$/);
	await expect(page.getByTestId('calendar-month')).toHaveText('September 2026');

	await head(page).getByRole('link', { name: 'Today' }).click();
	await expect(page).toHaveURL(/\?month=2026-10$/);
	await expect(page.getByTestId('calendar-month')).toHaveText('October 2026');
	await expect(cell(page, '2026-10-14')).toHaveAttribute('aria-pressed', 'true');

	await openCalendar(page, '/calendar?month=2027-02');
	await expect(page.getByTestId('calendar-month')).toHaveText('February 2027');
	await expect(cell(page, '2027-02-01')).toBeVisible();
});

test('Scenario: Invalid month parameter shows the current month', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH] });
	await page.setViewportSize({ width: 1280, height: 900 });
	for (const param of ['2026-13', 'foo']) {
		await openCalendar(page, `/calendar?month=${param}`);
		await expect(page.getByTestId('calendar-month')).toHaveText('October 2026');
		await expect(cell(page, '2026-10-14')).toBeVisible();
	}
});

test('Scenario: Calendar shows aspect colours and marks projections', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH, JOB],
		rules: [{ title: 'Gym', weekdays: [4] }],
		todos: [
			{ title: 'Yoga', day: '2026-10-21', startTime: '18:00' },
			{ title: 'Filed taxes', day: '2026-10-13', status: 'done' },
			{ title: 'Pay invoice', aspect: 1, dueDate: '2026-10-22' }
		]
	});
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page);

	const yoga = cell(page, '2026-10-21').getByTestId('calendar-entry');
	await expect(yoga).toHaveText(/Yoga/);
	const sage = await page.evaluate(() => {
		const probe = document.createElement('i');
		probe.style.color = 'var(--aspect-sage)';
		document.body.append(probe);
		const color = getComputedStyle(probe).color;
		probe.remove();
		return color;
	});
	await expect(yoga.getByTestId('calendar-entry-mark')).toHaveCSS('background-color', sage);

	const done = cell(page, '2026-10-13').getByTestId('calendar-entry');
	await expect(done.getByText('Filed taxes')).toHaveCSS('text-decoration-line', 'line-through');

	const gym = cell(page, '2026-10-15').getByTestId('calendar-entry');
	await expect(gym).toHaveAttribute('data-kind', 'projection');
	await expect(gym).toContainText('Gym');
	await expect(gym).toContainText('Projected');

	await expect(page.getByTestId('calendar-grid').getByText('Pay invoice')).toHaveCount(0);
});

test('Scenario: Recurring rule with a slot shows in later months', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], rules: [{ title: 'Gym', weekdays: [2], startTime: '18:00', endTime: '19:30' }] });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page, '/calendar?month=2027-01');

	for (const day of ['2027-01-05', '2027-01-12', '2027-01-19', '2027-01-26']) {
		await expect(cell(page, day).getByTestId('calendar-entry')).toContainText('Gym');
	}
	await cell(page, '2027-01-12').click();
	const entry = page.getByTestId('calendar-day-list').getByTestId('calendar-entry');
	await expect(entry).toHaveCount(1);
	await expect(entry).toContainText('Gym');
	await expect(entry).toContainText('18:00–19:30');
	await expect(entry).toHaveAttribute('data-kind', 'projection');
	await expect(entry).toContainText('Projected');
});

function five() {
	return ['Dentist', 'Haircut', 'Tax form', 'Call mum', 'Buy stamps'].map((title, i) => ({
		title,
		day: '2026-10-21',
		startTime: `1${i}:00`
	}));
}

test('Scenario: Wide cells show up to three titles', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: five() });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page);
	await cell(page, '2026-10-21').click();
	await expect(cell(page, '2026-10-21')).toHaveAttribute('aria-pressed', 'true');

	await expect(cell(page, '2026-10-21').getByTestId('calendar-entry')).toHaveCount(3);
	await expect(cell(page, '2026-10-21')).toContainText('+2 more');
	await expect(page.getByTestId('calendar-day-list').getByTestId('calendar-entry')).toHaveCount(5);

	const { grid, rail, sidebar } = await page.evaluate(() => {
		const box = (el: Element | null) => el!.getBoundingClientRect();
		return {
			grid: box(document.querySelector('[data-testid="calendar-grid"]')),
			rail: box(document.querySelector('[data-testid="context-rail"]')),
			sidebar: box(document.querySelector('main')!.previousElementSibling)
		};
	});
	expect(grid.width).toBeGreaterThanOrEqual(rail.left - sidebar.right - 80);
	expect(grid.left - sidebar.right).toBeLessThanOrEqual(40);
	expect(rail.left - grid.right).toBeLessThanOrEqual(40);
	expect(rail.left - grid.right).toBeGreaterThanOrEqual(0);
});

test('Scenario: Day list in the rail overlay below 1280', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', day: '2026-10-21' }] });
	await page.setViewportSize({ width: 1100, height: 900 });
	await openCalendar(page);
	await cell(page, '2026-10-21').click();

	const rail = page.getByTestId('context-rail');
	await expect(rail).toBeHidden();
	expect(await rail.evaluate((el) => getComputedStyle(el).position)).toBe('fixed');
	await page.getByTestId('rail-toggle').click();
	await expect(rail).toBeVisible();
	await expect(rail.getByTestId('calendar-day-list').getByTestId('calendar-entry')).toContainText('Dentist');
});

test('Scenario: Empty month shows Nothing planned', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH] });
	for (const width of [375, 1280]) {
		await page.setViewportSize({ width, height: 900 });
		await openCalendar(page);
		await expect(page.getByTestId('calendar-grid')).toBeVisible();
		await expect(page.getByTestId('calendar-day-list')).toContainText('Nothing planned');
	}
});

test("Scenario: Phone shows dots and the selected day's list", async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH, JOB],
		todos: [
			{ title: 'Standup', aspect: 1, day: '2026-10-14', startTime: '09:00', endTime: '09:15' },
			{ title: 'Lunch', day: '2026-10-14', startTime: '12:30' },
			{ title: 'Groceries', day: '2026-10-14' },
			{ title: 'Call dentist', day: '2026-10-14' },
			{ title: 'Read', aspect: 1, day: '2026-10-14', startTime: '21:00' },
			{ title: 'Pay rent', day: '2026-10-16' }
		]
	});
	await page.setViewportSize({ width: 375, height: 800 });
	await openCalendar(page);

	const today = cell(page, '2026-10-14');
	await expect(today).toHaveAttribute('aria-pressed', 'true');
	await expect(today.getByTestId('calendar-dot')).toHaveCount(3);
	await expect(today).toContainText('+');
	await expect(today.getByTestId('calendar-entry')).toHaveCount(0);
	await expect(cell(page, '2026-10-16').getByTestId('calendar-dot')).toHaveCount(1);

	const list = page.getByTestId('calendar-day-list');
	await expect(list.getByTestId('calendar-entry')).toHaveCount(5);
	await expect(list).toContainText('09:00–09:15');
	await expect(list).toContainText('12:30');
	await expect(list).toContainText('all day');
	await expect(list).toContainText('Standup');

	await cell(page, '2026-10-16').click();
	await expect(cell(page, '2026-10-16')).toHaveAttribute('aria-pressed', 'true');
	await expect(list.getByTestId('calendar-entry')).toHaveCount(1);
	await expect(list).toContainText('Pay rent');

	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
	expect(overflow).toBeLessThanOrEqual(0);
});

test('Scenario: Selected day defaults to the 1st in another month', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Advent brunch', day: '2026-12-01' }] });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page, '/calendar?month=2026-12');

	await expect(cell(page, '2026-12-01')).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByTestId('calendar-day-list')).toContainText('Advent brunch');
});
