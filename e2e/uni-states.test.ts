import { expect, test, reset, seed, setClock, todoRow, todoRows } from './helpers';
import { archivedGroup, classCards, emptyState, notesRegion, semesterSection, semesterSections, sheet, sprintTodos, uniAspect, uniPrompt } from './uni-locators';

// Monday 5 October 2026 in Berlin; the active sprint runs Monday 5 to Sunday 11 October.
const NOW = '2026-10-05T10:00:00Z';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const HEALTH = { name: 'Health', color: 'sage', icon: 'heart' } as const;
const UNI = { name: 'Uni', color: 'lavender', icon: 'book' } as const;

test('Scenario: Uni overview shows semesters, This week and the grade line', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [
			{ semester: 0, name: 'Analysis II', grade: '1.3', ects: 5 },
			{ semester: 0, name: 'Algorithms', grade: '2.0', ects: 5 }
		],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [{ title: 'Sheet 4', aspect: 0, class: 0, type: 'EXC', inSprint: true }]
	});
	await page.goto('/uni');

	await expect(page.getByRole('heading', { level: 1, name: 'Uni' })).toBeVisible();
	await expect(page.getByText(/^Overall average/)).toContainText('1.65');
	await expect(page.getByText(/^Overall average/)).toContainText('10 ECTS earned');
	await expect(classCards(semesterSection(page, 'WS 26/27'))).toHaveCount(2);
	await expect(todoRows(sprintTodos(page))).toHaveText([/Sheet 4/]);
	await expect(notesRegion(page)).toContainText('No notes yet');
});

test('Scenario: No semesters and no classes copy', async ({ page, request }) => {
	await seed(request, { aspects: [UNI], uniAspect: 0 });
	await page.goto('/uni');

	await expect(emptyState(page)).toBeVisible();
	await expect(page.getByRole('heading', { name: /\.$/ })).toHaveCount(0);
	await expect(page.getByRole('region', { name: 'Start with the semester you are in now' }).getByRole('button', { name: 'New semester' })).toBeVisible();
	await expect(sprintTodos(page)).toHaveCount(0);

	await page.getByRole('button', { name: 'New semester' }).first().click();
	const dialog = sheet(page, 'New semester');
	await dialog.getByRole('button', { name: 'Add semester' }).click();
	await expect(dialog.getByRole('alert')).toHaveText('Give it a name.');
	await dialog.getByLabel('Semester name').fill('WS 26/27');
	await dialog.getByRole('button', { name: 'Add semester' }).click();

	const section = semesterSection(page, 'WS 26/27');
	await expect(section.getByRole('heading', { level: 3, name: 'No classes yet' })).toBeVisible();
	await expect(section.getByRole('button', { name: 'New class' })).toBeVisible();
	await expect(emptyState(page)).toHaveCount(0);
});

test('Scenario: Uni aspect prompt before the first use', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH, UNI] });
	await page.goto('/uni');

	const prompt = uniPrompt(page);
	await expect(prompt.getByRole('heading', { name: 'Which aspect holds your uni todos?' })).toBeVisible();
	await expect(prompt.getByRole('button', { name: 'Use Uni for classes' })).toBeVisible();
	await expect(semesterSections(page)).toHaveCount(0);
	await expect(sprintTodos(page)).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'New semester' })).toHaveCount(0);
	await prompt.getByRole('button', { name: 'Use Uni for classes' }).click();
	await expect(uniAspect(page)).toHaveText('Uni');
});

test('Scenario: Archiving a semester asks and makes it read-only', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II' }],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [
			{ title: 'Open 1', aspect: 0, class: 0 },
			{ title: 'Open 2', aspect: 0, class: 0, inSprint: true }
		]
	});
	await page.goto('/uni');

	await semesterSection(page, 'WS 26/27').getByRole('button', { name: 'Semester actions' }).click();
	await page.getByRole('menuitem', { name: 'Archive' }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toContainText('2 class todos are still open');
	await dialog.getByRole('button', { name: 'Mark 2 done and archive' }).click();

	const group = archivedGroup(page);
	await expect(group.getByRole('button', { name: 'Archived (1)' })).toHaveAttribute('aria-expanded', 'false');
	await group.getByRole('button', { name: 'Archived (1)' }).click();
	const archived = semesterSections(group);
	await archived.getByRole('button', { name: 'WS 26/27', exact: true }).click();
	await expect(archived.getByText('Read-only.')).toBeVisible();
	await archived.getByRole('button', { name: 'Semester actions' }).click();
	await expect(page.getByRole('menuitem')).toHaveText(['Unarchive', 'Delete']);
	await expect(archived.getByRole('button', { name: 'New class' })).toHaveCount(0);
	await page.keyboard.press('Escape');
});

