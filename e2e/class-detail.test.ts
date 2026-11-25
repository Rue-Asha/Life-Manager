import type { Locator, Page } from '@playwright/test';
import { aspectGroup, expect, test, reset, seed, setClock, todoRow, todoRows, type SeedInput } from './helpers';
import { notesRegion } from './uni-locators';

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

const tint = (page: Page, token: string) =>
	page.evaluate((name) => {
		const probe = document.createElement('i');
		probe.style.background = `var(--aspect-${name})`;
		document.body.append(probe);
		const color = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return color;
	}, token);

const details = (page: Page) => page.getByRole('region', { name: 'Details', exact: true });

const openMenu = async (page: Page, name: string) => {
	await page.getByRole('button', { name: 'Class actions' }).click();
	await page.getByRole('menuitem', { name }).click();
};

const todoGroup = (page: Page, name: 'Open' | 'Planned' | 'Done') => page.getByRole('group', { name, exact: true });

test('Scenario: Class details sit in the Details card at every width', async ({ page, request }) => {
	const id = await seedClass(request);
	for (const width of [1280, 375]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(`/uni/classes/${id}`);

		await expect(heading(page)).toHaveText('Analysis II');
		const meta = details(page);
		await expect(meta).toBeVisible();
		await expect(meta).toContainText('Prof. Kühn');
		await expect(meta).toContainText('H 2.013');
		await expect(meta).toContainText('7.5');
		await expect(meta).toContainText('Tue 9 Feb 2027, 10:00');
		await expect(meta).toContainText('Audimax');
		await expect(meta).toContainText('1.7');
		await expect(meta.getByRole('link', { name: 'Moodle' })).toHaveAttribute('target', '_blank');
		await expect(page.getByText('Prof. Kühn')).toHaveCount(1);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	}
});

test('Scenario: Class rules sit beside the main column from 1280', async ({ page, request }) => {
	const id = await seedClass(request, { rules: [{ title: 'Lecture review', aspect: 1, weekdays: [1], class: 0, type: 'LEC' }] });
	const panel = page.getByRole('complementary', { name: 'Recurring', exact: true });
	const todos = page.getByRole('region', { name: 'Todos', exact: true });

	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto(`/uni/classes/${id}`);
	await expect(panel).toBeVisible();
	const side = (await panel.boundingBox())!;
	const main = (await todos.boundingBox())!;
	expect(side.x).toBeGreaterThanOrEqual(main.x + main.width);

	await page.setViewportSize({ width: 1100, height: 900 });
	await expect(panel).toBeVisible();
	const stacked = (await panel.boundingBox())!;
	const below = (await todos.boundingBox())!;
	expect(stacked.y).toBeGreaterThanOrEqual(below.y + below.height - 1);
	await expect(page.getByRole('button', { name: 'Details', exact: true, includeHidden: true })).toHaveCount(0);
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
		await expect(page.getByTestId('class-tile')).toHaveCSS('background-color', await tint(page, 'berry'));
		const meta = details(page);
		await expect(meta).toContainText('Dr. Weber');
		await expect(meta.getByText('ECTS', { exact: true }).locator('xpath=following-sibling::dd[1]')).toHaveText('10 ECTS');
		await expect(meta).toContainText('Mon 1 Mar 2027, 10:00');
		await expect(meta).toContainText('2.3');
		await expect(meta).not.toContainText('Prof. Kühn');
		await page.getByRole('button', { name: 'Edit details' }).click();
		await expect(page.getByRole('dialog').getByRole('radio', { name: 'Berry' })).toBeChecked();
		await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
		await expect(page.getByRole('dialog')).toBeHidden();
	};
	await check();
	await page.reload();
	await check();
});

