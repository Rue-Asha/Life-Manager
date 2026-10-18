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
	await expect(editor(page).getByLabel('From', { exact: true })).toHaveCount(0);
	await expect(editor(page).getByLabel('To', { exact: true })).toHaveCount(0);
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);

	await page.reload();
	const row = page.getByTestId('todo-row').filter({ hasText: 'Dentist' });
	await expect(row.getByTestId('planned-label')).toHaveCount(0);
	await row.getByRole('button', { name: 'Dentist', exact: true }).click();
	await expect(editor(page).getByLabel('Planned', { exact: true })).toHaveValue('');
	await editor(page).getByLabel('Planned', { exact: true }).fill('2026-11-03');
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

test('Scenario: Editor shows the recurring-outside-week message', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH],
		sprint: { state: 'active', weekStart: '2026-10-12' },
		rules: [{ title: 'Gym', aspect: 0, weekdays: [4], startTime: '18:00' }],
		todos: [{ title: 'Gym', aspect: 0, inSprint: true, rule: 0, day: '2026-10-15', startTime: '18:00' }]
	});
	await page.goto('/sprint?view=aspect');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await page.getByTestId('todo-row').filter({ hasText: 'Gym' }).getByRole('button', { name: 'Gym', exact: true }).click();

	await editor(page).getByLabel('Planned', { exact: true }).fill('2026-10-22');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page).getByRole('alert')).toHaveText('A recurring todo stays in its sprint’s week. Pick a day of that week.');
	await expect(editor(page)).toBeVisible();

	await page.reload();
	await expect(page.getByTestId('todo-row').filter({ hasText: 'Gym' })).toHaveAttribute('data-day', '2026-10-15');
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

test('Scenario: Board card shows the whole planned label at 1440 with sidebar and rail', async ({ page, request }) => {
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
				endTime: '19:00',
				dueDate: '2026-10-16',
				priority: 1
			}
		]
	});
	await page.setViewportSize({ width: 1440, height: 900 });

	await page.goto('/sprint?view=board');
	await expect(page.getByTestId('context-rail')).toBeVisible();
	const card = page.getByTestId('board-column-todo').getByTestId('sprint-card').filter({ hasText: 'Dentist' });
	const label = card.getByTestId('planned-label');
	await expect(label).toHaveText('Thu 15 Oct · 18:00–19:00');
	const clipped = await card.evaluate((el) => {
		const box = el.getBoundingClientRect();
		return [...el.querySelectorAll<HTMLElement>('[data-testid="planned-label"], [data-testid="aspect-tag"], .meta > span')].filter((n) => {
			const r = n.getBoundingClientRect();
			return n.scrollWidth > n.clientWidth || r.right > box.right + 0.5 || r.left < box.left - 0.5;
		}).length;
	});
	expect(clipped).toBe(0);
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
	const todayRow = rowOf(page, 'Dentist');
	await expect(todayRow.getByTestId('planned-label')).toHaveText('18:00–19:30');
	await expect(todayRow.getByRole('combobox', { name: 'Day' })).toHaveCount(0);
	await expect(todayRow.getByRole('button', { name: 'Pick a day' })).toHaveCount(0);
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

const quickAddForm = (page: Page) => page.getByRole('form', { name: 'New todo' });

test('Regression: quick add on the backlog stores the planned day and slot', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH] });
	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();

	await page.getByRole('button', { name: 'Add a todo' }).first().click();
	const form = quickAddForm(page);
	await form.getByLabel('Title').fill('Dentist');
	await form.getByLabel('Planned', { exact: true }).fill('2026-11-03');
	await form.getByLabel('From', { exact: true }).fill('18:00');
	await form.getByLabel('To', { exact: true }).fill('19:30');
	await form.getByRole('button', { name: 'Add todo' }).click();

	await expect(rowOf(page, 'Dentist').getByTestId('planned-label')).toHaveText('Tue 3 Nov · 18:00–19:30');
	await page.reload();
	await expect(rowOf(page, 'Dentist').getByTestId('planned-label')).toHaveText('Tue 3 Nov · 18:00–19:30');
	await rowOf(page, 'Dentist').getByRole('button', { name: 'Dentist', exact: true }).click();
	await expect(editor(page).getByLabel('Planned', { exact: true })).toHaveValue('2026-11-03');
	await expect(editor(page).getByLabel('From', { exact: true })).toHaveValue('18:00');
	await expect(editor(page).getByLabel('To', { exact: true })).toHaveValue('19:30');
});

