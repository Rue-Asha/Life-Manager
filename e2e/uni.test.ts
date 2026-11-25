import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock } from './helpers';
import {
	activeSemesters,
	archivedGroup,
	classCards,
	classGrid,
	emptyState,
	notesRegion,
	semesterSection,
	semesterSections,
	sheet,
	sprintTodos,
	uniAspect,
	uniPanel,
	uniPrompt
} from './uni-locators';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, null);
});

const UNI = { name: 'Uni', color: 'lavender', icon: 'book' } as const;
const HEALTH = { name: 'Health', color: 'sage', icon: 'heart' } as const;

async function semesterAction(page: Page, semester: string, action: string) {
	const section = semesterSection(page, semester);
	await section.getByRole('button', { name: 'Semester actions' }).click();
	await page.getByRole('menuitem', { name: action }).click();
}

test('Scenario: First run prompts for the Uni aspect', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH, UNI] });
	await page.goto('/uni');

	const prompt = uniPrompt(page);
	await expect(prompt).toBeVisible();
	await expect(semesterSections(page)).toHaveCount(0);
	await expect(sprintTodos(page)).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'New semester' })).toHaveCount(0);
	await expect(prompt.getByRole('radio', { name: 'Uni' })).toBeChecked();
	await prompt.getByRole('button', { name: 'Use Uni for classes' }).click();

	await expect(prompt).toHaveCount(0);
	await expect(uniAspect(page)).toHaveText('Uni');
	await expect(page.getByRole('button', { name: 'New semester' }).first()).toBeVisible();
});

test('Scenario: Changing the Uni aspect removes links after confirmation', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI, HEALTH],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II' }],
		todos: [
			{ title: 'Sheet 1', aspect: 0, class: 0, type: 'EXC' },
			{
				title: 'Sheet 2',
				aspect: 0,
				class: 0,
				type: 'EXC',
				revisedAt: '2026-10-01'
			}
		],
		rules: [
			{
				title: 'Lecture notes',
				aspect: 0,
				weekdays: [1],
				class: 0,
				type: 'LEC'
			}
		]
	});
	await page.goto('/uni');
	await expect(classCards(page)).toContainText('2 open');

	await page.getByRole('button', { name: 'Change Uni aspect' }).click();
	const prompt = uniPrompt(page);
	await prompt.getByRole('radio', { name: 'Health' }).check();
	await prompt.getByRole('button', { name: 'Use Health for classes' }).click();

	const dialog = page.getByRole('dialog', { name: 'Use Health for classes?' });
	await expect(dialog).toContainText('3 todos and rules');
	await dialog.getByRole('button', { name: 'Remove 3 links and change' }).click();

	await expect(uniAspect(page)).toHaveText('Health');
	await expect(classCards(page)).toContainText('No open todos');

	// No link is left anywhere: switching back needs no confirmation.
	await page.getByRole('button', { name: 'Change Uni aspect' }).click();
	await prompt.getByRole('radio', { name: 'Uni' }).check();
	await prompt.getByRole('button', { name: 'Use Uni for classes' }).click();
	await expect(uniAspect(page)).toHaveText('Uni');
	await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Scenario: Changing the Uni aspect without links needs no confirmation', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI, HEALTH],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II' }]
	});
	await page.goto('/uni');

	await page.getByRole('button', { name: 'Change Uni aspect' }).click();
	const prompt = uniPrompt(page);
	await prompt.getByRole('radio', { name: 'Health' }).check();
	await prompt.getByRole('button', { name: 'Use Health for classes' }).click();

	await expect(uniAspect(page)).toHaveText('Health');
	await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Scenario: Uni notes are edited as Markdown below the classes', async ({ page, request }) => {
	await seed(request, { aspects: [UNI], uniAspect: 0, semesters: [{ name: 'WS 26/27' }] });
	await page.setViewportSize({ width: 1100, height: 900 });
	await page.goto('/uni');

	const notes = notesRegion(page);
	await expect(notes).toContainText('No notes yet');
	await notes.getByRole('button', { name: 'Edit notes' }).click();
	await notes.getByRole('textbox', { name: 'Notes' }).fill('# Studienplan\n\n| Modul | CP |\n|---|---|\n| Netzsicherheit | 6 |');
	await notes.getByRole('button', { name: 'Save' }).click();

	await expect(notes.getByRole('heading', { level: 1, name: 'Studienplan' })).toBeVisible();
	await expect(notes.getByRole('cell', { name: 'Netzsicherheit' })).toBeVisible();
	const semester = await semesterSections(page).first().boundingBox();
	const block = await notes.boundingBox();
	expect(block!.y).toBeGreaterThan(semester!.y + semester!.height);

	await page.reload();
	await expect(notes.getByRole('heading', { level: 1, name: 'Studienplan' })).toBeVisible();
});