test('Scenario: Class notes are edited as Markdown and shown rendered', async ({ page, request }) => {
	const id = await seedClass(request);
	await page.goto(`/uni/classes/${id}`);

	const notes = notesRegion(page);
	await notes.getByRole('button', { name: 'Edit notes' }).click();
	await notes.getByRole('textbox', { name: 'Notes' }).fill('## Exam topics\n\n- **Fourier**');
	await notes.getByRole('button', { name: 'Save' }).click();

	await expect(notes.getByRole('heading', { level: 2, name: 'Exam topics' })).toBeVisible();
	await expect(notes.getByRole('listitem').filter({ hasText: 'Fourier' }).getByRole('strong')).toHaveText('Fourier');
	await expect(notes.getByRole('textbox', { name: 'Notes' })).toHaveCount(0);

	await page.reload();
	await notes.getByRole('button', { name: 'Edit notes' }).click();
	await expect(notes.getByRole('textbox', { name: 'Notes' })).toHaveValue('## Exam topics\n\n- **Fourier**');
});

test('Scenario: Class without notes or todos shows placeholders', async ({ page, request }) => {
	const id = await seedClass(request);
	await page.goto(`/uni/classes/${id}`);

	await expect(notesRegion(page)).toContainText('No notes yet');
	await expect(page.getByText('No todos for this class yet')).toBeVisible();
	await expect(todoRows(page)).toHaveCount(0);
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

	const rows = (group: 'Open' | 'Planned' | 'Done') => todoRows(todoGroup(page, group));
	await expect(rows('Open')).toHaveText([/Exercise sheet 4/]);
	await expect(rows('Planned')).toHaveText([/Lecture 6 notes/]);

	const done = todoGroup(page, 'Done');
	const toggle = done.getByRole('button', { name: /Done/ });
	await expect(toggle).toContainText('2');
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(rows('Done')).toHaveCount(0);

	await toggle.click();
	await expect(rows('Done')).toHaveText([/Sheet 3/, /Sheet 2/]);
});

test('Scenario: Class detail rows show the type instead of the badge', async ({ page, request }) => {
	const id = await seedClass(request, { sprint: { state: 'active', weekStart: WEEK }, todos: CLASS_TODOS });
	await page.goto(`/uni/classes/${id}`);

	const row = todoRow(todoGroup(page, 'Open'), 'Exercise sheet 4');
	await expect(row.getByText('EXC', { exact: true })).toHaveText('EXC');
	await expect(row.getByText('Not revised', { exact: true })).toBeVisible();
	await expect(todoGroup(page, 'Open').getByRole('link', { name: 'Analysis II' })).toHaveCount(0);
	await expect(todoGroup(page, 'Planned').getByRole('link', { name: 'Analysis II' })).toHaveCount(0);
});

test('Scenario: Class rules are listed with a link to Recurring', async ({ page, request }) => {
	const id = await seedClass(request, {
		rules: [
			{ title: 'Lecture review', aspect: 1, weekdays: [1], class: 0, type: 'LEC' },
			{ title: 'Gym', aspect: 0, weekdays: [2] }
		]
	});
	await page.goto(`/uni/classes/${id}`);

	const rules = page.getByRole('complementary', { name: 'Recurring', exact: true });
	await expect(rules.getByRole('listitem')).toHaveText([/Lecture review/]);
	await expect(rules.getByRole('listitem')).toContainText(['LEC']);
	await rules.getByRole('link', { name: 'Edit in Recurring' }).click();
	await expect(page).toHaveURL(/\/recurring$/);
});

test('Scenario: Quick add on class detail creates a linked todo', async ({ page, request }) => {
	const ids = await seed(request, { aspects: ASPECTS, uniAspect: 1, semesters: [{ name: 'WS 26/27' }], classes: [CLASS] });
	const id = ids.classes[0];
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto(`/uni/classes/${id}`);

	const form = page.getByRole('form', { name: 'Add todo' });
	await expect(form.getByLabel(/due|priority/i)).toHaveCount(0);
	await form.getByRole('radio', { name: 'LEC' }).check();
	await form.getByLabel('New todo title').fill('Rework lecture 5');
	await form.getByRole('button', { name: 'Add', exact: true }).click();

	const open = todoRows(todoGroup(page, 'Open'));
	await expect(open).toHaveText([/Rework lecture 5/]);
	await expect(open).toContainText('LEC');

	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	const row = todoRow(aspectGroup(page, 'Uni'), 'Rework lecture 5');
	await expect(row.getByRole('link', { name: 'Analysis II' })).toContainText('Analysis II');
	await expect(row.getByRole('link', { name: 'Analysis II' })).toContainText('LEC');
});

