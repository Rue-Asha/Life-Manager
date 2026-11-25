import { expect, reset, seed, test } from './helpers';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await seed(request, { aspects: [{ name: 'Health', color: 'sage', icon: 'heart' }] });
});

test('Scenario: Icon files are served', async ({ page, request }) => {
	await page.goto('/');
	const linked = await page
		.locator('head link[rel="icon"], head link[rel="apple-touch-icon"]')
		.evaluateAll((els) => els.map((el) => el.getAttribute('href')!));
	const manifest = await request.get('/manifest.webmanifest');
	expect(manifest.status()).toBe(200);
	const { icons } = (await manifest.json()) as { icons: { src: string }[] };
	const paths = [...new Set([...linked, ...icons.map((icon) => icon.src)])];
	expect(paths.length).toBeGreaterThanOrEqual(5);
	for (const path of paths) {
		const response = await request.get(path);
		expect(response.status(), path).toBe(200);
		expect(response.headers()['content-type'], path).toMatch(/^image\//);
	}
});

test('Scenario: Head carries the icon links', async ({ page }) => {
	await page.goto('/');
	// Compare paths: in the browser the icon hrefs come back as absolute URLs.
	const entries = await page
		.locator('head link, head meta[name]')
		.evaluateAll((els) =>
			els.map((el) => [el.getAttribute('rel') ?? el.getAttribute('name'), (el.getAttribute('href') && new URL(el.getAttribute('href')!, location.href).pathname) ?? el.getAttribute('content'), el.getAttribute('type') ?? el.getAttribute('sizes')].join(' '))
		);
	expect(entries).toContain('icon /favicon.svg image/svg+xml');
	expect(entries).toContain('icon /favicon.ico 32x32');
	expect(entries).toContain('apple-touch-icon /apple-touch-icon.png ');
	expect(entries).toContain('manifest /manifest.webmanifest ');
	expect(entries).toContain('theme-color #ffffff ');
	expect(entries.filter((entry) => entry.startsWith('icon '))).toHaveLength(2);
});
