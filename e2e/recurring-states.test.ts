import { expect, reset, ruleRow, ruleRows, seed, test } from './helpers';

const HEALTH = { name: 'Health', color: 'sage', icon: 'heart' } as const;
const UNI = { name: 'Uni', color: 'lavender', icon: 'cap' } as const;

test.beforeEach(async ({ request }) => {
	await reset(request);
});

test('Scenario: No rules shows the empty copy', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH] });
	await page.goto('/recurring');

	await expect(page.getByRole('heading', { name: 'No recurring rules yet' })).toBeVisible();
	await expect(page.getByText('Add one for anything you do every week.')).toBeVisible();
	await page.getByRole('main').getByRole('button', { name: 'New rule' }).last().click();
	await expect(page.getByRole('dialog', { name: 'New rule' })).toBeVisible();
});

test('Scenario: Class field only for the Uni aspect', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH, UNI],
		uniAspect: 1,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis', color: 'sky', icon: 'book' }]
	});
	await page.goto('/recurring');
	await page.getByRole('button', { name: 'New rule' }).first().click();
	const form = page.getByRole('dialog', { name: 'New rule' });

	await expect(form.getByRole('radio', { name: 'Health' })).toBeChecked();
	await expect(form.getByLabel('Class')).toHaveCount(0);
	await form.getByRole('radio', { name: 'Uni' }).check();
	await expect(form.getByLabel('Class')).toBeVisible();
	await form.getByRole('radio', { name: 'Health' }).check();
	await expect(form.getByLabel('Class')).toHaveCount(0);
});

test('Scenario: Long checklist template stays usable', async ({ page, request }) => {
	const checklist = Array.from({ length: 25 }, (_, i) => `Item ${i + 1} ${'pack and check the whole bag twice before leaving '.repeat(3)}`.slice(0, 120));
	await seed(request, { aspects: [HEALTH], rules: [{ title: 'Gym', weekdays: [1], checklist }] });
	await page.setViewportSize({ width: 375, height: 700 });
	await page.goto('/recurring');
	await ruleRow(page, 'Gym').getByRole('button').click();
	const form = page.getByRole('dialog', { name: 'Edit rule' });

	const last = form.getByRole('textbox', { name: 'Checklist item 25' });
	await last.scrollIntoViewIfNeeded();
	await last.fill('Edited last item');
	await expect(last).toHaveValue('Edited last item');
	await expect(form.getByRole('textbox', { name: 'Checklist item 1', exact: true })).toHaveValue(checklist[0]);
	const save = form.getByRole('button', { name: 'Save rule' });
	await expect(save).toBeInViewport();
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
	expect(overflow).toBeLessThanOrEqual(0);
	await save.click();
	await expect(form).toBeHidden();
});

test('Scenario: Rules sit in two columns from 1280', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH],
		rules: ['Gym', 'Laundry', 'Call home', 'Plan meals'].map((title, i) => ({ title, weekdays: [i + 1] }))
	});
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/recurring');
	await expect(ruleRows(page)).toHaveCount(4);
	const wide = await ruleRows(page).evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
	expect(wide[0]).toBe(wide[1]);
	expect(wide[2]).toBeGreaterThan(wide[0]);

	await page.setViewportSize({ width: 1100, height: 900 });
	await expect.poll(async () => {
		const tops = await ruleRows(page).evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
		return tops.every((t, i) => i === 0 || t > tops[i - 1]);
	}).toBe(true);
});
