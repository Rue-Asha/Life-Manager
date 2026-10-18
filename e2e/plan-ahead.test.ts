import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock } from './helpers';

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
const cell = (page: Page, day: string) => page.getByTestId('calendar-grid').getByTestId(`calendar-cell-${day}`);

async function openCalendar(page: Page) {
	await page.goto('/calendar');
	await expect(page.getByRole('heading', { level: 1, name: 'Calendar' })).toBeVisible();
	await expect(page.getByTestId('context-rail')).toBeAttached();
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
	const planned = page.getByTestId('planned-section');
	await expect(planned.getByRole('heading', { name: 'Planned' })).toBeVisible();
	await expect(planned.getByTestId('todo-row').filter({ hasText: 'Dentist' }).getByTestId('planned-label')).toHaveText(
		'Tue 3 Nov · 18:00–19:30'
	);

	await setClock(request, SUNDAY);
	await page.goto('/sprint/plan');
	await expect(page.getByTestId('plan-week')).toHaveText('Mon 2 – Sun 8 Nov');
	const auto = page.getByTestId('plan-auto');
	await expect(auto.getByRole('heading', { name: 'Joins automatically' })).toBeVisible();
	await expect(auto.getByTestId('todo-row').filter({ hasText: 'Dentist' }).getByTestId('planned-label')).toHaveText(
		'Tue 3 Nov · 18:00–19:30'
	);

	await page.getByRole('button', { name: /^Start sprint/ }).click();
	await expect(page).toHaveURL(/\/sprint$/);
	await page.goto('/sprint?view=week');
	await expect(page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name: 'Week' })).toHaveAttribute(
		'aria-current',
		'page'
	);
	const column = page.getByTestId('day-column-2026-11-03');
	await expect(column.getByTestId('todo-row').filter({ hasText: 'Dentist' })).toHaveCount(1);
	await expect(column.getByTestId('todo-row').filter({ hasText: 'Dentist' })).toContainText('18:00–19:30');
});

test('Scenario: Todo edited from the calendar leaves its day', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', aspect: 0, day: '2026-10-21' }] });
	await openCalendar(page);

	await expect(cell(page, '2026-10-21').getByTestId('calendar-entry')).toHaveCount(1);
	await cell(page, '2026-10-21').click();
	const list = page.getByTestId('calendar-day-list');
	await list.getByTestId('calendar-entry').getByRole('button', { name: 'Dentist' }).click();
	await expect(editor(page)).toBeVisible();

	await editor(page).getByLabel('Planned', { exact: true }).fill('2026-10-23');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);

	await expect(cell(page, '2026-10-21').getByTestId('calendar-entry')).toHaveCount(0);
	await expect(list.getByText('Dentist')).toHaveCount(0);
	await expect(cell(page, '2026-10-23').getByTestId('calendar-entry')).toHaveCount(1);
	await expect(cell(page, '2026-10-23')).toContainText('Dentist');
});
