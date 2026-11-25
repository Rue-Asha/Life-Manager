import type { Locator, Page } from '@playwright/test';
import { calendarCell, dayListEntries, expect, ruleRow, test, reset, seed, setClock, tokenColor } from './helpers';

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

const cell = calendarCell;
const head = (page: Page) => page.getByRole('navigation', { name: 'Month', exact: true });
const monthHeading = (page: Page, name: string) => page.getByRole('heading', { level: 2, name, exact: true });
const due = (scope: Page | Locator) => scope.getByRole('img', { name: / due$/ });
const dueGroup = (scope: Locator) => scope.getByRole('group', { name: 'Due', exact: true });
// Accepted visual coupling (contract section 8, item 2): marks are the aria-hidden group's <i>, a title line is a visible span holding a mark.
const dots = (cell: Locator) => cell.locator('[aria-hidden="true"] > i:visible');
const titleLines = (cell: Locator) => cell.locator('span:has(> i):visible');
const grid = (page: Page) => page.getByRole('group', { name: 'Month grid' });
const dayList = (scope: Page | Locator) => scope.getByRole('region', { name: /^\w{3} \d+ \w{3}$/ });

async function openCalendar(page: Page, path = '/calendar') {
	await page.goto(path);
	await expect(page.getByRole('heading', { level: 1, name: 'Calendar' })).toBeVisible();
}

test('Scenario: Calendar opens on the current month', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH] });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page);

	const cells = grid(page).getByRole('button');
	await expect(cells).toHaveCount(35);
	await expect(cells.first()).toHaveAccessibleName(/^Mon 28 Sept?\b/);
	await expect(cells.last()).toHaveAccessibleName(/^Sun 1 Nov\b/);
	for (const day of ['2026-09-28', '2026-09-29', '2026-09-30', '2026-11-01']) {
		await expect(cell(page, day)).toBeDisabled();
	}
	await expect(cell(page, '2026-10-01')).toBeEnabled();
	await expect(monthHeading(page, 'October 2026')).toBeVisible();
});

test('Scenario: Month navigation and deep link', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH] });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page);

	await head(page).getByRole('link', { name: 'Next month' }).click();
	await expect(page).toHaveURL(/\/calendar\?month=2026-11$/);
	await expect(monthHeading(page, 'November 2026')).toBeVisible();

	await head(page).getByRole('link', { name: 'Previous month' }).click();
	await expect(page).toHaveURL(/\?month=2026-10$/);
	await head(page).getByRole('link', { name: 'Previous month' }).click();
	await expect(page).toHaveURL(/\?month=2026-09$/);
	await expect(monthHeading(page, 'September 2026')).toBeVisible();

	await head(page).getByRole('link', { name: 'Today' }).click();
	await expect(page).toHaveURL(/\?month=2026-10$/);
	await expect(monthHeading(page, 'October 2026')).toBeVisible();
	await expect(cell(page, '2026-10-14')).toHaveAttribute('aria-pressed', 'true');

	await openCalendar(page, '/calendar?month=2027-02');
	await expect(monthHeading(page, 'February 2027')).toBeVisible();
	await expect(cell(page, '2027-02-01')).toBeVisible();
});

test('Scenario: Invalid month parameter shows the current month', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH] });
	await page.setViewportSize({ width: 1280, height: 900 });
	for (const param of ['2026-13', 'foo']) {
		await openCalendar(page, `/calendar?month=${param}`);
		await expect(monthHeading(page, 'October 2026')).toBeVisible();
		await expect(cell(page, '2026-10-14')).toBeVisible();
	}
});

test('Scenario: Calendar names the aspect and marks projections', async ({ page, request }) => {
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

	const yoga = titleLines(cell(page, '2026-10-21'));
	await expect(yoga).toHaveText(/Yoga/);
	await expect(yoga.locator('i')).toHaveCSS('border-top-left-radius', /[1-9]/);
	await cell(page, '2026-10-21').click();
	await expect(dayListEntries(dayList(page))).toContainText('18:00 · Health');

	const done = titleLines(cell(page, '2026-10-13'));
	await expect(done.getByText('Filed taxes')).not.toHaveCSS('text-decoration-line', /line-through/);
	await expect(done.getByText('Filed taxes')).toHaveCSS('color', await tokenColor(page, '--ink-secondary'));
	await expect(yoga.getByText('Yoga')).not.toHaveCSS('color', await tokenColor(page, '--ink-secondary'));

	const gym = titleLines(cell(page, '2026-10-15'));
	await expect(gym).toContainText('Gym');
	await expect(gym.locator('i')).toHaveCSS('border-top-width', /[1-9]/);
	await cell(page, '2026-10-15').click();
	await expect(dayList(page)).toContainText('Projected');

	await expect(grid(page).getByText('Pay invoice')).toHaveCount(0);
	await expect(due(cell(page, '2026-10-22'))).toHaveText(/^1\s*due$/);
});