test('Scenario: Without aspects Uni leads to creating one', async ({ page }) => {
	await page.goto('/uni');
	await expect(page).toHaveURL(/\/welcome$/);
});

const NOW = '2026-10-05T10:00:00Z'; // Monday, today = 2026-10-05

test('Scenario: Semesters are listed newest first with archived ones collapsed', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [
			{ name: 'SS 26', createdAt: '2026-04-01T10:00:00Z' },
			{ name: 'WS 26/27', createdAt: '2026-10-01T10:00:00Z' },
			{
				name: 'WS 25/26',
				createdAt: '2025-10-01T10:00:00Z',
				archivedAt: '2026-03-31T10:00:00Z'
			}
		],
		classes: [
			{ semester: 0, name: 'Algorithms' },
			{ semester: 1, name: 'Analysis II' },
			{ semester: 2, name: 'Analysis I' }
		]
	});
	await page.goto('/uni');

	const active = semesterSections(activeSemesters(page));
	await expect(active.getByRole('heading', { level: 2 })).toHaveText(['WS 26/27', 'SS 26']);

	const group = archivedGroup(page);
	const toggle = group.getByRole('button', { name: 'Archived (1)' });
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(group.getByText('WS 25/26')).toBeHidden();
	await toggle.click();

	const archived = semesterSections(group);
	await expect(archived.getByRole('heading', { name: 'WS 25/26' })).toBeVisible();
	await expect(classCards(archived)).toHaveCount(0);
	await archived.getByRole('button', { name: 'WS 25/26', exact: true }).click();
	await expect(classCards(archived)).toHaveText(/Analysis I/);
	await expect(archived.getByRole('button', { name: 'New class' })).toHaveCount(0);
});

test('Scenario: No semesters shows an empty state', async ({ page, request }) => {
	await seed(request, { aspects: [UNI], uniAspect: 0 });
	await page.goto('/uni');

	await expect(emptyState(page)).toBeVisible();
	await expect(page.getByRole('region', { name: 'Start with the semester you are in now' }).getByRole('button', { name: 'New semester' })).toBeVisible();
	await expect(semesterSections(page)).toHaveCount(0);
	await expect(sprintTodos(page)).toHaveCount(0);
});

test('Scenario: Semester without classes offers New class', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'SS 27' }]
	});
	await page.goto('/uni');

	const section = semesterSections(page);
	await expect(section.getByRole('heading', { name: 'No classes yet' })).toBeVisible();
	await expect(section.getByRole('button', { name: 'New class' })).toBeVisible();
	await expect(classCards(section)).toHaveCount(0);
});

test('Scenario: Classes are one row each', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: ['One', 'Two', 'Three'].map((name) => ({ semester: 0, name }))
	});
	for (const width of [375, 1600]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/uni');

		const boxes = await classCards(page).evaluateAll((els) =>
			els.map((el) => {
				const r = el.getBoundingClientRect();
				return { left: r.left, top: r.top, bottom: r.bottom };
			})
		);
		expect(boxes).toHaveLength(3);
		expect(new Set(boxes.map((b) => b.left)).size).toBe(1);
		expect(boxes[1].top).toBeGreaterThanOrEqual(boxes[0].bottom - 1);
		expect(boxes[2].top).toBeGreaterThanOrEqual(boxes[1].bottom - 1);
	}
});

