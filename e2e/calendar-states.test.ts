import type { Page } from '@playwright/test';
import { calendarCell, dayListEntries, expect, reset, seed, setClock, test } from './helpers';

// Tuesday 17 November 2026 in Berlin; 1 November 2026 is a Sunday.
const TUESDAY = '2026-11-17T10:00:00Z';
const HEALTH = { name: 'Health', color: 'sage', icon: 'heart' } as const;
const UNI = { name: 'Uni', color: 'lavender', icon: 'book' } as const;

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, TUESDAY);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const grid = (page: Page) => page.getByRole('group', { name: 'Month grid' });
const dayList = (page: Page) => page.getByRole('region', { name: /^\w{3} \d+ \w{3}$/ });
// Accepted visual coupling (contract section 8): a visible span holding a mark is a title line, the aria-hidden mark group holds the phone marks.
const titles = (cell: ReturnType<typeof calendarCell>) => cell.locator('span:has(> i):visible');
const marks = (cell: ReturnType<typeof calendarCell>) => cell.locator('[aria-hidden="true"] > i:visible');

async function open(page: Page, path = '/calendar?month=2026-11') {
	await page.goto(path);
	await expect(page.getByRole('heading', { level: 1, name: 'Calendar' })).toBeVisible();
}

const exam = { semester: 0, name: 'Analysis', examAt: '2026-11-12T10:00', examRoom: 'H1' };
const withExam = { aspects: [HEALTH, UNI], uniAspect: 1, semesters: [{ name: 'WS 26/27' }], classes: [exam] };

test('Scenario: Phone shows marks and the day list below the month', async ({ page, request }) => {
	await seed(request, { ...withExam, todos: [{ title: 'Dentist', day: '2026-11-12', startTime: '09:00' }] });
	await page.setViewportSize({ width: 375, height: 800 });
	await open(page);
	await calendarCell(page, '2026-11-12').click();

	const cell = calendarCell(page, '2026-11-12');
	await expect(cell).toHaveAttribute('aria-pressed', 'true');
	await expect(marks(cell)).toHaveCount(2);
	await expect(marks(cell).nth(0)).toHaveCSS('border-top-left-radius', /[1-9]/);
	await expect(marks(cell).nth(1)).toHaveCSS('border-top-left-radius', '0px');
	await expect(cell.getByText('Dentist')).toBeHidden();
	const list = dayList(page);
	await expect(dayListEntries(list)).toHaveCount(2);
	await expect(list).toContainText('Dentist');
	await expect(list).toContainText('Exam · H1');
	const month = (await grid(page).boundingBox())!;
	const below = (await list.boundingBox())!;
	expect(below.y).toBeGreaterThanOrEqual(month.y + month.height);
	const box = (await cell.boundingBox())!;
	expect(box.width).toBeGreaterThanOrEqual(44);
});

test('Scenario: Desktop shows titles in cells and a side day list', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', day: '2026-11-12' }] });
	await page.setViewportSize({ width: 1280, height: 900 });
	await open(page);

	await expect(titles(calendarCell(page, '2026-11-12'))).toHaveText(['Dentist']);
	await calendarCell(page, '2026-11-12').click();
	const month = (await grid(page).boundingBox())!;
	const list = (await dayList(page).boundingBox())!;
	expect(list.x).toBeGreaterThanOrEqual(month.x + month.width);
	await expect(page.getByRole('complementary', { name: 'Day list', includeHidden: true })).toHaveCount(0);
});

test('Scenario: Calendar entries open the editor or their link', async ({ page, request }) => {
	const { rules, classes } = await seed(request, {
		...withExam,
		rules: [{ title: 'Gym', weekdays: [4] }],
		todos: [{ title: 'Dentist', day: '2026-11-19' }]
	});
	await page.setViewportSize({ width: 1280, height: 900 });
	await open(page);
	await calendarCell(page, '2026-11-19').click();
	await dayList(page).getByRole('button', { name: 'Dentist' }).click();
	await expect(page.getByRole('form', { name: 'Edit todo' }).getByRole('textbox', { name: 'Title' })).toHaveValue('Dentist');
	await page.keyboard.press('Escape');

	await dayList(page).getByRole('link', { name: /Gym/ }).click();
	await expect(page).toHaveURL(new RegExp(`/recurring#rule-${rules[0]}$`));

	await open(page);
	await calendarCell(page, '2026-11-12').click();
	await dayList(page).getByRole('link', { name: /Analysis/ }).click();
	await expect(page).toHaveURL(new RegExp(`/uni/classes/${classes[0]}$`));
});

test('Scenario: Busy day and empty day', async ({ page, request }) => {
	const busy = Array.from({ length: 9 }, (_, i) => ({ title: `Entry ${i + 1}`, day: '2026-11-18', ...(i % 2 ? { startTime: '14:00', endTime: '15:00' } : {}) }));
	await seed(request, { aspects: [HEALTH], todos: busy });
	await page.setViewportSize({ width: 1280, height: 900 });
	await open(page);

	const cell = calendarCell(page, '2026-11-18');
	await expect(titles(cell)).toHaveCount(2);
	await expect(cell).toContainText('+7 more');
	const quiet = (await calendarCell(page, '2026-11-20').boundingBox())!;
	expect((await cell.boundingBox())!.height).toBeCloseTo(quiet.height, 0);
	await cell.click();
	await expect(dayListEntries(dayList(page))).toHaveCount(9);

	await calendarCell(page, '2026-11-20').click();
	await expect(dayList(page)).toContainText('Nothing planned');
});

test('Scenario: Month starting on Sunday and today marked', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH] });
	await page.setViewportSize({ width: 1280, height: 900 });
	await open(page);

	const cells = grid(page).getByRole('button');
	await expect(cells.first()).toHaveAccessibleName(/^Mon 26 Oct\b/);
	await expect(cells.first()).toBeDisabled();
	await expect(cells.nth(6)).toHaveAccessibleName(/^Sun 1 Nov\b/);
	await expect(cells.nth(6)).toBeEnabled();
	await expect(calendarCell(page, '2026-11-17')).toHaveAttribute('aria-current', 'date');
	await expect(page.getByRole('list', { name: 'This month' })).toContainText('November');
});

test('day panel scrolls inside its card and says More below when cut', async ({ page, request }) => {
	const many = Array.from({ length: 14 }, (_, i) => ({ title: `Entry ${i + 1}`, day: '2026-11-17' }));
	await seed(request, { aspects: [HEALTH], todos: many });
	await page.setViewportSize({ width: 1280, height: 800 });
	await open(page);

	const panel = dayList(page);
	await expect(panel.getByText('More below')).toBeVisible();
	const box = (await panel.boundingBox())!;
	expect(box.height).toBeLessThanOrEqual(800);
	await panel.getByRole('listitem').last().scrollIntoViewIfNeeded();
	await expect(panel.getByText('More below')).toBeHidden();
});
