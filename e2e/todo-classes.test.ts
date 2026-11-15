import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock, todoRow, todoRows, type SeedInput } from './helpers';

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await page.setViewportSize({ width: 1280, height: 800 });
});

const ASPECTS = [{ name: 'Health', color: 'sage', icon: 'heart' }, { name: 'Uni', color: 'lavender', icon: 'book' }] as const;
const UNI: SeedInput = {
	aspects: [...ASPECTS],
	uniAspect: 1,
	semesters: [{ name: 'WS 26/27' }, { name: 'SS 26', archivedAt: '2026-09-30T10:00:00Z' }],
	classes: [
		{ semester: 0, name: 'Analysis', color: 'sky', icon: 'book' },
		{ semester: 0, name: 'Algorithms', color: 'berry', icon: 'code' },
		{ semester: 1, name: 'Physics' }
	]
};

async function openQuickAdd(page: Page) {
	await page.goto('/backlog');
	await page.getByRole('button', { name: 'Add a todo' }).first().click();
	return page.getByRole('form', { name: 'New todo' });
}

async function openEditor(page: Page, title: string) {
	await page.getByRole('button', { name: title }).click();
	return page.getByRole('form', { name: 'Edit todo' });
}

test('Scenario: Quick add links a todo to a class', async ({ page, request }) => {
	const { classes } = await seed(request, UNI);
	const form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await form.getByLabel('Class').selectOption({ label: 'Analysis' });
	await form.getByRole('group', { name: 'Type' }).getByRole('button', { name: 'EXC' }).click();
	await form.getByLabel('Title').fill('Exercise sheet 4');
	await form.getByRole('button', { name: 'Add todo' }).click();
	await expect(todoRow(page, 'Exercise sheet 4')).toBeVisible();

	await page.getByRole('button', { name: 'Cancel' }).click();
	const editor = await openEditor(page, 'Exercise sheet 4');
	await expect(editor.getByLabel('Class')).toHaveValue(String(classes[0]));
	await expect(editor.getByRole('group', { name: 'Type' }).getByRole('button', { name: 'EXC' })).toHaveAttribute('aria-pressed', 'true');
});

test('Scenario: Class field appears only for the Uni aspect', async ({ page, request }) => {
	await seed(request, { ...UNI, todos: [{ title: 'Existing', aspect: 0 }] });
	const form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'Health' });
	await expect(form.getByLabel('Class')).toHaveCount(0);
	await expect(form.getByRole('group', { name: 'Type' })).toHaveCount(0);
	await form.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await expect(form.getByLabel('Class')).toBeVisible();
	await expect(form.getByRole('group', { name: 'Type' })).toHaveCount(0);
	await form.getByLabel('Class').selectOption({ label: 'Algorithms' });
	await expect(form.getByRole('group', { name: 'Type' })).toBeVisible();
	await expect(form.getByRole('group', { name: 'Type' }).getByRole('button', { name: 'OTH' })).toHaveAttribute('aria-pressed', 'true');
	await form.getByRole('button', { name: 'Cancel' }).click();

	const editor = await openEditor(page, 'Existing');
	await expect(editor.getByLabel('Class')).toHaveCount(0);
	await expect(editor.getByRole('group', { name: 'Type' })).toHaveCount(0);
	await editor.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await expect(editor.getByLabel('Class')).toBeVisible();
	await expect(editor.getByRole('group', { name: 'Type' })).toHaveCount(0);
	await editor.getByLabel('Class').selectOption({ label: 'Analysis' });
	await expect(editor.getByRole('group', { name: 'Type' })).toBeVisible();
});

test('Scenario: Class field lists classes of active semesters', async ({ page, request }) => {
	await seed(request, UNI);
	const form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await expect(form.getByLabel('Class').getByRole('option')).toHaveText(['No class', 'Algorithms', 'Analysis']);
});

test('Scenario: Class field is hidden without Uni aspect or classes', async ({ page, request }) => {
	await seed(request, { ...UNI, uniAspect: undefined });
	let form = await openQuickAdd(page);
	for (const name of ['Health', 'Uni']) {
		await form.getByLabel('Aspect').selectOption({ label: name });
		await expect(form.getByLabel('Class')).toHaveCount(0);
		await expect(form.getByRole('group', { name: 'Type' })).toHaveCount(0);
	}

	await reset(request);
	await seed(request, { ...UNI, classes: [{ semester: 1, name: 'Physics' }] });
	form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await expect(form.getByLabel('Class')).toHaveCount(0);
	await expect(form.getByRole('group', { name: 'Type' })).toHaveCount(0);
});

