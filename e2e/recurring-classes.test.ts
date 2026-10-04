import { expect, test } from '@playwright/test';
import { reset, seed, setClock } from './helpers';

// Wednesday 7 October 2026 in Berlin; the target week runs Monday 5 to Sunday 11 October.
const NOW = '2026-10-07T10:00:00Z';

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await setClock(request, NOW);
	await page.setViewportSize({ width: 1280, height: 800 });
	await seed(request, {
		aspects: [
			{ name: 'Health', color: 'sage', icon: 'heart' },
			{ name: 'Uni', color: 'lavender', icon: 'cap' }
		],
		uniAspect: 1,
		semesters: [{ name: 'WS 26/27' }],
		classes: [
			{ semester: 0, name: 'Analysis', color: 'sky', icon: 'book' },
			{ semester: 0, name: 'Algorithms', color: 'berry', icon: 'code' }
		]
	});
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

test('Scenario: Rule with a class generates linked instances', async ({ page }) => {
	await page.goto('/recurring');
	await page.getByRole('button', { name: 'New rule' }).click();
	const form = page.getByRole('dialog', { name: 'New rule' });
	await form.getByLabel('Title').fill('Exercise sheet');
	await form.getByRole('radio', { name: 'Uni' }).check();
	await form.getByLabel('Class').selectOption({ label: 'Analysis' });
	await form.getByTestId('type-field').getByRole('radio', { name: 'EXC' }).check();
	await form.getByRole('checkbox', { name: 'Tuesday' }).check();
	await form.getByRole('button', { name: 'Add rule' }).click();
	await expect(form).toBeHidden();

	const rule = page.getByTestId('rule-row').filter({ hasText: 'Exercise sheet' });
	await expect(rule.getByTestId('class-badge')).toHaveText('Analysis · EXC');

	await page.goto('/sprint/plan');
	await page.getByRole('button', { name: 'Start sprint' }).click();
	await expect(page).toHaveURL(/\/sprint$/);
	const instance = page.getByTestId('sprint-list').getByTestId('todo-row').filter({ hasText: 'Exercise sheet' });
	await expect(instance).toHaveAttribute('data-day', '2026-10-06');
	await expect(instance.getByTestId('class-badge')).toHaveText('Analysis · EXC');
});

test('Scenario: Rule class fields appear only for the Uni aspect', async ({ page }) => {
	await page.goto('/recurring');
	await page.getByRole('button', { name: 'New rule' }).click();
	const form = page.getByRole('dialog', { name: 'New rule' });
	await expect(form.getByRole('radio', { name: 'Health' })).toBeChecked();
	await expect(form.getByTestId('class-field')).toHaveCount(0);
	await expect(form.getByTestId('type-field')).toHaveCount(0);

	await form.getByRole('radio', { name: 'Uni' }).check();
	await expect(form.getByTestId('class-field')).toBeVisible();
	await expect(form.getByTestId('type-field')).toBeVisible();
});
