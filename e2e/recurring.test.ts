import { expect, test } from '@playwright/test';
import { reset, seed } from './helpers';

test.beforeEach(async ({ request }) => {
	await reset(request);
});

test('Scenario: Create and list a recurring rule', async ({ page, request }) => {
	await seed(request, {
		aspects: [
			{ name: 'Uni', color: 'lavender', icon: 'cap' },
			{ name: 'Health', color: 'sage', icon: 'heart' }
		]
	});
	await page.goto('/recurring');

	await page.getByRole('button', { name: 'New rule' }).click();
	const form = page.getByRole('dialog', { name: 'New rule' });
	await form.getByLabel('Title').fill('Gym');
	await form.getByRole('radio', { name: 'Health' }).check();
	await form.getByRole('checkbox', { name: 'Monday' }).check();
	await form.getByRole('checkbox', { name: 'Thursday' }).check();
	await form.getByRole('button', { name: 'Add rule' }).click();
	await expect(form).toBeHidden();

	const row = page.getByTestId('rule-row');
	await expect(row).toHaveCount(1);
	await expect(row).toContainText('Gym');
	await expect(row.getByTestId('rule-aspect')).toHaveText('Health');
	await expect(row.getByTestId('rule-weekday')).toHaveText(['Mon', 'Thu']);

	await page.reload();
	await expect(page.getByTestId('rule-row')).toContainText('Gym');
});

test('rule form shows weekdays-required inline and stores nothing', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/recurring');

	await page.getByRole('button', { name: 'New rule' }).click();
	const form = page.getByRole('dialog', { name: 'New rule' });
	await form.getByLabel('Title').fill('Gym');
	await form.getByRole('button', { name: 'Add rule' }).click();

	await expect(form.getByRole('alert')).toHaveText('Pick at least one day.');
	await expect(form.getByRole('checkbox', { name: 'Monday' })).toHaveAttribute('aria-invalid', 'true');
	await page.reload();
	await expect(page.getByTestId('rule-row')).toHaveCount(0);
});

test('rule can be edited and deleted after confirming', async ({ page, request }) => {
	await seed(request, {
		aspects: [{ name: 'Health' }, { name: 'Uni', color: 'lavender', icon: 'cap' }],
		rules: [{ title: 'Gym', aspect: 0, weekdays: [1, 4], priority: 2, checklist: ['Shoes', 'Towel'] }]
	});
	await page.goto('/recurring');

	await page.getByRole('button', { name: /Gym/ }).click();
	const form = page.getByRole('dialog', { name: 'Edit rule' });
	await expect(form.getByLabel('Title')).toHaveValue('Gym');
	await expect(form.getByRole('checkbox', { name: 'Monday' })).toBeChecked();
	await expect(form.getByRole('radio', { name: 'P2' })).toBeChecked();
	await expect(form.getByRole('textbox', { name: 'Checklist item 2' })).toHaveValue('Towel');

	await form.getByLabel('Title').fill('Run');
	await form.getByRole('radio', { name: 'Uni' }).check();
	await form.getByRole('checkbox', { name: 'Thursday' }).uncheck();
	await form.getByRole('checkbox', { name: 'Saturday' }).check();
	await form.getByRole('button', { name: 'Save rule' }).click();
	await expect(form).toBeHidden();

	const row = page.getByTestId('rule-row');
	await expect(row).toContainText('Run');
	await expect(row.getByTestId('rule-aspect')).toHaveText('Uni');
	await expect(row.getByTestId('rule-weekday')).toHaveText(['Mon', 'Sat']);

	await row.getByRole('button', { name: /Run/ }).click();
	await page.getByRole('dialog', { name: 'Edit rule' }).getByRole('button', { name: 'Delete rule' }).click();
	const confirm = page.getByRole('dialog', { name: 'Delete “Run”?' });
	await confirm.getByRole('button', { name: 'Cancel' }).click();
	await expect(row).toHaveCount(1);

	await row.getByRole('button', { name: /Run/ }).click();
	await page.getByRole('dialog', { name: 'Edit rule' }).getByRole('button', { name: 'Delete rule' }).click();
	await page.getByRole('dialog', { name: 'Delete “Run”?' }).getByRole('button', { name: 'Delete rule' }).click();
	await expect(page.getByTestId('rule-row')).toHaveCount(0);
	await expect(page.getByText('No recurring rules yet.')).toBeVisible();
});