test('Scenario: Semester card fills the main column at 1600', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: ['One', 'Two', 'Three', 'Four'].map((name) => ({
			semester: 0,
			name
		}))
	});
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/uni');

	await expect(classCards(page)).toHaveCount(4);
	const column = (await activeSemesters(page).boundingBox())!;
	const card = (await semesterSections(page).first().boundingBox())!;
	const panel = (await uniPanel(page).boundingBox())!;
	expect(Math.abs(card.width - column.width)).toBeLessThanOrEqual(2);
	expect(panel.x).toBeGreaterThanOrEqual(column.x + column.width);
});

test('Scenario: Row shows the class summary', async ({ page, request }) => {
	await setClock(request, NOW);
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [
			{
				semester: 0,
				name: 'Analysis II',
				color: 'sky',
				icon: 'book',
				lecturer: 'Prof. Kühn',
				examAt: '2026-10-17T10:00',
				grade: '1.3'
			}
		],
		todos: [
			{ title: 'Sheet 1', aspect: 0, class: 0, dueDate: '2026-10-08' },
			{ title: 'Sheet 2', aspect: 0, class: 0, dueDate: '2026-10-10' },
			{
				title: 'Sheet 0',
				aspect: 0,
				class: 0,
				dueDate: '2026-10-01',
				status: 'done'
			}
		]
	});
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/uni');

	const card = classCards(page);
	await expect(card.locator('svg').first()).toBeVisible();
	await expect(card).toContainText('Analysis II');
	await expect(card).toContainText('Prof. Kühn');
	await expect(card.getByText(/ open$/)).toHaveText('2 open');
	await expect(card.getByText('Next due Thu 8 Oct', { exact: true })).toBeVisible();
	await expect(card.getByText(/^Exam /)).toHaveText('Exam in 12 d');
	await expect(card.getByLabel('Grade 1.3', { exact: true })).toHaveText('1.3');
	await expect(card).toHaveAttribute('href', /\/uni\/classes\/\d+$/);
});

test('Scenario: Exam today and past exams', async ({ page, request }) => {
	await setClock(request, NOW);
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [
			{ semester: 0, name: 'Theoretical CS', examAt: '2026-10-05T10:00' },
			{ semester: 0, name: 'Algorithms', examAt: '2026-10-04' }
		]
	});
	await page.goto('/uni');

	const cards = classCards(page);
	await expect(cards.filter({ hasText: 'Theoretical CS' }).getByText(/^Exam /)).toHaveText('Exam today');
	await expect(cards.filter({ hasText: 'Algorithms' }).getByText(/^Exam /)).toHaveCount(0);
});

test('Scenario: Sparse class row leaves the missing bits out', async ({ page, request }) => {
	await setClock(request, NOW);
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [
			{
				semester: 0,
				name: 'Analysis II',
				lecturer: 'Prof. Kühn',
				examAt: '2026-10-17',
				grade: '1.3'
			},
			{ semester: 0, name: 'Operating Systems' }
		],
		todos: [{ title: 'Sheet 1', aspect: 0, class: 0, dueDate: '2026-10-08' }]
	});
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/uni');

	const cards = classCards(page);
	await expect(cards).toHaveCount(2);
	const sparse = cards.filter({ hasText: 'Operating Systems' });
	await expect(sparse).toHaveText(/^\s*Operating Systems\s*No open todos\s*$/);
	await expect(sparse.getByLabel(/^Grade /)).toHaveCount(0);
	await expect(sparse.getByText(/^(Next due|Overdue|Exam)/)).toHaveCount(0);
	await expect(sparse.locator('.nav-tile svg')).toHaveCount(1);
});

test('Scenario: New semester appears among the active ones', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'SS 26', createdAt: '2026-04-01T10:00:00Z' }]
	});
	await page.goto('/uni');

	await page.getByRole('button', { name: 'New semester' }).click();
	const dialog = sheet(page, 'New semester');
	await dialog.getByLabel('Semester name').fill('WS 26/27');
	await dialog.getByRole('button', { name: 'Add semester' }).click();

	const sections = semesterSections(activeSemesters(page));
	await expect(sections.getByRole('heading', { level: 2 })).toHaveText(['WS 26/27', 'SS 26']);
	await expect(classCards(sections.first())).toHaveCount(0);
	await expect(sections.first().getByRole('heading', { name: 'No classes yet' })).toBeVisible();
});

