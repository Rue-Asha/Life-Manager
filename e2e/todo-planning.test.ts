import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock } from './helpers';

// Wednesday 14 October 2026 in Berlin.
const WEDNESDAY = '2026-10-14T10:00:00Z';
const HEALTH = { name: 'Health', color: 'sage', icon: 'heart' } as const;

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await setClock(request, WEDNESDAY);
	await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const editor = (page: Page) => page.getByRole('form', { name: 'Edit todo' });

async function openEditor(page: Page, title: string) {
	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();
	await page.getByRole('button', { name: title, exact: true }).click();
	await expect(editor(page)).toBeVisible();
}

test('Scenario: Plan a backlog todo three weeks out with a slot', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', aspect: 0 }] });
	await openEditor(page, 'Dentist');

	await editor(page).getByLabel('Planned', { exact: true }).fill('2026-11-03');
	await editor(page).getByLabel('From', { exact: true }).fill('18:00');
	await editor(page).getByLabel('To', { exact: true }).fill('19:30');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);

	await page.reload();
	await page.getByRole('button', { name: 'Dentist', exact: true }).click();
	await expect(editor(page).getByLabel('Planned', { exact: true })).toHaveValue('2026-11-03');
	await expect(editor(page).getByLabel('From', { exact: true })).toHaveValue('18:00');
	await expect(editor(page).getByLabel('To', { exact: true })).toHaveValue('19:30');
	await expect(page.getByTestId('todo-row').filter({ hasText: 'Dentist' })).toHaveCount(1);
	await expect(page).toHaveURL(/\/backlog$/);
});

test('Scenario: Editor clears the times with the date', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH],
		todos: [{ title: 'Dentist', aspect: 0, day: '2026-11-03', startTime: '18:00', endTime: '19:30' }]
	});
	await openEditor(page, 'Dentist');
	await expect(editor(page).getByLabel('From', { exact: true })).toHaveValue('18:00');

	await editor(page).getByLabel('Planned', { exact: true }).fill('');
	await expect(editor(page).getByLabel('From', { exact: true })).toHaveValue('');
	await expect(editor(page).getByLabel('To', { exact: true })).toHaveValue('');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);

	await page.reload();
	const row = page.getByTestId('todo-row').filter({ hasText: 'Dentist' });
	await expect(row.getByTestId('planned-label')).toHaveCount(0);
	await row.getByRole('button', { name: 'Dentist', exact: true }).click();
	await expect(editor(page).getByLabel('Planned', { exact: true })).toHaveValue('');
	await expect(editor(page).getByLabel('From', { exact: true })).toHaveValue('');
	await expect(editor(page).getByLabel('To', { exact: true })).toHaveValue('');
});

test('Scenario: Editor shows the past-date message', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', aspect: 0 }] });
	await openEditor(page, 'Dentist');

	await editor(page).getByLabel('Planned', { exact: true }).fill('2026-10-13');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page).getByRole('alert')).toBeVisible();
	await expect(editor(page)).toBeVisible();

	await page.reload();
	await page.getByRole('button', { name: 'Dentist', exact: true }).click();
	await expect(editor(page).getByLabel('Planned', { exact: true })).toHaveValue('');
});

test('Scenario: Clearing the start clears the end in the editor', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH],
		todos: [{ title: 'Dentist', aspect: 0, day: '2026-11-03', startTime: '18:00', endTime: '19:30' }]
	});
	await openEditor(page, 'Dentist');

	await editor(page).getByLabel('From', { exact: true }).fill('');
	await expect(editor(page).getByLabel('To', { exact: true })).toHaveValue('');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);

	await page.reload();
	await page.getByRole('button', { name: 'Dentist', exact: true }).click();
	await expect(editor(page).getByLabel('Planned', { exact: true })).toHaveValue('2026-11-03');
	await expect(editor(page).getByLabel('From', { exact: true })).toHaveValue('');
	await expect(editor(page).getByLabel('To', { exact: true })).toHaveValue('');
});
