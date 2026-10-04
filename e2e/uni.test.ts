import { expect, test, type Page } from '@playwright/test';
import { reset, seed, setClock } from './helpers';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, null);
});

const UNI = { name: 'Uni', color: 'lavender', icon: 'book' } as const;
const HEALTH = { name: 'Health', color: 'sage', icon: 'heart' } as const;

async function semesterAction(page: Page, semester: string, action: string) {
	const section = page.getByTestId('semester-section').filter({
		has: page.getByRole('heading', { name: semester, exact: true })
	});
	await section.getByRole('button', { name: 'Semester actions' }).click();
	await page.getByRole('menuitem', { name: action }).click();
}

test('Scenario: First run prompts for the Uni aspect', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH, UNI] });
	await page.goto('/uni');

	const prompt = page.getByTestId('uni-aspect-prompt');
	await expect(prompt).toBeVisible();
	await expect(page.getByTestId('semester-section')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'New semester' })).toHaveCount(0);
	await expect(prompt.getByRole('radio', { name: 'Uni' })).toBeChecked();
	await prompt.getByRole('button', { name: 'Use Uni for classes' }).click();

	await expect(prompt).toHaveCount(0);
	await expect(page.getByTestId('uni-aspect')).toHaveText('Uni');
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
	await expect(page.getByTestId('class-card')).toContainText('2 open');

	await page.getByRole('button', { name: 'Change Uni aspect' }).click();
	const prompt = page.getByTestId('uni-aspect-prompt');
	await prompt.getByRole('radio', { name: 'Health' }).check();
	await prompt.getByRole('button', { name: 'Use Health for classes' }).click();

	const dialog = page.getByRole('dialog');
	await expect(dialog).toContainText('3 todos and rules');
	await dialog.getByRole('button', { name: 'Remove 3 links and change' }).click();

	await expect(page.getByTestId('uni-aspect')).toHaveText('Health');
	await expect(page.getByTestId('class-card')).toContainText('0 open');

	// No link is left anywhere: switching back needs no confirmation.
	await page.getByRole('button', { name: 'Change Uni aspect' }).click();
	await prompt.getByRole('radio', { name: 'Uni' }).check();
	await prompt.getByRole('button', { name: 'Use Uni for classes' }).click();
	await expect(page.getByTestId('uni-aspect')).toHaveText('Uni');
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
	const prompt = page.getByTestId('uni-aspect-prompt');
	await prompt.getByRole('radio', { name: 'Health' }).check();
	await prompt.getByRole('button', { name: 'Use Health for classes' }).click();

	await expect(page.getByTestId('uni-aspect')).toHaveText('Health');
	await expect(page.getByRole('dialog')).toHaveCount(0);
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

	const active = page.locator('.semesters').getByTestId('semester-section');
	await expect(active.getByRole('heading', { level: 2 })).toHaveText(['WS 26/27', 'SS 26']);

	const group = page.getByTestId('semester-archived-group');
	const toggle = group.getByRole('button', { name: 'Archived (1)' });
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(group.getByText('WS 25/26')).toHaveCount(0);
	await toggle.click();

	const archived = group.getByTestId('semester-section');
	await expect(archived.getByRole('heading', { name: 'WS 25/26' })).toBeVisible();
	await expect(archived.getByTestId('class-card')).toHaveCount(0);
	await archived.getByRole('button', { name: 'WS 25/26' }).click();
	await expect(archived.getByTestId('class-card')).toHaveText(/Analysis I/);
	await expect(archived.getByRole('button', { name: 'New class' })).toHaveCount(0);
});

test('Scenario: No semesters shows an empty state', async ({ page, request }) => {
	await seed(request, { aspects: [UNI], uniAspect: 0 });
	await page.goto('/uni');

	await expect(page.getByTestId('empty-state').getByRole('button', { name: 'New semester' })).toBeVisible();
	await expect(page.getByTestId('semester-section')).toHaveCount(0);
});

test('Scenario: Semester without classes offers New class', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'SS 27' }]
	});
	await page.goto('/uni');

	const section = page.getByTestId('semester-section');
	await expect(section.getByTestId('class-empty')).toContainText('No classes yet.');
	await expect(section.getByTestId('class-empty').getByRole('button', { name: 'New class' })).toBeVisible();
	await expect(section.getByTestId('class-card')).toHaveCount(0);
});

test('Scenario: Phone shows one class card per row', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: ['One', 'Two', 'Three'].map((name) => ({ semester: 0, name }))
	});
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/uni');

	const boxes = await page
		.getByTestId('class-grid')
		.getByTestId('class-card')
		.evaluateAll((els) =>
			els.map((el) => {
				const r = el.getBoundingClientRect();
				return { left: r.left, top: r.top, bottom: r.bottom };
			})
		);
	expect(boxes).toHaveLength(3);
	expect(new Set(boxes.map((b) => b.left)).size).toBe(1);
	expect(boxes[1].top).toBeGreaterThanOrEqual(boxes[0].bottom);
	expect(boxes[2].top).toBeGreaterThanOrEqual(boxes[1].bottom);
});

test('Scenario: Wide desktop class grid fills the content column', async ({ page, request }) => {
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

	const grid = page.getByTestId('class-grid');
	await expect(grid.getByTestId('class-card')).toHaveCount(4);
	const { gridWidth, column, firstRow } = await grid.evaluate((el) => {
		// The page header spans the content column.
		const column = document.querySelector('h1')!.closest('header')!.getBoundingClientRect().width;
		const cards = [...el.querySelectorAll('[data-testid="class-card"]')].map((c) => c.getBoundingClientRect().top);
		return {
			gridWidth: el.getBoundingClientRect().width,
			column,
			firstRow: cards.filter((top) => top === cards[0]).length
		};
	});
	expect(Math.abs(gridWidth - column)).toBeLessThanOrEqual(2);
	expect(Math.abs(column - 720), 'the 720 px column cap binds at 1600').toBeLessThanOrEqual(2);
	expect(firstRow).toBeGreaterThan(1);
});

