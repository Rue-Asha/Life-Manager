import { expect, test, type Page } from '@playwright/test';
import { reset, seed, setClock, type SeedInput } from './helpers';

// Wednesday 7 October 2026 in Berlin; the active sprint runs Monday 5 to Sunday 11 October.
const NOW = '2026-10-07T10:00:00Z';
const WEEK = '2026-10-05';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const ASPECTS: SeedInput['aspects'] = [
	{ name: 'Health', color: 'sage', icon: 'heart' },
	{ name: 'Uni', color: 'lavender', icon: 'book' }
];

const CLASS: NonNullable<SeedInput['classes']>[number] = {
	semester: 0,
	name: 'Analysis II',
	color: 'sky',
	icon: 'book',
	lecturer: 'Prof. Kühn',
	room: 'H 2.013',
	ects: 7.5,
	links: [{ label: 'Moodle', url: 'https://moodle.example/ana2' }],
	examAt: '2027-02-09T10:00',
	examRoom: 'Audimax',
	grade: '1.7'
};

// Seeds the Uni aspect (index 1) with one semester and one class and returns the class id.
async function seedClass(
	request: Parameters<typeof seed>[0],
	extra: Partial<SeedInput> = {},
	cls: Partial<NonNullable<SeedInput['classes']>[number]> = {},
	semester: NonNullable<SeedInput['semesters']>[number] = { name: 'WS 26/27' }
) {
	const ids = await seed(request, {
		aspects: ASPECTS,
		uniAspect: 1,
		semesters: [semester],
		classes: [{ ...CLASS, ...cls }],
		...extra
	});
	return ids.classes[0];
}

const heading = (page: Page) => page.getByRole('heading', { level: 1 });

test('Scenario: Class metadata sits in the rail at 1280', async ({ page, request }) => {
	const id = await seedClass(request);
	for (const width of [1280, 1600]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(`/uni/classes/${id}`);

		await expect(heading(page)).toHaveText('Analysis II');
		const rail = page.getByTestId('context-rail');
		await expect(rail).toBeVisible();
		const meta = rail.getByTestId('class-meta');
		await expect(meta).toContainText('Prof. Kühn');
		await expect(meta).toContainText('H 2.013');
		await expect(meta).toContainText('7.5');
		await expect(meta).toContainText('Tue 9 Feb 2027, 10:00');
		await expect(meta).toContainText('Audimax');
		await expect(meta).toContainText('1.7');
		await expect(meta.getByRole('link', { name: 'Moodle' })).toHaveAttribute('target', '_blank');
		await expect(page.getByTestId('class-meta')).toHaveCount(1);
	}
});

test('Scenario: Class metadata wraps under the title below 1280', async ({ page, request }) => {
	const id = await seedClass(request);
	for (const width of [1100, 375]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(`/uni/classes/${id}`);

		await expect(page.getByTestId('context-rail')).toHaveCount(0);
		await expect(page.getByTestId('rail-toggle')).toHaveCount(0);
		const meta = page.getByTestId('class-meta');
		await expect(meta).toBeVisible();
		await expect(meta).toContainText('Prof. Kühn');
		await expect(meta).toContainText('H 2.013');
		await expect(meta).toContainText('7.5 ECTS');
		await expect(meta).toContainText('Audimax');
		await expect(meta).toContainText('1.7');
		await expect(meta.getByRole('link', { name: 'Moodle' })).toHaveAttribute('target', '_blank');
		const title = await heading(page).boundingBox();
		const row = await meta.boundingBox();
		expect(row!.y).toBeGreaterThan(title!.y + title!.height - 1);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	}
});

test('Scenario: Unknown class id shows 404', async ({ page, request }) => {
	await seedClass(request);
	const response = await page.goto('/uni/classes/999999');

	expect(response?.status()).toBe(404);
	await expect(heading(page)).toHaveText('Class not found');
	await expect(page.getByRole('main').getByRole('link', { name: 'Uni' })).toHaveAttribute('href', '/uni');
});