test('Scenario: Recurring rule with a slot shows in later months', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], rules: [{ title: 'Gym', weekdays: [2], startTime: '18:00', endTime: '19:30' }] });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page, '/calendar?month=2027-01');

	for (const day of ['2027-01-05', '2027-01-12', '2027-01-19', '2027-01-26']) {
		await expect(titleLines(cell(page, day))).toContainText('Gym');
	}
	await cell(page, '2027-01-12').click();
	const entry = dayListEntries(dayList(page));
	await expect(entry).toHaveCount(1);
	await expect(entry).toContainText('Gym');
	await expect(entry).toContainText('18:00–19:30');
	await expect(entry.getByRole('link', { name: /Gym/ })).toBeVisible();
	await expect(entry).toContainText('Projected');
});

function five() {
	return ['Dentist', 'Haircut', 'Tax form', 'Call mum', 'Buy stamps'].map((title, i) => ({
		title,
		day: '2026-10-21',
		startTime: `1${i}:00`
	}));
}

test('Scenario: Wide cells show up to two titles', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: five() });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page);
	await cell(page, '2026-10-21').click();
	await expect(cell(page, '2026-10-21')).toHaveAttribute('aria-pressed', 'true');

	await expect(titleLines(cell(page, '2026-10-21'))).toHaveCount(2);
	await expect(cell(page, '2026-10-21')).toContainText('+3 more');
	await expect(dayListEntries(dayList(page))).toHaveCount(5);

	const gridBox = (await grid(page).boundingBox())!;
	const listBox = (await dayList(page).boundingBox())!;
	expect(listBox.x).toBeGreaterThanOrEqual(gridBox.x + gridBox.width);
});

test('Scenario: Day list follows the month below 1024', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', day: '2026-10-21' }] });
	for (const width of [900, 1100]) {
		await page.setViewportSize({ width, height: 900 });
		await openCalendar(page);
		await cell(page, '2026-10-21').click();

		await expect(page.getByRole('complementary', { name: 'Day list', includeHidden: true })).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Day list', exact: true, includeHidden: true })).toHaveCount(0);
		const month = (await grid(page).boundingBox())!;
		const list = (await dayList(page).boundingBox())!;
		if (width < 1024) expect(list.y).toBeGreaterThanOrEqual(month.y + month.height);
		else expect(list.x).toBeGreaterThanOrEqual(month.x + month.width);
		await expect(dayListEntries(dayList(page))).toContainText('Dentist');
	}
});

test('Scenario: Empty month shows Nothing planned', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH] });
	for (const width of [375, 1280]) {
		await page.setViewportSize({ width, height: 900 });
		await openCalendar(page);
		await expect(grid(page)).toBeVisible();
		await expect(dayList(page)).toContainText('Nothing planned');
	}
});

test("Scenario: Phone shows marks and the selected day's list", async ({ page, request }) => {
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
	await expect(dots(today)).toHaveCount(3);
	await expect(today).toContainText('+');
	await expect(today.locator('span:visible', { hasText: /Standup|Lunch|Groceries/ })).toHaveCount(0);
	await expect(dots(cell(page, '2026-10-16'))).toHaveCount(1);

	const list = dayList(page);
	await expect(dayListEntries(list)).toHaveCount(5);
	await expect(list).toContainText('09:00–09:15');
	await expect(list).toContainText('12:30');
	await expect(list).toContainText('all day');
	await expect(list).toContainText('Standup');

	await cell(page, '2026-10-16').click();
	await expect(cell(page, '2026-10-16')).toHaveAttribute('aria-pressed', 'true');
	await expect(dayListEntries(list)).toHaveCount(1);
	await expect(list).toContainText('Pay rent');

	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
	expect(overflow).toBeLessThanOrEqual(0);
});

test('Scenario: Selected day defaults to the 1st in another month', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Advent brunch', day: '2026-12-01' }] });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page, '/calendar?month=2026-12');

	await expect(cell(page, '2026-12-01')).toHaveAttribute('aria-pressed', 'true');
	await expect(dayList(page)).toContainText('Advent brunch');
});

test('Scenario: Todo entry opens the editor', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', day: '2026-10-21', startTime: '09:00' }] });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page);
	await cell(page, '2026-10-21').click();

	await dayListEntries(dayList(page)).getByRole('button', { name: 'Dentist' }).click();
	await expect(page.getByRole('form', { name: 'Edit todo' }).getByRole('textbox', { name: 'Title' })).toHaveValue('Dentist');
});

