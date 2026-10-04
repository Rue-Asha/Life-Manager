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
