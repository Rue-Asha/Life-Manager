import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock } from './helpers';

const main = (page: Page) => page.getByRole('navigation', { name: 'Main' });
const menu = (page: Page) => page.getByRole('menu', { name: 'More' });

async function openMore(page: Page) {
	await main(page).getByRole('button', { name: /^More\b/ }).click();
	await expect(menu(page)).toBeVisible();
}

// What is marked current, by label with its count and marker stripped.
const label = (text: string) => text.replace(/\s*(\d+\+?)?\s*$/, '').trim();
async function marked(page: Page) {
	const inBar = await main(page).locator('[aria-current="page"]').evaluateAll((els) => els.map((el) => el.textContent ?? ''));
	await openMore(page);
	const inMenu = await menu(page).locator('[aria-current="page"]').evaluateAll((els) => els.map((el) => el.textContent ?? ''));
	await page.keyboard.press('Escape');
	return { bar: inBar.map(label), menu: inMenu.map(label) };
}

test.beforeEach(async ({ page, request }) => {
	await reset(request);
	await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

test('Scenario: Top bar shows the lists, the menu and New todo', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }, { name: 'Home' }] });
	await page.goto('/backlog');

	await expect(main(page).getByRole('link')).toHaveText([/^\s*Today/, /^\s*Sprint/, /^\s*Backlog/, /^\s*Calendar/]);
	await expect(main(page).getByRole('button')).toHaveText([/^\s*More/, /New todo/]);

	await openMore(page);
	await expect(menu(page).getByRole('menuitem')).toHaveText([/^\s*Aspects/, /^\s*Health/, /^\s*Home/, /^\s*Projects/, /^\s*Uni/, /^\s*Recurring/, /^\s*Proton sync/]);
});

test('Scenario: Current route is marked in the top bar', async ({ page, request }) => {
	const { aspects, projects, classes } = await seed(request, {
		aspects: [{ name: 'Health' }, { name: 'IT' }, { name: 'Studies' }],
		itAspect: 1,
		uniAspect: 2,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis I' }],
		projects: [{ name: 'Life Manager', status: 'active' }]
	});
	const routes: [string, string[], string[]][] = [
		['/', ['Today'], []],
		['/sprint/plan', ['Sprint'], []],
		['/calendar?month=2026-12', ['Calendar'], []],
		[`/projects/${projects[0]}`, ['More'], ['Projects']],
		[`/uni/classes/${classes[0]}`, ['More'], ['Uni']],
		[`/aspects/${aspects[0]}`, ['More'], ['Health']],
		['/aspects', ['More'], ['Aspects']],
		['/sync', ['More'], ['Proton sync']]
	];

	for (const [path, bar, inMenu] of routes) {
		await page.goto(path);
		await expect(page).toHaveURL(new RegExp(`${path.replace(/[?]/g, '\\?')}$`));
		expect(await marked(page), path).toEqual({ bar, menu: inMenu });
	}
});

test('Scenario: Zero counts are hidden in the top bar', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/');

	await expect(main(page).getByRole('link', { name: /^Backlog/ })).toHaveText('Backlog');
	await openMore(page);
	await expect(menu(page).getByRole('menuitem', { name: /^Projects/ })).toHaveText('Projects');
	await expect(menu(page).getByRole('menuitem', { name: /^Recurring/ })).toHaveText('Recurring');
});

test('Scenario: Counts of 100 or more read 99+', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }], todos: Array.from({ length: 120 }, (_, i) => ({ title: `Todo ${i}` })) });
	await page.goto('/');

	const backlog = main(page).getByRole('link', { name: /Backlog/ });
	await expect(backlog).toHaveText('Backlog 99+');
	await expect(backlog).toHaveAccessibleName(/Backlog/);
});

test('Scenario: Long aspect names truncate with the full name available', async ({ page, request }) => {
	const name = 'W'.repeat(80);
	await seed(request, { aspects: [{ name }, { name: 'Health' }] });
	await page.goto('/');
	await openMore(page);

	const item = menu(page).getByRole('menuitem', { name: new RegExp(name) });
	await expect(item).toHaveAttribute('title', name);
	await expect(item).toHaveAccessibleName(new RegExp(name));
	const { scrollWidth, clientWidth } = await menu(page).evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
	expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
	const [box, menuBox] = [await item.boundingBox(), await menu(page).boundingBox()];
	expect(box!.x + box!.width).toBeLessThanOrEqual(menuBox!.x + menuBox!.width);
});

test('Scenario: Top bar fits at 768 px', async ({ page, request }) => {
	await setClock(request, '2026-10-07T10:00:00Z');
	const late = { title: 'Late', dueDate: '2026-10-01' };
	await seed(request, {
		aspects: [{ name: 'Health' }],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [
			...Array.from({ length: 120 }, (_, i) => ({ ...late, title: `Late ${i}` })),
			...Array.from({ length: 120 }, (_, i) => ({ title: `Planned ${i}`, inSprint: true, day: '2026-10-07' }))
		]
	});
	await page.setViewportSize({ width: 768, height: 800 });
	await page.goto('/');

	const nav = main(page);
	await expect(nav.getByRole('link', { name: /Today/ })).toContainText('99+');
	await expect(nav.getByRole('link', { name: /Sprint/ })).toContainText('99+');
	await expect(nav.getByRole('link', { name: /Backlog/ })).toContainText('99+');
	const tops = await nav.getByRole('link').or(nav.getByRole('button')).evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
	expect(tops).toHaveLength(6);
	expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1);
	const fits = await page.evaluate(() => {
		const track = document.querySelector<HTMLElement>('.app-nav ul')!;
		return { track: track.scrollWidth <= track.clientWidth, page: document.documentElement.scrollWidth <= document.documentElement.clientWidth };
	});
	expect(fits).toEqual({ track: true, page: true });
});
