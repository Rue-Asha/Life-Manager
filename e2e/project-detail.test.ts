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
	{ name: 'IT', color: 'sky', icon: 'briefcase' }
];

const PROJECT = {
	name: 'Life Manager',
	description: 'Weekly-sprint planner',
	repoUrl: 'https://github.com/rue-asha/life-manager',
	tags: ['SvelteKit', 'SQLite'],
	status: 'backlog' as const
};

// Seeds the IT aspect (index 1) with one project and returns its id.
async function seedProject(
	request: Parameters<typeof seed>[0],
	extra: Partial<SeedInput> = {},
	project: Partial<NonNullable<SeedInput['projects']>[number]> = {}
) {
	const ids = await seed(request, {
		aspects: ASPECTS,
		itAspect: 1,
		projects: [{ ...PROJECT, ...project }],
		...extra
	});
	return ids.projects[0];
}

const heading = (page: Page) => page.getByRole('heading', { level: 1 });
const pill = (page: Page) => page.getByTestId('status-pill');

test('Scenario: Metadata sits in the rail at 1280', async ({ page, request }) => {
	const id = await seedProject(request);
	for (const width of [1280, 1600]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(`/projects/${id}`);

		const rail = page.getByTestId('context-rail');
		await expect(rail).toBeVisible();
		const meta = rail.getByTestId('project-meta');
		await expect(meta).toContainText('rue-asha/life-manager');
		await expect(meta).toContainText('SvelteKit');
		await expect(meta).toContainText('SQLite');
		await expect(meta).toContainText('Created');
		await expect(meta).toContainText('Updated');
		await expect(page.getByTestId('project-meta')).toHaveCount(1);
	}
});

test('Scenario: Metadata wraps under the title below 1280', async ({ page, request }) => {
	const id = await seedProject(request);
	for (const width of [1100, 375]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(`/projects/${id}`);

		await expect(page.getByTestId('context-rail')).toHaveCount(0);
		await expect(page.getByTestId('rail-toggle')).toHaveCount(0);
		const meta = page.getByTestId('project-meta');
		await expect(meta).toBeVisible();
		await expect(meta).toContainText('life-manager');
		await expect(meta).toContainText('SvelteKit');
		await expect(meta).toContainText('SQLite');
		await expect(meta).toContainText('Created');
		await expect(meta).toContainText('Updated');
		const title = await heading(page).boundingBox();
		const row = await meta.boundingBox();
		expect(row!.y).toBeGreaterThan(title!.y + title!.height - 1);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	}
});

test('Scenario: Unknown project id shows 404', async ({ page, request }) => {
	const id = await seedProject(request);
	const response = await page.goto(`/projects/${id + 100}`);

	expect(response?.status()).toBe(404);
	await page.getByRole('main').getByRole('link', { name: 'Projects' }).click();
	await expect(page).toHaveURL(/\/projects$/);
});

test('Scenario: Edit metadata on the detail page', async ({ page, request }) => {
	const id = await seedProject(request);
	await page.goto(`/projects/${id}`);

	await page.getByRole('button', { name: 'Edit details' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByLabel('Name').fill('  ');
	await dialog.getByRole('button', { name: 'Save' }).click();
	await expect(dialog).toContainText('Give the project a name.');
	await dialog.getByLabel('Name').fill('Life Manager 2');
	await dialog.getByLabel('Repository URL').fill('ftp://host/repo');
	await dialog.getByRole('button', { name: 'Save' }).click();
	await expect(dialog).toContainText('Enter a link starting with http');

	await dialog.getByLabel('Repository URL').fill('https://github.com/rue-asha/lm2');
	await dialog.getByLabel('Description').fill('A new description');
	await dialog.getByLabel('Tags').fill('Node, Vite, Node');
	await dialog.getByRole('button', { name: 'Save' }).click();
	await expect(dialog).toBeHidden();

	const check = async () => {
		await expect(heading(page)).toHaveText('Life Manager 2');
		await expect(page.getByText('A new description')).toBeVisible();
		const meta = page.getByTestId('project-meta');
		await expect(meta).toContainText('rue-asha/lm2');
		await expect(meta).toContainText('Node');
		await expect(meta).toContainText('Vite');
		await expect(meta).not.toContainText('SvelteKit');
	};
	await check();
	await page.reload();
	await check();
});

test('Scenario: Notes are edited as Markdown and shown rendered', async ({ page, request }) => {
	const id = await seedProject(request);
	await page.goto(`/projects/${id}`);

	const notes = page.getByTestId('project-notes');
	await notes.getByRole('button', { name: 'Edit notes' }).click();
	await notes.getByRole('textbox', { name: 'Notes' }).fill('## Ideas\n\n- **dark mode**');
	await notes.getByRole('button', { name: 'Save' }).click();

	await expect(notes.getByRole('heading', { level: 2, name: 'Ideas' })).toBeVisible();
	await expect(notes.getByRole('listitem').filter({ hasText: 'dark mode' }).locator('strong')).toHaveText('dark mode');
	await expect(notes.getByRole('textbox', { name: 'Notes' })).toHaveCount(0);

	await page.reload();
	await notes.getByRole('button', { name: 'Edit notes' }).click();
	await expect(notes.getByRole('textbox', { name: 'Notes' })).toHaveValue('## Ideas\n\n- **dark mode**');
});

test('Scenario: Empty notes show a placeholder', async ({ page, request }) => {
	const id = await seedProject(request);
	await page.goto(`/projects/${id}`);

	await expect(page.getByTestId('project-notes')).toContainText('No notes yet');
	await page.getByTestId('project-notes').getByRole('button', { name: 'Edit notes' }).click();
	await expect(page.getByRole('textbox', { name: 'Notes' })).toHaveValue('');
});

test('Scenario: Long notes are not truncated', async ({ page, request }) => {
	const notes = Array.from({ length: 200 }, (_, i) => `Line ${i + 1}`).join('\n\n');
	const id = await seedProject(request, {}, { notes });
	await page.setViewportSize({ width: 375, height: 700 });
	await page.goto(`/projects/${id}`);

	await page.getByText('Line 200', { exact: true }).scrollIntoViewIfNeeded();
	await expect(page.getByText('Line 200', { exact: true })).toBeInViewport();
	const own = await page.getByTestId('project-notes').evaluate((el) => {
		const body = el.querySelector('.notes')!;
		return { overflow: getComputedStyle(body).overflowY, grows: body.scrollHeight <= body.clientHeight + 1 };
	});
	expect(own).toEqual({ overflow: 'visible', grows: true });
});
