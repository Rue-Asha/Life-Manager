import { expect, test, type Page } from '@playwright/test';
import { reset, seed, setClock } from './helpers';

// Sunday 11 October 2026 in Berlin: the sprint of 5–11 October is still running and its review is open.
const SUNDAY = '2026-10-11T10:00:00Z';
const WEEK = '2026-10-05';

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

async function expectCentred(page: Page, name: string, tolerance = 8) {
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	const { column, free } = await page.evaluate(() => {
		const main = document.querySelector('main')!.getBoundingClientRect();
		const sidebar = document.querySelector('main')!.previousElementSibling!.getBoundingClientRect();
		const width = document.documentElement.clientWidth;
		return { column: main.left + main.width / 2, free: sidebar.right + (width - sidebar.right) / 2 };
	});
	expect(Math.abs(column - free), `${name} column is off-centre`).toBeLessThanOrEqual(tolerance);
}

const seedSunday = (request: Parameters<typeof seed>[0]) =>
	seed(request, {
		aspects: [{ name: 'Health' }, { name: 'IT' }],
		itAspect: 1,
		projects: [{ name: 'Life Manager', status: 'active', tags: ['SvelteKit'], repoUrl: 'https://github.com/rue-asha/life-manager' }],
		sprint: { state: 'active', weekStart: WEEK },
		rules: [{ title: 'Gym', weekdays: [1, 4] }],
		todos: [{ title: 'Morning run', inSprint: true, day: '2026-10-11' }, { title: 'Read chapter 4' }]
	});

test('Scenario: Screens without a rail centre their column', async ({ page, request }) => {
	for (const width of [1100, 1600]) {
		await page.setViewportSize({ width, height: 900 });
		await reset(request);
		await page.goto('/welcome');
		await expectCentred(page, `welcome at ${width}`);

		await seed(request, { aspects: [{ name: 'Health' }], todos: [{ title: 'Read chapter 4' }] });
		await page.goto('/sprint/plan');
		await expect(page).toHaveURL(/\/sprint\/plan$/);
		await expectCentred(page, `plan at ${width}`);

		await reset(request);

		await setClock(request, SUNDAY);
		await seedSunday(request);
		for (const [path, name] of [
			['/backlog', 'backlog'],
			['/sprint/review', 'review'],
			['/recurring', 'recurring'],
			['/aspects', 'aspects'],
			['/projects', 'projects']
		]) {
			await page.goto(path);
			await expect(page).toHaveURL(new RegExp(`${path}$`));
			await expectCentred(page, `${name} at ${width}`);
		}
	}
});

test('Scenario: Screens with a rail centre their column', async ({ page, request }) => {
	await reset(request);
	await setClock(request, SUNDAY);
	const { aspects, projects } = await seedSunday(request);
	const screens = [
		['/', 'today'],
		['/sprint?view=aspect', 'sprint by aspect'],
		[`/aspects/${aspects[0]}`, 'aspect page']
	];
	const detail = [`/projects/${projects[0]}`, 'project detail'];

	// Docked rail: the column sits in the middle of the space between sidebar and rail.
	await page.setViewportSize({ width: 1600, height: 900 });
	for (const [path, name] of screens) {
		await page.goto(path);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		const rail = page.getByTestId('context-rail');
		await expect(rail).toBeVisible();
		const { column, free } = await rail.evaluate((el) => {
			const content = el.previousElementSibling!.getBoundingClientRect();
			const sidebar = document.querySelector('main')!.previousElementSibling!.getBoundingClientRect();
			const left = el.getBoundingClientRect().left;
			return { column: content.left + content.width / 2, free: (sidebar.right + left) / 2 };
		});
		expect(Math.abs(column - free), `${name} column is off-centre`).toBeLessThanOrEqual(2);
	}

	await page.goto(detail[0]);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.getByTestId('context-rail')).toBeVisible();
	const { column, free } = await page.getByTestId('context-rail').evaluate((el) => {
		const content = el.previousElementSibling!.getBoundingClientRect();
		const sidebar = document.querySelector('main')!.previousElementSibling!.getBoundingClientRect();
		return { column: content.left + content.width / 2, free: (sidebar.right + el.getBoundingClientRect().left) / 2 };
	});
	expect(Math.abs(column - free), 'project detail column is off-centre').toBeLessThanOrEqual(2);

	// Overlay rail: the column is centred right of the sidebar like a screen without a rail.
	await page.setViewportSize({ width: 1100, height: 900 });
	for (const [path, name] of [...screens, detail]) {
		await page.goto(path);
		await expectCentred(page, `${name} at 1100`, 2);
	}
});