// Wednesday 7 October 2026: the active sprint runs Monday 5 to Sunday 11 October.
const WEDNESDAY = '2026-10-07T10:00:00Z';

const CLASS = {
	semester: 0,
	name: 'Analysis II',
	color: 'sky',
	icon: 'book',
	lecturer: 'Prof. Kühn',
	room: 'H 2.013',
	ects: 5,
	links: [{ label: 'Moodle', url: 'https://moodle.example/ana2' }],
	examAt: '2027-02-09T10:00',
	examRoom: 'Audimax',
	grade: '1.3'
} as const;

const heading = (page: import('@playwright/test').Page) => page.getByRole('heading', { level: 1 });
const group = (page: import('@playwright/test').Page, name: string) => page.getByRole('group', { name, exact: true });

test('Scenario: Class page shows details, todos by type and revised dates', async ({ page, request }) => {
	await setClock(request, WEDNESDAY);
	const { classes } = await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [CLASS],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [
			{ title: 'Lecture 6 notes', aspect: 0, class: 0, type: 'LEC', revisedAt: '2026-10-07' },
			{ title: 'Exercise sheet 4', aspect: 0, class: 0, type: 'EXC' }
		]
	});
	await page.goto(`/uni/classes/${classes[0]}`);

	const details = page.getByRole('region', { name: 'Details', exact: true });
	await expect(heading(page)).toHaveText('Analysis II');
	for (const text of ['Prof. Kühn', 'H 2.013', '5 ECTS', 'Moodle', 'Tue 9 Feb 2027, 10:00', 'Audimax', '1.3']) await expect(details).toContainText(text);
	await expect(details.getByRole('link', { name: 'Moodle' })).toHaveAttribute('target', '_blank');

	const open = todoRows(group(page, 'Open'));
	await expect(open).toHaveCount(2);
	const lec = todoRow(group(page, 'Open'), 'Lecture 6 notes');
	const exc = todoRow(group(page, 'Open'), 'Exercise sheet 4');
	await expect(lec.getByText('LEC', { exact: true })).toBeVisible();
	await expect(exc.getByText('EXC', { exact: true })).toBeVisible();
	await expect(lec.getByText('Revised today', { exact: true })).toBeVisible();
	await expect(lec.getByRole('button', { name: 'Clear revised date: Lecture 6 notes' })).toBeVisible();
	await expect(lec.getByRole('button', { name: /^Mark revised today/ })).toHaveCount(0);
	await expect(exc.getByText('Not revised', { exact: true })).toBeVisible();
	await expect(exc.getByRole('button', { name: 'Mark revised today: Exercise sheet 4' })).toBeVisible();
});

test('Scenario: Archived class is read-only', async ({ page, request }) => {
	await setClock(request, WEDNESDAY);
	const { classes } = await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 25/26', archivedAt: '2026-09-30T10:00:00Z' }],
		classes: [{ ...CLASS, notes: 'Formula sheet allowed.' }],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [
			{ title: 'Old sheet', aspect: 0, class: 0, type: 'EXC' },
			{ title: 'Old notes', aspect: 0, class: 0, inSprint: true, day: '2026-10-07' }
		]
	});
	await page.goto(`/uni/classes/${classes[0]}`);

	await expect(page.getByText('WS 25/26 is archived. This class is read-only.')).toBeVisible();
	const rows = todoRows(group(page, 'Open').or(group(page, 'Planned')));
	await expect(rows).toHaveCount(2);
	await expect(rows.getByRole('checkbox')).toHaveCount(0);
	await expect(rows.getByRole('combobox')).toHaveCount(0);
	await expect(rows.getByRole('button')).toHaveCount(2);
	await expect(rows.getByRole('button', { name: /^Delete todo: / })).toHaveCount(2);
	await todoRow(group(page, 'Open'), 'Old sheet').getByText('Old sheet').click();
	await expect(page.getByLabel('Edit todo')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Edit details' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Edit notes' })).toHaveCount(0);
	await expect(page.getByRole('form', { name: 'Add todo' })).toHaveCount(0);
});

test('Scenario: Class without exam and grade', async ({ page, request }) => {
	await setClock(request, WEDNESDAY);
	const { classes } = await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Operating Systems' }]
	});
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto(`/uni/classes/${classes[0]}`);

	await expect(heading(page)).toHaveText('Operating Systems');
	const details = page.getByRole('region', { name: 'Details', exact: true });
	await expect(details.getByText('Exam')).toHaveCount(0);
	await expect(details).not.toContainText(/in \d+ d|today/);
	await expect(details).toContainText('No grade yet');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
