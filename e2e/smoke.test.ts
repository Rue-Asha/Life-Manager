import { expect, test } from '@playwright/test';

test('Scenario: Built app serves a page in e2e', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
});