test('Scenario: Switching the aspect away drops class and type', async ({ page, request }) => {
	await seed(request, UNI);
	const form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await form.getByLabel('Class').selectOption({ label: 'Analysis' });
	await form.getByRole('group', { name: 'Type' }).getByRole('button', { name: 'LEC' }).click();
	await form.getByLabel('Aspect').selectOption({ label: 'Health' });
	await expect(form.getByLabel('Class')).toHaveCount(0);
	await expect(form.getByRole('group', { name: 'Type' })).toHaveCount(0);
	await form.getByLabel('Title').fill('Run a lap');
	await form.getByRole('button', { name: 'Add todo' }).click();

	const row = todoRow(page, 'Run a lap');
	await expect(row).toBeVisible();
	await expect(row.getByRole('link')).toHaveCount(0);
	await page.getByRole('button', { name: 'Cancel' }).click();
	const editor = await openEditor(page, 'Run a lap');
	await editor.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await expect(editor.getByLabel('Class')).toHaveValue('');
	await expect(editor.getByRole('group', { name: 'Type' })).toHaveCount(0);
});

test.describe('class badge', () => {
	// Wednesday 7 October 2026 in Berlin; its sprint week starts Monday 5 October.
	test.beforeEach(async ({ request }) => {
		await setClock(request, '2026-10-07T10:00:00Z');
	});

	test.afterAll(async ({ request }) => {
		await setClock(request, null);
	});

	test('Scenario: Linked todo shows the class badge', async ({ page, request }) => {
		const { classes } = await seed(request, {
			...UNI,
			sprint: { state: 'active', weekStart: '2026-10-05' },
			todos: [
				{ title: 'Read chapter 2', aspect: 1, class: 0, type: 'LEC' },
				{ title: 'Exercise sheet 4', aspect: 1, class: 1, type: 'EXC', inSprint: true, day: '2026-10-07' }
			]
		});
		await page.goto('/backlog');
		const backlogBadge = todoRow(page, 'Read chapter 2').getByRole('link', { name: 'Analysis' });
		await expect(backlogBadge).toHaveText('Analysis · LEC');
		await expect(backlogBadge.locator('svg')).toBeVisible();

		for (const path of ['/', '/sprint']) {
			await page.goto(path);
			const badge = todoRow(page, 'Exercise sheet 4').getByRole('link', { name: 'Algorithms' });
			await expect(badge).toHaveText('Algorithms · EXC');
			await expect(badge.locator('svg')).toBeVisible();
		}

		await page.goto('/backlog');
		await backlogBadge.click();
		await expect(page).toHaveURL(new RegExp(`/uni/classes/${classes[0]}$`));
	});

	test('Scenario: Todo without class shows no class badge', async ({ page, request }) => {
		await seed(request, { ...UNI, todos: [{ title: 'Plain uni todo', aspect: 1 }] });
		await page.goto('/backlog');
		const group = page.getByRole('main');
		await expect(todoRows(group)).toHaveCount(1);
		await expect(todoRows(group).getByRole('link')).toHaveCount(0);
	});

	test('Scenario: Class badge wraps under the title on a phone', async ({ page, request }) => {
		await seed(request, {
			...UNI,
			todos: [{ title: 'A very long todo title that cannot possibly fit on one line of a phone screen', aspect: 1, class: 0 }]
		});
		await page.setViewportSize({ width: 375, height: 800 });
		await page.goto('/backlog');
		const row = todoRows(page);
		const title = (await row.getByRole('button', { name: /^A very long todo title/ }).boundingBox())!;
		const badge = (await row.getByRole('link', { name: 'Analysis' }).boundingBox())!;
		expect(badge.y).toBeGreaterThanOrEqual(title.y + title.height - 1);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	});

	test('Scenario: Archived class todo edited via todos is rejected', async ({ page, request, baseURL }) => {
		const { todos, aspects } = await seed(request, { ...UNI, todos: [{ title: 'Old lab report', aspect: 1, class: 2 }] });
		const response = await request.post('/todos?/update', {
			headers: { origin: baseURL!, 'x-sveltekit-action': 'true' },
			form: { id: String(todos[0]), title: 'Renamed report', aspectId: String(aspects[1]), priority: '0' }
		});
		const result = await response.json();
		expect(result.type).toBe('failure');
		expect(result.status).toBe(409);
		expect(result.data).toContain('archived');

		await page.goto('/backlog');
		await expect(todoRow(page, 'Old lab report')).toBeVisible();
		await expect(todoRow(page, 'Renamed report')).toHaveCount(0);
	});

	test('Scenario: Deleting a single todo of an archived class is allowed', async ({ page, request, baseURL }) => {
		const { todos } = await seed(request, {
			...UNI,
			todos: [
				{ title: 'Old lab report', aspect: 1, class: 2 },
				{ title: 'Old lab notes', aspect: 1, class: 2 }
			]
		});
		const response = await request.post('/todos?/delete', {
			headers: { origin: baseURL!, 'x-sveltekit-action': 'true' },
			form: { id: String(todos[0]) }
		});
		expect((await response.json()).type).toBe('success');

		await page.goto('/backlog');
		await expect(todoRow(page, 'Old lab report')).toHaveCount(0);
		await expect(todoRow(page, 'Old lab notes')).toBeVisible();
	});
});