test('Scenario: Rename a semester', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }]
	});
	await page.goto('/uni');

	await semesterAction(page, 'WS 26/27', 'Rename');
	await page.getByLabel('Semester name').fill('Winter 26/27');
	await page.getByRole('button', { name: 'Save' }).click();

	const section = semesterSections(page);
	await expect(section.getByRole('heading', { level: 2 })).toHaveText('Winter 26/27');
	await page.reload();
	await expect(section.getByRole('heading', { level: 2 })).toHaveText('Winter 26/27');
});

test('Scenario: Add a class from the semester section', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }]
	});
	await page.goto('/uni');

	const section = semesterSections(page);
	await section.getByRole('button', { name: 'New class' }).click();
	const dialog = sheet(page, 'New class');
	await dialog.getByLabel('Name').fill('Databases');
	await dialog.getByRole('radio', { name: 'Berry' }).check();
	await dialog.getByRole('radio', { name: 'Code' }).check();
	await dialog.getByRole('button', { name: 'Add class' }).click();

	const card = classCards(section);
	await expect(card).toHaveCount(1);
	await expect(card).toContainText('Databases');
	const { tile, icon } = await card
		.locator('svg')
		.first()
		.evaluate((svg) => ({
			tile: getComputedStyle(svg.parentElement!).backgroundColor,
			icon: getComputedStyle(svg).color
		}));
	const expected = await page.evaluate(() => {
		const probe = document.createElement('span');
		document.body.append(probe);
		probe.style.color = 'var(--aspect-ink)';
		probe.style.backgroundColor = 'var(--aspect-berry)';
		const style = getComputedStyle(probe);
		const result = { icon: style.color, tile: style.backgroundColor };
		probe.remove();
		return result;
	});
	expect({ tile, icon }).toEqual(expected);
});

test('Scenario: Field errors show on the class form', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }]
	});
	await page.goto('/uni');

	const section = semesterSections(page);
	await section.getByRole('button', { name: 'New class' }).click();
	const dialog = sheet(page, 'New class');
	await dialog.getByLabel('ECTS').fill('-1');
	await dialog.getByRole('button', { name: 'Add class' }).click();
	await expect(dialog.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
	await expect(dialog.getByLabel('ECTS')).toHaveAttribute('aria-invalid', 'true');
	await expect(dialog.getByRole('alert')).toHaveText(['Give it a name.', /ECTS/]);
	await expect(dialog.getByLabel('ECTS')).toHaveValue('-1');
	await expect(classCards(section)).toHaveCount(0);
});

test('Scenario: Archiving with open todos asks for confirmation', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II' }],
		todos: [
			{ title: 'Open 1', aspect: 0, class: 0 },
			{ title: 'Open 2', aspect: 0, class: 0, inSprint: true },
			{ title: 'Done', aspect: 0, class: 0, status: 'done' }
		],
		sprint: { state: 'active' }
	});
	await page.goto('/uni');

	await semesterAction(page, 'WS 26/27', 'Archive');
	const dialog = page.getByRole('dialog');
	await expect(dialog).toContainText('2 class todos are still open');
	await dialog.getByRole('button', { name: 'Mark 2 done and archive' }).click();

	await expect(semesterSections(activeSemesters(page))).toHaveCount(0);
	const group = archivedGroup(page);
	await group.getByRole('button', { name: 'Archived (1)' }).click();
	const archived = semesterSections(group);
	await expect(classCards(archived)).toHaveCount(0);
	await archived.getByRole('button', { name: 'WS 26/27', exact: true }).click();
	await expect(classCards(archived)).toContainText('No open todos');
	await expect(archived.getByText('Read-only.')).toBeVisible();

	// Unarchiving shows the class among the active ones again, with every todo done.
	await archived.getByRole('button', { name: 'Semester actions' }).click();
	await page.getByRole('menuitem', { name: 'Unarchive' }).click();
	await expect(archivedGroup(page)).toHaveCount(0);
	await expect(classCards(activeSemesters(page))).toContainText('No open todos');
});

