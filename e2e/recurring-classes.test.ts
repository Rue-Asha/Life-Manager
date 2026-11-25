import { expect, test, reset, seed, setClock, ruleRow, todoRow } from './helpers';
import { sprintList } from './sprint-locators';

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
	await form.getByLabel('Type').selectOption('EXC');
	await form.getByRole('checkbox', { name: 'Tuesday' }).check();
	await form.getByRole('button', { name: 'Add rule' }).click();
	await expect(form).toBeHidden();

	const rule = ruleRow(page, 'Exercise sheet');
	await expect(rule.locator('.hr-facts').first()).toHaveText(/^Uni\s*Analysis\s*EXC$/);

	await page.goto('/sprint/plan');
	await page.getByRole('button', { name: 'Start sprint' }).click();
	await expect(page).toHaveURL(/\/sprint$/);
	const instance = todoRow(sprintList(page), 'Exercise sheet');
	await expect(instance).toHaveAttribute('data-day', '2026-10-06');
	await expect(instance.getByRole('link', { name: /^Analysis/ })).toHaveText('Analysis · EXC');
});

test('Scenario: Rule class fields appear only for the Uni aspect', async ({ page }) => {
	await page.goto('/recurring');
	await page.getByRole('button', { name: 'New rule' }).click();
	const form = page.getByRole('dialog', { name: 'New rule' });
	await expect(form.getByRole('radio', { name: 'Health' })).toBeChecked();
	await expect(form.getByLabel('Class')).toHaveCount(0);
	await expect(form.getByLabel('Type')).toHaveCount(0);

	await form.getByRole('radio', { name: 'Uni' }).check();
	await expect(form.getByLabel('Class')).toBeVisible();
	await expect(form.getByLabel('Type')).toBeVisible();
});

test('Scenario: Editing a rule of an archived class keeps its class', async ({ page, request }) => {
	await reset(request);
	await seed(request, {
		aspects: [
			{ name: 'Health', color: 'sage', icon: 'heart' },
			{ name: 'Uni', color: 'lavender', icon: 'cap' }
		],
		uniAspect: 1,
		semesters: [{ name: 'SS 26', archivedAt: '2026-09-30T10:00:00Z' }],
		classes: [{ semester: 0, name: 'Statistics', color: 'sky', icon: 'book' }],
		rules: [{ title: 'Stats review', aspect: 1, weekdays: [2], class: 0, type: 'LEC' }]
	});
	await page.goto('/recurring');
	await ruleRow(page, 'Stats review').getByRole('button').click();
	const form = page.getByRole('dialog', { name: 'Edit rule' });
	await form.getByLabel('Title').fill('Stats recap');
	await form.getByRole('button', { name: 'Save rule' }).click();
	await expect(form).toBeHidden();

	await page.reload();
	const rule = ruleRow(page, 'Stats recap');
	await expect(rule.locator('.hr-facts').first()).toHaveText(/^Uni\s*Statistics\s*LEC$/);
});