test('Scenario: Type defaults to OTH', async ({ page, request }) => {
	const id = await seedClass(request);
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto(`/uni/classes/${id}`);

	const form = page.getByRole('form', { name: 'Add todo' });
	await expect(form.getByRole('radio', { name: 'OTH' })).toBeChecked();
	await form.getByLabel('New todo title').fill('Summarise chapter 3');
	await form.getByRole('button', { name: 'Add', exact: true }).click();
	await expect(todoRows(todoGroup(page, 'Open'))).toHaveText([/Summarise chapter 3/]);

	await page.goto('/backlog');
	await expect(todoRow(page, 'Summarise chapter 3').getByRole('link', { name: 'Analysis II' })).toContainText('OTH');
});

const revisedRow = (page: Page, title: string) => todoRow(todoGroup(page, 'Open'), title);
const revised = (page: Page, title: string, label: string) => {
	const row = revisedRow(page, title);
	return row.getByText(label, { exact: true }).and(row.locator('span'));
};
const markRevised = (page: Page, title: string) =>
	revisedRow(page, title).getByRole('button', { name: `Mark revised today: ${title}`, exact: true });

test('Scenario: Revised today sets the date', async ({ page, request }) => {
	const id = await seedClass(request, { todos: [{ title: 'Exercise sheet 4', aspect: 1, class: 0, type: 'EXC' }] });
	await page.goto(`/uni/classes/${id}`);

	await expect(revised(page, 'Exercise sheet 4', 'Not revised')).toBeVisible();
	await markRevised(page, 'Exercise sheet 4').click();
	await expect(revised(page, 'Exercise sheet 4', 'Revised today')).toBeVisible();
	await expect(markRevised(page, 'Exercise sheet 4')).toHaveCount(0);
	await expect(revised(page, 'Exercise sheet 4', 'Not revised')).toHaveCount(0);
	await page.reload();
	await expect(revised(page, 'Exercise sheet 4', 'Revised today')).toBeVisible();
	await expect(markRevised(page, 'Exercise sheet 4')).toHaveCount(0);
});

test('Scenario: Revised date can be cleared', async ({ page, request }) => {
	const id = await seedClass(request, {
		todos: [{ title: 'Rework lecture 5', aspect: 1, class: 0, type: 'LEC', revisedAt: '2026-10-04' }]
	});
	await page.goto(`/uni/classes/${id}`);

	await expect(revised(page, 'Rework lecture 5', 'Revised 3 days ago')).toBeVisible();
	await page.getByRole('button', { name: 'Clear revised date: Rework lecture 5' }).click();
	await expect(revised(page, 'Rework lecture 5', 'Not revised')).toBeVisible();
	await page.reload();
	await expect(revised(page, 'Rework lecture 5', 'Not revised')).toBeVisible();
});

