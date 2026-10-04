import { expect, test, type Page } from '@playwright/test';
import { reset, seed, type SeedInput } from './helpers';

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
	await form.getByTestId('type-field').getByRole('button', { name: 'EXC' }).click();
	await form.getByLabel('Title').fill('Exercise sheet 4');
	await form.getByRole('button', { name: 'Add todo' }).click();
	await expect(page.getByTestId('todo-row').filter({ hasText: 'Exercise sheet 4' })).toBeVisible();

	await page.getByRole('button', { name: 'Cancel' }).click();
	const editor = await openEditor(page, 'Exercise sheet 4');
	await expect(editor.getByLabel('Class')).toHaveValue(String(classes[0]));
	await expect(editor.getByTestId('type-field').getByRole('button', { name: 'EXC' })).toHaveAttribute('aria-pressed', 'true');
});

test('Scenario: Class field appears only for the Uni aspect', async ({ page, request }) => {
	await seed(request, { ...UNI, todos: [{ title: 'Existing', aspect: 0 }] });
	const form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'Health' });
	await expect(form.getByTestId('class-field')).toHaveCount(0);
	await expect(form.getByTestId('type-field')).toHaveCount(0);
	await form.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await expect(form.getByTestId('class-field')).toBeVisible();
	await expect(form.getByTestId('type-field')).toHaveCount(0);
	await form.getByLabel('Class').selectOption({ label: 'Algorithms' });
	await expect(form.getByTestId('type-field')).toBeVisible();
	await expect(form.getByTestId('type-field').getByRole('button', { name: 'OTH' })).toHaveAttribute('aria-pressed', 'true');
	await form.getByRole('button', { name: 'Cancel' }).click();

	const editor = await openEditor(page, 'Existing');
	await expect(editor.getByTestId('class-field')).toHaveCount(0);
	await expect(editor.getByTestId('type-field')).toHaveCount(0);
	await editor.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await expect(editor.getByTestId('class-field')).toBeVisible();
	await expect(editor.getByTestId('type-field')).toHaveCount(0);
	await editor.getByLabel('Class').selectOption({ label: 'Analysis' });
	await expect(editor.getByTestId('type-field')).toBeVisible();
});

test('Scenario: Class field lists classes of active semesters', async ({ page, request }) => {
	await seed(request, UNI);
	const form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await expect(form.getByLabel('Class').locator('option')).toHaveText(['No class', 'Algorithms', 'Analysis']);
});

test('Scenario: Class field is hidden without Uni aspect or classes', async ({ page, request }) => {
	await seed(request, { ...UNI, uniAspect: undefined });
	let form = await openQuickAdd(page);
	for (const name of ['Health', 'Uni']) {
		await form.getByLabel('Aspect').selectOption({ label: name });
		await expect(form.getByTestId('class-field')).toHaveCount(0);
		await expect(form.getByTestId('type-field')).toHaveCount(0);
	}

	await reset(request);
	await seed(request, { ...UNI, classes: [{ semester: 1, name: 'Physics' }] });
	form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await expect(form.getByTestId('class-field')).toHaveCount(0);
	await expect(form.getByTestId('type-field')).toHaveCount(0);
});

test('Scenario: Switching the aspect away drops class and type', async ({ page, request }) => {
	await seed(request, UNI);
	const form = await openQuickAdd(page);
	await form.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await form.getByLabel('Class').selectOption({ label: 'Analysis' });
	await form.getByTestId('type-field').getByRole('button', { name: 'LEC' }).click();
	await form.getByLabel('Aspect').selectOption({ label: 'Health' });
	await expect(form.getByTestId('class-field')).toHaveCount(0);
	await expect(form.getByTestId('type-field')).toHaveCount(0);
	await form.getByLabel('Title').fill('Run a lap');
	await form.getByRole('button', { name: 'Add todo' }).click();

	const row = page.getByTestId('todo-row').filter({ hasText: 'Run a lap' });
	await expect(row).toBeVisible();
	await expect(row.getByTestId('class-badge')).toHaveCount(0);
	await page.getByRole('button', { name: 'Cancel' }).click();
	const editor = await openEditor(page, 'Run a lap');
	await editor.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await expect(editor.getByLabel('Class')).toHaveValue('');
	await expect(editor.getByTestId('type-field')).toHaveCount(0);
});
