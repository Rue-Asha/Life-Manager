import { expect, test, reset, seed } from './helpers';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await seed(request, { aspects: [{ name: 'Health', color: 'sage', icon: 'heart' }] });
});

const PAGES = [
	{ path: '/aspects/99999', heading: 'Aspect not found', link: 'Aspects', href: '/aspects' },
	{ path: '/projects/99999', heading: 'Project not found', link: 'Projects', href: '/projects' },
	{ path: '/uni/classes/99999', heading: 'Class not found', link: 'Uni', href: '/uni' }
] as const;

async function expectNotFound(page: import('@playwright/test').Page, p: (typeof PAGES)[number]) {
	const response = await page.goto(p.path);
	expect(response?.status()).toBe(404);
	const main = page.getByRole('main');
	await expect(main.getByRole('heading', { level: 1 })).toHaveText(p.heading);
	await expect(main.getByRole('link', { name: p.link, exact: true })).toHaveAttribute('href', p.href);
	await expect(main.getByRole('link', { name: p.link, exact: true })).toBeVisible();
	// Inside the app's frame: the navigation stays.
	await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
}

test('Scenario: Unknown detail ids show the 404 page', async ({ page }) => {
	for (const p of PAGES) {
		await expectNotFound(page, p);
		await expect(page.getByRole('main').getByText(/doesn’t exist, or it was deleted\. Go back to/)).toBeVisible();
	}
});

test('Scenario: Unknown aspect shows Aspect not found', async ({ page }) => {
	await expectNotFound(page, PAGES[0]);
	await page.getByRole('main').getByRole('link', { name: 'Aspects', exact: true }).click();
	await expect(page).toHaveURL(/\/aspects$/);
});

test('Scenario: Unknown project shows Project not found', async ({ page }) => {
	await expectNotFound(page, PAGES[1]);
	await page.getByRole('main').getByRole('link', { name: 'Projects', exact: true }).click();
	await expect(page).toHaveURL(/\/projects$/);
});

test('Scenario: Unknown class shows Class not found', async ({ page }) => {
	await expectNotFound(page, PAGES[2]);
	await page.getByRole('main').getByRole('link', { name: 'Uni', exact: true }).click();
	await expect(page).toHaveURL(/\/uni$/);
});