test('Scenario: Cancelling the archive warning changes nothing', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II' }],
		todos: [{ title: 'Open 1', aspect: 0, class: 0 }]
	});
	await page.goto('/uni');

	await semesterAction(page, 'WS 26/27', 'Archive');
	await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);

	await page.reload();
	await expect(semesterSections(activeSemesters(page))).toHaveCount(1);
	await expect(archivedGroup(page)).toHaveCount(0);
	await expect(classCards(page)).toContainText('1 open');
});

test('Scenario: Archiving without open todos needs no confirmation', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II' }],
		todos: [{ title: 'Done', aspect: 0, class: 0, status: 'done' }]
	});
	await page.goto('/uni');

	await semesterAction(page, 'WS 26/27', 'Archive');
	await expect(archivedGroup(page).getByRole('button', { name: 'Archived (1)' })).toBeVisible();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(semesterSections(activeSemesters(page))).toHaveCount(0);
});

test('Scenario: Deleting a semester asks for confirmation naming counts', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'SS 26' }],
		classes: [
			{ semester: 0, name: 'Algorithms' },
			{ semester: 0, name: 'Databases' }
		],
		todos: [
			{ title: 'A', aspect: 0, class: 0 },
			{ title: 'B', aspect: 0, class: 0, status: 'done' },
			{ title: 'C', aspect: 0, class: 1 },
			{ title: 'D', aspect: 0, class: 1 },
			{ title: 'E', aspect: 0, class: 1, status: 'done' }
		]
	});
	await page.goto('/uni');

	await semesterAction(page, 'SS 26', 'Delete');
	const dialog = page.getByRole('dialog');
	await expect(dialog).toContainText('2 classes and 5 todos');
	await dialog.getByRole('button', { name: 'Cancel' }).click();
	await page.reload();
	await expect(classCards(page)).toHaveCount(2);

	await semesterAction(page, 'SS 26', 'Delete');
	await page.getByRole('dialog').getByRole('button', { name: 'Delete semester' }).click();
	await expect(semesterSections(page)).toHaveCount(0);
	await expect(emptyState(page)).toBeVisible();
});

test('Scenario: Deleting an empty semester uses a plain confirm', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'SS 27' }]
	});
	await page.goto('/uni');

	await semesterAction(page, 'SS 27', 'Delete');
	const dialog = page.getByRole('dialog');
	await expect(dialog).toContainText('Delete SS 27?');
	await expect(dialog).not.toContainText(/\d+ (class|todo)/);
	await dialog.getByRole('button', { name: 'Delete semester' }).click();
	await expect(semesterSections(page)).toHaveCount(0);
});

test('Scenario: Grades are shown on the overview', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'SS 26' }],
		classes: [
			{ semester: 0, name: 'A', grade: '1.3', ects: 5 },
			{ semester: 0, name: 'B', grade: '2.7', ects: 10 },
			{ semester: 0, name: 'C', grade: 'passed', ects: 5 },
			{ semester: 0, name: 'D', grade: '5.0', ects: 5 },
			{ semester: 0, name: 'E', grade: '1.0' }
		]
	});
	await page.goto('/uni');

	const header = semesterSections(page).getByText(/^Average/);
	await expect(header).toContainText('2.23');
	await expect(header).toContainText('20 ECTS');
	await expect(page.getByText(/^Overall average/)).toContainText('2.23');
	await expect(page.getByText(/^Overall average/)).toContainText('20 ECTS');
});

test('Scenario: No grades shows a dash', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'SS 26' }],
		classes: [{ semester: 0, name: 'A', ects: 5 }]
	});
	await page.goto('/uni');

	await expect(semesterSections(page).getByText(/^Average/)).toContainText('Average — ·');
	await expect(page.getByText(/^Overall average/)).toContainText('Overall average — ·');
});