test('Regression: the New todo dialog says where a planned day sends the todo', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], sprint: { state: 'active', weekStart: WEEK } });
	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();

	await page.getByRole('button', { name: 'New todo' }).click();
	const form = quickAddForm(page);
	await expect(form.getByText('Goes to the backlog')).toBeVisible();

	await form.getByLabel('Planned', { exact: true }).fill('2026-10-16');
	await expect(form.getByText('Goes to this sprint')).toBeVisible();
	await expect(form.getByText('Goes to the backlog')).toHaveCount(0);

	await form.getByLabel('Planned', { exact: true }).fill('2026-11-03');
	await expect(form.getByText('Goes to the backlog')).toBeVisible();
});

test('Regression: quick add in a week day column stores the slot on that day', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], sprint: { state: 'active', weekStart: WEEK } });
	await page.goto('/sprint?view=week');
	const column = page.getByTestId('day-column-2026-10-15');

	await page.getByRole('button', { name: 'Add a todo to Thu 15' }).click();
	const form = quickAddForm(page);
	await expect(form.getByLabel('Planned', { exact: true })).toHaveValue('2026-10-15');
	await form.getByLabel('Title').fill('Dentist');
	await form.getByLabel('From', { exact: true }).fill('09:00');
	await form.getByLabel('To', { exact: true }).fill('10:00');
	await form.getByRole('button', { name: 'Add todo' }).click();

	await expect(column.getByTestId('sprint-card').filter({ hasText: 'Dentist' }).getByTestId('planned-label')).toHaveText(
		'09:00–10:00'
	);

	await form.getByLabel('Title').fill('Laundry');
	await form.getByRole('button', { name: 'Remove plan' }).click();
	await form.getByRole('button', { name: 'Add todo' }).click();
	await page.goto('/sprint?view=aspect');
	await expect(rowOf(page, 'Laundry')).toHaveAttribute('data-day', '');
	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();
	await expect(rowOf(page, 'Laundry')).toHaveCount(0);
});

const plusHour = (t: string, hours: number) => `${String(Number(t.slice(0, 2)) + hours).padStart(2, '0')}${t.slice(2)}`;

test('Regression: the time row appears only once a day is planned', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', aspect: 0 }] });
	await openEditor(page, 'Dentist');

	await expect(editor(page).getByLabel('From', { exact: true })).toHaveCount(0);
	await expect(editor(page).getByLabel('To', { exact: true })).toHaveCount(0);
	await editor(page).getByLabel('Planned', { exact: true }).fill('2026-11-03');
	await expect(editor(page).getByLabel('From', { exact: true })).toBeVisible();
	await expect(editor(page).getByLabel('To', { exact: true })).toBeVisible();
	await editor(page).getByLabel('To', { exact: true }).fill('19:30');
	await editor(page).getByLabel('From', { exact: true }).fill('18:00');
	await expect(editor(page).getByLabel('To', { exact: true })).toHaveValue('19:30');
	await expect(editor(page).getByTestId('slot-length')).toHaveText('1 h 30 min');
});

test('Regression: Add time and the length chips set To', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', aspect: 0, day: '2026-11-03' }] });
	await openEditor(page, 'Dentist');
	const from = editor(page).getByLabel('From', { exact: true });
	const to = editor(page).getByLabel('To', { exact: true });

	await editor(page).getByRole('button', { name: 'Add time' }).click();
	await expect(from).toHaveValue(/^\d\d:00$/);
	const start = await from.inputValue();
	await expect(to).toHaveValue(plusHour(start, 1));
	await expect(editor(page).getByRole('button', { name: '1h', exact: true })).toHaveAttribute('aria-pressed', 'true');

	await editor(page).getByRole('button', { name: '2h', exact: true }).click();
	await expect(to).toHaveValue(plusHour(start, 2));
	await expect(editor(page).getByTestId('slot-length')).toHaveText('2 h');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);
	await expect(rowOf(page, 'Dentist').getByTestId('planned-label')).toHaveText(`Tue 3 Nov · ${start}–${plusHour(start, 2)}`);
});