test('Scenario: Deleting a class asks for confirmation naming the todo count', async ({ page, request }) => {
	const todos = ['One', 'Two', 'Three'].map((title) => ({ title, aspect: 1, class: 0 }));
	const id = await seedClass(request, { todos });
	await page.goto(`/uni/classes/${id}`);

	const dialog = page.getByRole('dialog');
	await openMenu(page, 'Delete class');
	await expect(dialog).toContainText('3 todos');
	await dialog.getByRole('button', { name: 'Cancel' }).click();
	await expect(dialog).toBeHidden();
	await page.reload();
	await expect(heading(page)).toHaveText('Analysis II');

	await openMenu(page, 'Delete class');
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
	const todos = todoGroup(page, 'Open').or(todoGroup(page, 'Planned')).or(todoGroup(page, 'Done'));
	for (const width of [1600, 375]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(`/uni/classes/${id}`);

		await expect(heading(page)).toHaveText('Analysis II');
		await expect(page.getByText('WS 25/26 is archived. This class is read-only.')).toBeVisible();
		await expect(notesRegion(page)).toContainText('Formula sheet allowed.');
		await todoGroup(page, 'Done').getByRole('button', { name: /Done/ }).click();
		await expect(todoRows(todos)).toHaveCount(3);
		await expect(todos.getByText('Not revised', { exact: true })).toHaveCount(3);
		await expect(page.getByRole('button', { name: 'Edit details' })).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Edit notes' })).toHaveCount(0);
		await expect(page.getByRole('form', { name: 'Add todo' })).toHaveCount(0);
		await expect(page.getByRole('button', { name: /Mark revised today/ })).toHaveCount(0);
		const rows = todoRows(todos);
		await expect(rows.getByRole('button')).toHaveCount(3);
		await expect(rows.getByRole('button', { name: /^Delete todo: / })).toHaveCount(3);
		await expect(rows.getByRole('checkbox')).toHaveCount(0);
		await expect(rows.getByRole('combobox')).toHaveCount(0);
		await expect(rows.getByRole('link')).toHaveCount(0);
		await todoRow(todos, 'Old sheet').getByText('Old sheet').click();
		await expect(page.getByLabel('Edit todo')).toHaveCount(0);
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await page.getByRole('button', { name: 'Class actions' }).click();
		await expect(page.getByRole('menuitem', { name: 'Delete class' })).toBeVisible();
		await page.keyboard.press('Escape');
	}
});

test('Scenario: Archived class todo deletes from the row', async ({ page, request }) => {
	const id = await seedClass(
		request,
		{
			sprint: { state: 'active', weekStart: WEEK },
			todos: [
				{ title: 'Old sheet', aspect: 1, class: 0, type: 'EXC' },
				{ title: 'Old notes', aspect: 1, class: 0, inSprint: true, day: '2026-10-07' }
			]
		},
		{},
		{ name: 'WS 25/26', archivedAt: '2026-09-30T10:00:00Z' }
	);
	await page.goto(`/uni/classes/${id}`);
	const todos = todoGroup(page, 'Open').or(todoGroup(page, 'Planned'));
	await expect(todoRows(todos)).toHaveCount(2);
	await todoRow(todos, 'Old sheet').getByRole('button', { name: 'Delete todo: Old sheet' }).click();
	const confirm = page.getByRole('dialog', { name: 'Delete this todo?' });
	await confirm.getByRole('button', { name: 'Cancel' }).click();
	await expect(todoRows(todos)).toHaveCount(2);
	await todoRow(todos, 'Old sheet').getByRole('button', { name: 'Delete todo: Old sheet' }).click();
	await confirm.getByRole('button', { name: 'Delete todo' }).click();
	await expect(todoRows(todos)).toHaveCount(1);
	await expect(page.getByLabel('Edit todo')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Delete todo: Old notes' })).toBeFocused();
});

test('Scenario: Open class todos have a More actions menu', async ({ page, request }) => {
	const id = await seedClass(request, { todos: [{ title: 'Read chapter 3', aspect: 1, class: 0 }] });
	await page.goto(`/uni/classes/${id}`);
	await expect(todoRow(todoGroup(page, 'Open'), 'Read chapter 3').getByRole('checkbox')).toHaveCount(0);
	await todoRow(todoGroup(page, 'Open'), 'Read chapter 3').getByRole('button', { name: 'More actions: Read chapter 3' }).click();
	await expect(page.getByRole('menuitem', { name: 'Plan a day' })).toBeVisible();
});

test('Scenario: Uni kicker names the section, not the chosen aspect', async ({ page, request }) => {
	await seedClass(request);
	await page.goto('/uni');
	await expect(page.locator('.screen-lead .kicker')).toHaveText(/Life\s*Study/);
});