test('Scenario: Edit a class on its detail page', async ({ page, request }) => {
	const id = await seedClass(request);
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto(`/uni/classes/${id}`);

	await page.getByRole('button', { name: 'Edit details' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByLabel('Name').fill('Analysis III');
	await dialog.getByRole('radio', { name: 'Berry' }).check();
	await dialog.getByLabel('Lecturer').fill('Dr. Weber');
	await dialog.getByLabel('ECTS').fill('-1');
	await dialog.getByRole('button', { name: 'Save' }).click();
	await expect(dialog.getByRole('alert')).toContainText('ECTS');
	await dialog.getByLabel('ECTS').fill('10');
	await dialog.getByLabel('Exam date').fill('2027-03-01');
	await dialog.getByLabel('Grade').selectOption('2.3');
	await dialog.getByRole('button', { name: 'Save' }).click();
	await expect(dialog).toBeHidden();

	const check = async () => {
		await expect(heading(page)).toHaveText('Analysis III');
		await expect(page.getByTestId('class-tile')).toHaveAttribute('data-color', 'berry');
		const meta = page.getByTestId('class-meta');
		await expect(meta).toContainText('Dr. Weber');
		await expect(meta).toContainText('10');
		await expect(meta).toContainText('Mon 1 Mar 2027, 10:00');
		await expect(meta).toContainText('2.3');
		await expect(meta).not.toContainText('Prof. Kühn');
	};
	await check();
	await page.reload();
	await check();
});

test('Scenario: Class notes are edited as Markdown and shown rendered', async ({ page, request }) => {
	const id = await seedClass(request);
	await page.goto(`/uni/classes/${id}`);

	const notes = page.getByTestId('class-notes');
	await notes.getByRole('button', { name: 'Edit notes' }).click();
	await notes.getByRole('textbox', { name: 'Notes' }).fill('## Exam topics\n\n- **Fourier**');
	await notes.getByRole('button', { name: 'Save' }).click();

	await expect(notes.getByRole('heading', { level: 2, name: 'Exam topics' })).toBeVisible();
	await expect(notes.getByRole('listitem').filter({ hasText: 'Fourier' }).locator('strong')).toHaveText('Fourier');
	await expect(notes.getByRole('textbox', { name: 'Notes' })).toHaveCount(0);

	await page.reload();
	await notes.getByRole('button', { name: 'Edit notes' }).click();
	await expect(notes.getByRole('textbox', { name: 'Notes' })).toHaveValue('## Exam topics\n\n- **Fourier**');
});

test('Scenario: Class without notes or todos shows placeholders', async ({ page, request }) => {
	const id = await seedClass(request);
	await page.goto(`/uni/classes/${id}`);

	await expect(page.getByTestId('class-notes')).toContainText('No notes yet');
	await expect(page.getByTestId('empty-state')).toContainText('No todos for this class yet');
	await expect(page.getByTestId('todo-row')).toHaveCount(0);
});

const CLASS_TODOS: NonNullable<SeedInput['todos']> = [
	{ title: 'Exercise sheet 4', aspect: 1, class: 0, type: 'EXC' },
	{ title: 'Lecture 6 notes', aspect: 1, class: 0, type: 'LEC', inSprint: true },
	{ title: 'Sheet 2', aspect: 1, class: 0, inSprint: true, status: 'done', completedAt: '2026-10-05T09:00:00Z' },
	{ title: 'Sheet 3', aspect: 1, class: 0, inSprint: true, status: 'done', completedAt: '2026-10-06T09:00:00Z' }
];

test('Scenario: Class Done group starts collapsed', async ({ page, request }) => {
	const id = await seedClass(request, { sprint: { state: 'active', weekStart: WEEK }, todos: CLASS_TODOS });
	await page.goto(`/uni/classes/${id}`);

	const rows = (group: string) => page.getByTestId(`class-todos-${group}`).getByTestId('todo-row');
	await expect(rows('open')).toHaveText([/Exercise sheet 4/]);
	await expect(rows('planned')).toHaveText([/Lecture 6 notes/]);

	const done = page.getByTestId('class-todos-done');
	const toggle = done.getByRole('button', { name: /Done/ });
	await expect(toggle).toContainText('2');
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(rows('done')).toHaveCount(0);

	await toggle.click();
	await expect(rows('done')).toHaveText([/Sheet 3/, /Sheet 2/]);
});

test('Scenario: Class rules are listed with a link to Recurring', async ({ page, request }) => {
	const id = await seedClass(request, {
		rules: [
			{ title: 'Lecture review', aspect: 1, weekdays: [1], class: 0, type: 'LEC' },
			{ title: 'Gym', aspect: 0, weekdays: [2] }
		]
	});
	await page.goto(`/uni/classes/${id}`);

	const rules = page.getByTestId('class-rules');
	await expect(rules.getByRole('listitem')).toHaveText([/Lecture review/]);
	await expect(rules.getByRole('listitem')).toContainText(['LEC']);
	await rules.getByRole('link', { name: 'Edit in Recurring' }).click();
	await expect(page).toHaveURL(/\/recurring$/);
});

test('Scenario: Quick add on class detail creates a linked todo', async ({ page, request }) => {
	const id = await seedClass(request);
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto(`/uni/classes/${id}`);

	await page.getByRole('button', { name: 'Add a todo' }).click();
	const form = page.getByRole('form', { name: 'New todo' });
	await expect(form.getByLabel('Aspect').locator('option:checked')).toHaveText('Uni');
	await expect(form.getByLabel('Class')).toHaveValue(String(id));
	await form.getByTestId('type-field').getByRole('button', { name: 'LEC' }).click();
	await form.getByLabel('Title').fill('Rework lecture 5');
	await form.getByLabel('Due date', { exact: true }).fill('2026-10-09');
	await form.getByRole('button', { name: 'Add todo' }).click();

	const open = page.getByTestId('class-todos-open').getByTestId('todo-row');
	await expect(open).toHaveText([/Rework lecture 5/]);
	await expect(open).toContainText('LEC');

	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	const row = page.getByTestId('todo-row').filter({ hasText: 'Rework lecture 5' });
	await expect(row.getByTestId('class-badge')).toContainText('Analysis II');
	await expect(row.getByTestId('class-badge')).toContainText('LEC');
});

test('Scenario: Type defaults to OTH', async ({ page, request }) => {
	const id = await seedClass(request);
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto(`/uni/classes/${id}`);

	await page.getByRole('button', { name: 'Add a todo' }).click();
	const form = page.getByRole('form', { name: 'New todo' });
	await expect(form.getByTestId('type-field').getByRole('button', { name: 'OTH' })).toHaveAttribute('aria-pressed', 'true');
	await form.getByLabel('Title').fill('Summarise chapter 3');
	await form.getByRole('button', { name: 'Add todo' }).click();
	await expect(page.getByTestId('class-todos-open').getByTestId('todo-row')).toHaveText([/Summarise chapter 3/]);

	await page.goto('/backlog');
	await expect(page.getByTestId('todo-row').filter({ hasText: 'Summarise chapter 3' }).getByTestId('class-badge')).toContainText('OTH');
});

const revised = (page: Page, title: string) =>
	page.getByTestId('class-todos-open').getByTestId('todo-row').filter({ hasText: title }).getByTestId('revised');

test('Scenario: Revised today sets the date', async ({ page, request }) => {
	const id = await seedClass(request, { todos: [{ title: 'Exercise sheet 4', aspect: 1, class: 0, type: 'EXC' }] });
	await page.goto(`/uni/classes/${id}`);

	await expect(revised(page, 'Exercise sheet 4')).toHaveText('Not revised');
	await page.getByRole('button', { name: 'Revised today: Exercise sheet 4' }).click();
	await expect(revised(page, 'Exercise sheet 4')).toHaveText('Revised today');
	await page.reload();
	await expect(revised(page, 'Exercise sheet 4')).toHaveText('Revised today');
});

test('Scenario: Revised date can be cleared', async ({ page, request }) => {
	const id = await seedClass(request, {
		todos: [{ title: 'Rework lecture 5', aspect: 1, class: 0, type: 'LEC', revisedAt: '2026-10-04' }]
	});
	await page.goto(`/uni/classes/${id}`);

	await expect(revised(page, 'Rework lecture 5')).toHaveText('Revised 3 days ago');
	await page.getByRole('button', { name: 'Clear revised date: Rework lecture 5' }).click();
	await expect(revised(page, 'Rework lecture 5')).toHaveText('Not revised');
	await page.reload();
	await expect(revised(page, 'Rework lecture 5')).toHaveText('Not revised');
});

test('Scenario: Deleting a class asks for confirmation naming the todo count', async ({ page, request }) => {
	const todos = ['One', 'Two', 'Three'].map((title) => ({ title, aspect: 1, class: 0 }));
	const id = await seedClass(request, { todos });
	await page.goto(`/uni/classes/${id}`);

	const dialog = page.getByRole('dialog');
	await page.getByRole('button', { name: 'Delete class' }).click();
	await expect(dialog).toContainText('3 todos');
	await dialog.getByRole('button', { name: 'Cancel' }).click();
	await expect(dialog).toBeHidden();
	await page.reload();
	await expect(heading(page)).toHaveText('Analysis II');

	await page.getByRole('button', { name: 'Delete class' }).click();
	await dialog.getByRole('button', { name: 'Delete class' }).click();
	await expect(page).toHaveURL(/\/uni$/);
	const response = await page.goto(`/uni/classes/${id}`);
	expect(response?.status()).toBe(404);
});

test('Scenario: Archived class has no edit controls', async ({ page, request }) => {
	// Archiving completes open todos; the open and planned rows are seeded to prove they'd be locked too.
	const id = await seedClass(
		request,
		{
			sprint: { state: 'active', weekStart: WEEK },
			todos: [
				{ title: 'Old sheet', aspect: 1, class: 0, type: 'EXC' },
				{ title: 'Old notes', aspect: 1, class: 0, inSprint: true, day: '2026-10-07' },
				{ title: 'Old exam prep', aspect: 1, class: 0, inSprint: true, status: 'done', completedAt: '2026-09-29T09:00:00Z' }
			]
		},
		{ notes: 'Formula sheet allowed.' },
		{ name: 'WS 25/26', archivedAt: '2026-09-30T10:00:00Z' }
	);
	const todos = page.getByTestId('class-todos-open').or(page.getByTestId('class-todos-planned')).or(page.getByTestId('class-todos-done'));
	for (const width of [1600, 375]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(`/uni/classes/${id}`);

		await expect(heading(page)).toHaveText('Analysis II');
		await expect(page.getByText('WS 25/26 is archived. This class is read-only.')).toBeVisible();
		await expect(page.getByTestId('class-notes')).toContainText('Formula sheet allowed.');
		await page.getByTestId('class-todos-done').getByRole('button', { name: /Done/ }).click();
		await expect(todos.getByTestId('todo-row')).toHaveCount(3);
		await expect(todos.getByTestId('revised')).toHaveText(['Not revised', 'Not revised', 'Not revised']);
		await expect(page.getByRole('button', { name: 'Edit details' })).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Edit notes' })).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Add a todo' })).toHaveCount(0);
		await expect(page.getByRole('button', { name: /Revised today/ })).toHaveCount(0);
		const rows = todos.getByTestId('todo-row');
		await expect(rows.getByRole('button')).toHaveCount(0);
		await expect(rows.getByRole('checkbox')).toHaveCount(0);
		await expect(rows.getByRole('combobox')).toHaveCount(0);
		await expect(rows.getByRole('link')).toHaveCount(0);
		await rows.filter({ hasText: 'Old sheet' }).getByText('Old sheet').click();
		await expect(page.getByLabel('Edit todo')).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Delete class' })).toBeVisible();
	}
});