test('Regression: moving From keeps the length of the slot', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH],
		todos: [{ title: 'Dentist', aspect: 0, day: '2026-11-03', startTime: '18:00', endTime: '19:30' }]
	});
	await openEditor(page, 'Dentist');

	await editor(page).getByLabel('From', { exact: true }).fill('09:00');
	await expect(editor(page).getByLabel('To', { exact: true })).toHaveValue('10:30');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);
	await page.reload();
	await expect(rowOf(page, 'Dentist').getByTestId('planned-label')).toHaveText('Tue 3 Nov · 09:00–10:30');
});

test('Scenario: Retyping From after clearing it restores the slot length', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH],
		todos: [{ title: 'Dentist', aspect: 0, day: '2026-11-03', startTime: '18:00', endTime: '19:30' }]
	});
	await openEditor(page, 'Dentist');
	const from = editor(page).getByLabel('From', { exact: true });
	const to = editor(page).getByLabel('To', { exact: true });

	await from.fill('');
	await expect(to).toHaveValue('');
	await from.fill('09:00');
	await expect(to).toHaveValue('10:30');
	await expect(editor(page).getByTestId('slot-length')).toHaveText('1 h 30 min');
});

test('Regression: a cleared slot does not leak into the next quick add', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH] });
	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();
	await page.getByRole('button', { name: 'Add a todo' }).first().click();
	const form = quickAddForm(page);
	const planned = form.getByLabel('Planned', { exact: true });
	const from = form.getByLabel('From', { exact: true });
	const to = form.getByLabel('To', { exact: true });

	await form.getByLabel('Title').fill('Dentist');
	await planned.fill('2026-11-03');
	await from.fill('18:00');
	await to.fill('19:30');
	await from.fill('');
	await form.getByRole('button', { name: 'Add todo' }).click();
	await expect(rowOf(page, 'Dentist').getByTestId('planned-label')).toHaveText('Tue 3 Nov');

	await planned.fill('2026-11-03');
	await from.fill('09:00');
	await expect(to).toHaveValue('');

	await to.fill('10:00');
	await from.fill('');
	await form.getByRole('button', { name: 'Remove plan' }).click();
	await planned.fill('2026-11-04');
	await from.fill('11:00');
	await expect(to).toHaveValue('');
});

test.describe('without a native time picker', () => {
	test.use({ locale: 'de-DE' });

	test('Regression: From and To are typed in a browser without a time picker', async ({ page, request }) => {
		// Firefox has no picker for time inputs and throws from showPicker(); Chromium is made to do the same.
		await page.addInitScript(() => {
			const showPicker = HTMLInputElement.prototype.showPicker;
			HTMLInputElement.prototype.showPicker = function () {
				if (this.type === 'time') throw new DOMException('No picker for time inputs', 'NotSupportedError');
				return showPicker.call(this);
			};
		});
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));
		await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', aspect: 0, day: '2026-11-03' }] });
		await openEditor(page, 'Dentist');

		await editor(page).getByLabel('From', { exact: true }).click({ position: { x: 10, y: 10 } });
		await page.keyboard.type('1800');
		await expect(editor(page).getByLabel('From', { exact: true })).toHaveValue('18:00');
		await editor(page).getByLabel('To', { exact: true }).click({ position: { x: 10, y: 10 } });
		await page.keyboard.type('1930');
		await expect(editor(page).getByLabel('To', { exact: true })).toHaveValue('19:30');
		expect(errors).toEqual([]);
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(editor(page)).toHaveCount(0);
		await expect(rowOf(page, 'Dentist').getByTestId('planned-label')).toHaveText('Tue 3 Nov · 18:00–19:30');
	});
});