test('Scenario: Card shows the class summary', async ({ page, request }) => {
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

	const card = page.getByTestId('class-grid').getByTestId('class-card');
	await expect(card.locator('svg').first()).toBeVisible();
	await expect(card).toContainText('Analysis II');
	await expect(card).toContainText('Prof. Kühn');
	await expect(card.getByTestId('class-open')).toHaveText('2 open');
	await expect(card.getByTestId('class-next-due')).toHaveText('Thu 8 Oct');
	await expect(card.getByTestId('class-exam')).toHaveText('Exam in 12 d');
	await expect(card.getByTestId('class-grade')).toHaveText('1.3');
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

	const cards = page.getByTestId('class-grid').getByTestId('class-card');
	await expect(cards.filter({ hasText: 'Theoretical CS' }).getByTestId('class-exam')).toHaveText('Exam today');
	await expect(cards.filter({ hasText: 'Algorithms' }).getByTestId('class-exam')).toHaveCount(0);
});

test('Scenario: Sparse card keeps the row height', async ({ page, request }) => {
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

	const cards = page.getByTestId('class-grid').getByTestId('class-card');
	const sparse = cards.filter({ hasText: 'Operating Systems' });
	await expect(sparse).toHaveText(/^\s*Operating Systems\s*0 open\s*$/);
	await expect(sparse.locator('svg')).toHaveCount(1);
	const [full, thin] = await cards.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
	expect(thin.top).toBe(full.top);
	expect(Math.abs(thin.height - full.height)).toBeLessThanOrEqual(1);
});

test('Scenario: New semester appears among the active ones', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'SS 26', createdAt: '2026-04-01T10:00:00Z' }]
	});
	await page.goto('/uni');

	await page.getByRole('button', { name: 'New semester' }).click();
	await page.getByLabel('Semester name').fill('WS 26/27');
	await page.getByRole('button', { name: 'Add semester' }).click();

	const sections = page.locator('.semesters').getByTestId('semester-section');
	await expect(sections.getByRole('heading', { level: 2 })).toHaveText(['WS 26/27', 'SS 26']);
	await expect(sections.first().getByTestId('class-card')).toHaveCount(0);
	await expect(sections.first().getByTestId('class-empty')).toBeVisible();
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

	const section = page.getByTestId('semester-section');
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

	const section = page.getByTestId('semester-section');
	await section.getByRole('button', { name: 'New class' }).click();
	await section.getByLabel('Name').fill('Databases');
	await section.getByRole('radio', { name: 'Berry' }).check();
	await section.getByRole('radio', { name: 'Code' }).check();
	await section.getByRole('button', { name: 'Add class' }).click();

	const card = section.getByTestId('class-grid').getByTestId('class-card');
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
		probe.style.color = 'var(--aspect-berry)';
		probe.style.backgroundColor = 'var(--aspect-berry-tint)';
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

	const section = page.getByTestId('semester-section');
	await section.getByRole('button', { name: 'New class' }).click();
	await section.getByLabel('ECTS').fill('-1');
	await section.getByRole('button', { name: 'Add class' }).click();
	await expect(section.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
	await expect(section.getByRole('alert')).toHaveText('Give it a name.');

	// The server reports one field at a time; with the name fixed, ECTS is next.
	await section.getByLabel('Name').fill('Analysis II');
	await section.getByRole('button', { name: 'Add class' }).click();
	await expect(section.getByLabel('ECTS')).toHaveAttribute('aria-invalid', 'true');
	await expect(section.getByRole('alert')).toHaveText(/ECTS/);
	await expect(section.getByLabel('Name')).toHaveValue('Analysis II');
	await expect(section.getByTestId('class-card')).toHaveCount(0);
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

	await expect(page.locator('.semesters').getByTestId('semester-section')).toHaveCount(0);
	const group = page.getByTestId('semester-archived-group');
	await group.getByRole('button', { name: 'Archived (1)' }).click();
	const archived = group.getByTestId('semester-section');
	await expect(archived.getByTestId('class-card')).toHaveCount(0);
	await archived.getByRole('button', { name: 'WS 26/27' }).click();
	await expect(archived.getByTestId('class-card')).toContainText('0 open');

	// Unarchiving shows the class among the active ones again, with every todo done.
	await archived.getByRole('button', { name: 'Unarchive' }).click();
	await expect(page.getByTestId('semester-archived-group')).toHaveCount(0);
	await expect(page.locator('.semesters').getByTestId('class-card')).toContainText('0 open');
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
	await expect(page.locator('.semesters').getByTestId('semester-section')).toHaveCount(1);
	await expect(page.getByTestId('semester-archived-group')).toHaveCount(0);
	await expect(page.getByTestId('class-card')).toContainText('1 open');
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
	await expect(page.getByTestId('semester-archived-group').getByRole('button', { name: 'Archived (1)' })).toBeVisible();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.locator('.semesters').getByTestId('semester-section')).toHaveCount(0);
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
	await expect(page.getByTestId('class-grid').getByTestId('class-card')).toHaveCount(2);

	await semesterAction(page, 'SS 26', 'Delete');
	await page.getByRole('dialog').getByRole('button', { name: 'Delete semester' }).click();
	await expect(page.getByTestId('semester-section')).toHaveCount(0);
	await expect(page.getByTestId('empty-state')).toBeVisible();
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
	await expect(page.getByTestId('semester-section')).toHaveCount(0);
});
