import type { Page } from '@playwright/test';
import { calendarCell, dayColumn, expect, test, reset, seed, setClock, todoRow, todoRows } from './helpers';

// Wednesday 14 October 2026 in Berlin.
const WEDNESDAY = '2026-10-14T10:00:00Z';
// Sunday 1 November 2026 in Berlin; the sprint to plan runs Monday 2 to Sunday 8 November.
const SUNDAY = '2026-11-01T10:00:00Z';

const HEALTH = { name: 'Health', color: 'sage', icon: 'heart' } as const;

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await setClock(request, WEDNESDAY);
	await page.setViewportSize({ width: 1280, height: 900 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const editor = (page: Page) => page.getByRole('form', { name: 'Edit todo' });
const cell = calendarCell;

async function openCalendar(page: Page) {
	await page.goto('/calendar');
	await expect(page.getByRole('heading', { level: 1, name: 'Calendar' })).toBeVisible();
	await expect(page.getByRole('region', { name: /^\w{3} \d+ \w{3}$/ })).toBeAttached();
}

test('Scenario: Planned todo travels to its day in the Week view', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', aspect: 0 }] });

	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();
	await page.getByRole('button', { name: 'Dentist', exact: true }).click();
	await expect(editor(page)).toBeVisible();
	await editor(page).getByLabel('Planned', { exact: true }).fill('2026-11-03');
	await editor(page).getByLabel('From', { exact: true }).fill('18:00');
	await editor(page).getByLabel('To', { exact: true }).fill('19:30');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);

	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();
	const planned = page.getByRole('region', { name: /^Planned\b/ });
	await expect(planned.getByRole('heading', { name: 'Planned' })).toBeVisible();
	await expect(todoRow(planned, 'Dentist').getByText('Tue 3 Nov · 18:00–19:30', { exact: true })).toBeVisible();

	await setClock(request, SUNDAY);
	await page.goto('/sprint/plan');
	await expect(page.getByText('Mon 2 – Sun 8 Nov', { exact: true })).toBeVisible();
	const auto = page.getByRole('region', { name: /^Joins automatically\b/ });
	await expect(auto.getByRole('heading', { name: 'Joins automatically' })).toBeVisible();
	await expect(todoRow(auto, 'Dentist').getByText('Tue 3 Nov · 18:00–19:30', { exact: true })).toBeVisible();

	await page.getByRole('button', { name: /^Start sprint/ }).click();
	await expect(page).toHaveURL(/\/sprint$/);
	await page.goto('/sprint?view=week');
	await expect(page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name: 'Week' })).toHaveAttribute(
		'aria-current',
		'page'
	);
	const column = dayColumn(page, '2026-11-03');
	await expect(todoRow(column, 'Dentist')).toHaveCount(1);
	// A week chip shows the start of the slot only.
	await expect(todoRow(column, 'Dentist').getByRole('time')).toHaveText('18:00');
});

test('Scenario: Todo edited from the calendar leaves its day', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', aspect: 0, day: '2026-10-21' }] });
	await openCalendar(page);

	await expect(cell(page, '2026-10-21').getByText('Dentist')).toHaveCount(1);
	await cell(page, '2026-10-21').click();
	const list = page.getByRole('region', { name: /21 Oct/ });
	await list.getByRole('button', { name: 'Dentist' }).click();
	await expect(editor(page)).toBeVisible();

	await editor(page).getByLabel('Planned', { exact: true }).fill('2026-10-23');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);

	await expect(cell(page, '2026-10-21').getByText('Dentist')).toHaveCount(0);
	await expect(list.getByRole('heading', { name: /21 Oct/ })).toBeVisible();
	await expect(list.getByText('Dentist')).toHaveCount(0);
	await expect(cell(page, '2026-10-23').getByText('Dentist')).toHaveCount(1);
	await expect(cell(page, '2026-10-23')).toContainText('Dentist');
});
