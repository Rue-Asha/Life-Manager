import { expect, test, reset, seed } from './helpers';

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await page.setViewportSize({ width: 1280, height: 800 });
});

test('Scenario: Pickers, backlog groups and the rule form follow the manual order', async ({ page, request, baseURL }) => {
	const { aspects } = await seed(request, {
		aspects: [
			{ name: 'Health', color: 'sage', icon: 'heart' },
			{ name: 'Uni', color: 'lavender', icon: 'cap' },
			{ name: 'Job', color: 'sky', icon: 'briefcase' }
		],
		todos: [
			{ title: 'Book physio', aspect: 0 },
			{ title: 'Read chapter 4', aspect: 1 },
			{ title: 'Send invoice', aspect: 2 }
		]
	});
	const [health, uni, job] = aspects;

	// A form post is only accepted with an Origin that matches the server's own.
	const response = await request.post('/aspects?/reorder', {
		data: new URLSearchParams([job, health, uni].map((id) => ['order', String(id)])).toString(),
		headers: { origin: baseURL!, 'content-type': 'application/x-www-form-urlencoded' }
	});
	expect(response.status()).toBe(200);

	const order = ['Job', 'Health', 'Uni'];

	await page.goto('/backlog');
	await expect(page.locator('[data-testid^="aspect-group-"] h2')).toHaveText(order.map((name) => new RegExp(`^${name}\\b`)));

	await page.getByTestId('todo-row').filter({ hasText: 'Book physio' }).getByRole('button', { name: 'Book physio', exact: true }).click();
	const editor = page.getByRole('form', { name: 'Edit todo' });
	await expect(editor).toBeVisible();
	await expect(editor.getByLabel('Aspect').locator('option')).toHaveText(order);
	await page.keyboard.press('Escape');

	await page.goto('/recurring');
	await page.getByRole('button', { name: 'New rule' }).click();
	const form = page.getByRole('dialog', { name: 'New rule' });
	await expect(form.getByRole('group', { name: 'Aspect' }).getByRole('radio')).toHaveCount(3);
	await expect(form.getByRole('group', { name: 'Aspect' }).locator('label.aspect')).toHaveText(order);
});