test('Scenario: Projected occurrence links to its rule', async ({ page, request }) => {
	const { rules } = await seed(request, { aspects: [HEALTH], rules: [{ title: 'Gym', weekdays: [4] }] });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page);
	await cell(page, '2026-10-15').click();

	await dayList(page).getByRole('link', { name: /Gym/ }).click();
	await expect(page).toHaveURL(new RegExp(`/recurring#rule-${rules[0]}$`));
	await expect(ruleRow(page, 'Gym')).toHaveAttribute('id', `rule-${rules[0]}`);
	await expect(ruleRow(page, 'Gym')).toBeVisible();
});

test('Scenario: Exam links to its class', async ({ page, request }) => {
	const { classes } = await seed(request, {
		aspects: [HEALTH, { name: 'Uni', color: 'lavender', icon: 'book' }],
		uniAspect: 1,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis', examAt: '2026-10-20T10:00', examRoom: 'H1' }]
	});
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page);
	await cell(page, '2026-10-20').click();

	await dayList(page).getByRole('link', { name: /Analysis/ }).click();
	await expect(page).toHaveURL(new RegExp(`/uni/classes/${classes[0]}$`));
	await expect(page.getByRole('heading', { level: 1, name: 'Analysis' })).toBeVisible();
});

test('Scenario: Due todos show as marker and Due section', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH, JOB],
		todos: [
			...five(),
			{ title: 'File taxes', dueDate: '2026-10-21' },
			{ title: 'Send report', aspect: 1, dueDate: '2026-10-21' },
			{ title: 'Paid rent', dueDate: '2026-10-21', status: 'done' },
			{ title: 'Overdue form', dueDate: '2026-10-05' }
		]
	});
	await page.setViewportSize({ width: 1280, height: 900 });
	await openCalendar(page);
	await cell(page, '2026-10-21').click();
	await expect(cell(page, '2026-10-21')).toHaveAttribute('aria-pressed', 'true');

	await expect(titleLines(cell(page, '2026-10-21'))).toHaveCount(2);
	await expect(cell(page, '2026-10-21')).toContainText('+3 more');
	await expect(due(cell(page, '2026-10-21'))).toHaveText(/^2\s*due$/);
	await expect(due(cell(page, '2026-10-05'))).toHaveText(/^1\s*due$/);
	await expect(due(cell(page, '2026-10-22'))).toHaveCount(0);

	const list = dayList(page);
	const dueList = dueGroup(list);
	await expect(dueList.getByRole('listitem')).toHaveCount(2);
	await expect(dueList).toContainText('File taxes');
	await expect(dueList).toContainText('Health');
	await expect(dueList).toContainText('Send report');
	await expect(dueList).toContainText('Job');
	await expect(dueList).not.toContainText('Paid rent');
	const dueBox = (await dueList.boundingBox())!;
	const firstEntry = (await dayListEntries(list).first().boundingBox())!;
	expect(dueBox.y + dueBox.height).toBeLessThanOrEqual(firstEntry.y);

	await cell(page, '2026-10-22').click();
	await expect(dueGroup(list)).toHaveCount(0);

	await page.setViewportSize({ width: 375, height: 800 });
	await openCalendar(page);
	await cell(page, '2026-10-21').click();
	await expect(due(cell(page, '2026-10-21'))).toHaveText(/^2\s*due$/);
	await expect(due(cell(page, '2026-10-22'))).toHaveCount(0);
	await expect(dueGroup(list)).toContainText('Send report');
	await expect(dueGroup(list)).toContainText('Job');
	const phoneDue = (await dueGroup(list).boundingBox())!;
	const phoneEntry = (await dayListEntries(list).first().boundingBox())!;
	expect(phoneDue.y + phoneDue.height).toBeLessThanOrEqual(phoneEntry.y);
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
	expect(overflow).toBeLessThanOrEqual(0);

	await reset(request);
	await setClock(request, WEDNESDAY);
	await seed(request, { aspects: [HEALTH], todos: [...five(), { title: 'Paid rent', dueDate: '2026-10-21', status: 'done' }] });
	await openCalendar(page);
	await cell(page, '2026-10-21').click();
	await expect(cell(page, '2026-10-21')).toHaveAttribute('aria-pressed', 'true');
	await expect(due(grid(page))).toHaveCount(0);
	await expect(dueGroup(list)).toHaveCount(0);
});

test('Scenario: Deadline-only day shows Due without empty text', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'File taxes', dueDate: '2026-10-21' }] });
	for (const width of [375, 1280]) {
		await page.setViewportSize({ width, height: 900 });
		await openCalendar(page);
		await cell(page, '2026-10-21').click();
		await expect(cell(page, '2026-10-21')).toHaveAttribute('aria-pressed', 'true');
		await expect(due(cell(page, '2026-10-21'))).toHaveText(/^1\s*due$/);
		const list = dayList(page);
		await expect(dueGroup(list)).toContainText('File taxes');
		await expect(list).not.toContainText('Nothing planned');
		await expect(dayListEntries(list)).toHaveCount(0);
	}
});
