import { expect, test, reset, seed, setClock, dayColumn, todoRow, todoRows, type SeedInput } from './helpers';
import { backlogRail, boardColumn } from './sprint-locators';
import { chooseDay, chooseStatus, statusOf } from './row-locators';

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

test('Scenario: Touch-only device completes the sprint ritual', async ({ page, request }) => {
	await reset(request);
	await setClock(request, '2026-10-07T10:00:00Z');
	await seed(request, {
		aspects: ASPECTS,
		todos: [{ title: 'Book a physio appointment' }, { title: 'Read chapter 4', aspect: 1 }, { title: 'Clean the fridge', aspect: 2 }]
	});
	const row = (title: string) => todoRow(page, title);
	const days = page.getByRole('navigation', { name: 'Days' });

	await page.goto('/sprint/plan');
	await expect(page.locator('[draggable="true"]')).toHaveCount(0);
	await page.getByRole('button', { name: 'Add to sprint: Book a physio appointment' }).tap();
	await page.getByRole('button', { name: 'Add to sprint: Read chapter 4' }).tap();
	await expect(todoRows(page.getByRole('region', { name: /^This sprint/ }))).toHaveCount(2);
	await page.getByRole('button', { name: 'Start sprint with 2 todos' }).tap();
	await expect(page).toHaveURL(/\/sprint$/);

	// Board: the card's "More actions" menu holds the Status group; the card has no status glyph.
	await page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name: 'Board' }).tap();
	await expect(page).toHaveURL(/view=board$/);
	await expect(page.locator('[draggable="true"]')).toHaveCount(0);
	await chooseStatus(page, row('Read chapter 4'), 'Doing');
	await page.getByRole('group', { name: 'Column' }).getByRole('button', { name: /^Doing/ }).tap();
	await expect(boardColumn(page, 'doing')).toContainText('Read chapter 4');

	// Week: one day at a time; the day changes through the todo's "More actions" menu.
	await page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name: 'Week' }).tap();
	await expect(page).toHaveURL(/view=week$/);
	await expect(page.locator('[draggable="true"]')).toHaveCount(0);
	await days.getByRole('button', { name: /^Unscheduled/ }).tap();
	await chooseDay(page, row('Book a physio appointment'), 'Thu 8');
	await days.getByRole('button', { name: /^Thu 8/ }).tap();
	await expect(dayColumn(page, '2026-10-08')).toContainText('Book a physio appointment');
	await chooseStatus(page, row('Book a physio appointment'), 'Done');
	await expect(statusOf(row('Book a physio appointment'), 'Done')).toBeVisible();

	await setClock(request, '2026-10-11T16:00:00Z');
	await page.goto('/sprint/review');
	await page.getByRole('radiogroup', { name: 'Read chapter 4' }).getByRole('radio', { name: 'Back to backlog' }).check();
	await expect(page.locator('#hr-summary')).toContainText('Return 1 and close');
	await page.getByRole('button', { name: 'Close sprint', exact: true }).tap();
	await expect(page).toHaveURL(/\/sprint\/plan$/);
	await expect(todoRows(backlogRail(page))).toHaveText([/Read chapter 4/, /Clean the fridge/]);
	await expect(todoRows(page.getByRole('region', { name: /^This sprint/ }))).toHaveCount(0);
});
