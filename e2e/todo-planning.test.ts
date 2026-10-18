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

const THURSDAY = '2026-10-15T10:00:00Z';
const WEEK = '2026-10-12';
const ASPECTS = [HEALTH, { name: 'Uni', color: 'lavender', icon: 'cap' }] as const;

const rowOf = (scope: ReturnType<Page['getByTestId']> | Page, title: string) =>
	scope.getByTestId('todo-row').filter({ hasText: title });

test('Scenario: Backlog and aspect rows show the planned date and slot', async ({ page, request }) => {
	const ids = await seed(request, {
		aspects: [HEALTH],
		todos: [{ title: 'Dentist', aspect: 0, day: '2026-10-27', startTime: '18:00', endTime: '19:30', dueDate: '2026-10-30' }]
	});

	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();
	const backlogRow = rowOf(page, 'Dentist');
	await expect(backlogRow.getByTestId('planned-label')).toHaveText('Tue 27 Oct · 18:00–19:30');
	await expect(backlogRow).toContainText('16d left');

	await page.goto(`/aspects/${ids.aspects[0]}`);
	await expect(page.getByRole('heading', { level: 1, name: 'Health' })).toBeVisible();
	const aspectRow = rowOf(page.getByTestId('aspect-backlog'), 'Dentist');
	await expect(aspectRow.getByTestId('planned-label')).toHaveText('Tue 27 Oct · 18:00–19:30');
	await expect(aspectRow).toContainText('16d left');
});

test('Scenario: Unplanned row shows only its due label', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', aspect: 0, dueDate: '2026-10-30' }] });

	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();
	const backlogRow = rowOf(page, 'Dentist');
	await expect(backlogRow).toContainText('16d left');
	await expect(backlogRow.getByTestId('planned-label')).toHaveCount(0);
});

test('Scenario: Board card shows the planned date and slot', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{
				title: 'Dentist',
				aspect: 0,
				inSprint: true,
				day: '2026-10-15',
				startTime: '18:00',
				endTime: '19:30',
				dueDate: '2026-10-16'
			}
		]
	});

	await page.goto('/sprint?view=board');
	const card = page.getByTestId('board-column-todo').getByTestId('sprint-card').filter({ hasText: 'Dentist' });
	await expect(card.getByTestId('planned-label')).toHaveText('Thu 15 Oct · 18:00–19:30');
	await expect(card).toContainText('2d left');
});

test('Regression: saving a due-dated sprint todo plans it on its due day', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Dentist', aspect: 0, inSprint: true, dueDate: '2026-10-16' },
			{ title: 'Laundry', aspect: 0, inSprint: true, dueDate: '2026-10-14' }
		]
	});

	await page.goto('/sprint?view=board');
	const card = page.getByTestId('board-column-todo').getByTestId('sprint-card').filter({ hasText: 'Dentist' });
	await expect(card).toContainText('2d left');
	await expect(card.getByTestId('planned-label')).toHaveCount(0);
	await card.getByRole('button', { name: 'Dentist', exact: true }).click();
	await expect(editor(page).getByLabel('Planned', { exact: true })).toHaveValue('');
	await editor(page).getByRole('textbox', { name: 'Title' }).fill('Dentist visit');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);

	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await rowOf(page, 'Laundry').getByRole('button', { name: 'Laundry', exact: true }).click();
	await expect(editor(page).getByLabel('Planned', { exact: true })).toHaveValue('');
	await editor(page).getByRole('textbox', { name: 'Title' }).fill('Laundry run');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);

	await page.goto('/sprint?view=week');
	await expect(page.getByTestId('day-column-2026-10-16')).toContainText('Dentist visit');
	await expect(page.getByTestId('day-column-2026-10-14')).toContainText('Laundry run');
	await page.goto('/calendar');
	await expect(page.getByRole('heading', { level: 1, name: 'Calendar' })).toBeVisible();
	for (const day of ['2026-10-14', '2026-10-16']) {
		await expect(page.getByTestId(`calendar-cell-${day}`).getByTestId('calendar-entry')).toHaveCount(0);
	}
});

test('Scenario: Week cards show only the slot', async ({ page, request }) => {
	await setClock(request, THURSDAY);
	await seed(request, {
		aspects: [HEALTH],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Dentist', aspect: 0, inSprint: true, day: '2026-10-15', startTime: '18:00', endTime: '19:30' },
			{ title: 'Laundry', aspect: 0, inSprint: true, day: '2026-10-15' }
		]
	});

	for (const width of [1440, 375]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/sprint?view=week');
		const column = page.getByTestId('day-column-2026-10-15');
		const slotted = column.getByTestId('sprint-card').filter({ hasText: 'Dentist' });
		const plain = column.getByTestId('sprint-card').filter({ hasText: 'Laundry' });
		await expect(slotted.getByTestId('planned-label')).toHaveText('18:00–19:30');
		await expect(plain).toBeVisible();
		await expect(plain.getByTestId('planned-label')).toHaveCount(0);
		if (width === 1440) {
			for (const card of [slotted, plain]) {
				expect((await card.boundingBox())!.height).toBeLessThanOrEqual(40);
			}
		}
	}
});

test('Scenario: Sprint row shows the slot next to its day', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Dentist', aspect: 0, inSprint: true, day: '2026-10-14', startTime: '18:00', endTime: '19:30' }]
	});

	await page.goto('/sprint?view=aspect');
	const sprintRow = rowOf(page, 'Dentist');
	await expect(sprintRow.getByRole('combobox', { name: 'Day' })).toHaveValue('2026-10-14');
	await expect(sprintRow.getByTestId('planned-label')).toHaveText('18:00–19:30');

	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(rowOf(page, 'Dentist').getByTestId('planned-label')).toHaveText('18:00–19:30');
});

test('Scenario: Planned labels do not scroll the phone sideways', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Dentist', aspect: 0, inSprint: true, day: '2026-10-14', startTime: '18:00', endTime: '19:30', dueDate: '2026-10-30' },
			{ title: 'Taxes', aspect: 0, day: '2026-10-27', startTime: '18:00', endTime: '19:30', dueDate: '2026-10-30' }
		]
	});
	await page.setViewportSize({ width: 375, height: 800 });

	for (const path of ['/', '/backlog', '/sprint?view=aspect', '/sprint?view=board', '/sprint?view=week']) {
		await page.goto(path);
		await expect(page.getByTestId('planned-label').first()).toBeVisible();
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
		expect(overflow, path).toBeLessThanOrEqual(0);
	}
});
