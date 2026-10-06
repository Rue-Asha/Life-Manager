import { expect, test, reset, seed } from './helpers';

test('Scenario: Built app serves a page in e2e', async ({ request }) => {
	// Without aspects `/` redirects to /welcome, so seed one and read `/` itself.
	await reset(request);
	await seed(request, { aspects: [{ name: 'Health' }] });
	const response = await request.get('/', { maxRedirects: 0 });
	expect(response.status()).toBe(200);
});
