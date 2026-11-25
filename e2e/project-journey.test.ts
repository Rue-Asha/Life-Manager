import { expect, test, reset, seed, setClock, todoRow, todoRows } from './helpers';
import { chooseDay } from './row-locators';

// Wednesday 7 October 2026 in Berlin; the active sprint runs Monday 5 to Sunday 11 October.
const NOW = '2026-10-07T10:00:00Z';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

test('Scenario: Linked todo moves through the project\'s groups', async ({ page, request }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	const { projects } = await seed(request, {
		aspects: [{ name: 'Health' }, { name: 'IT' }],
		itAspect: 1,
		projects: [{ name: 'Life Manager', status: 'active' }],
		sprint: { state: 'active', weekStart: '2026-10-05' }
	});
	const row = todoRow(page, 'Wire the badge');
	const group = (name: string) => todoRows(page.getByRole('group', { name, exact: true }));
	const detail = async () => {
		await page.goto(`/projects/${projects[0]}`);
		await expect(page.getByRole('heading', { level: 1, name: 'Life Manager' })).toBeVisible();
	};

	await page.goto('/backlog');
	await page.getByRole('button', { name: 'Add a todo' }).first().click();
	const form = page.getByRole('form', { name: 'New todo' });
	await form.getByLabel('Aspect').selectOption({ label: 'IT' });
	await form.getByLabel('Project').selectOption({ label: 'Life Manager' });
	await form.getByLabel('Title').fill('Wire the badge');
	await form.getByRole('button', { name: 'Add todo' }).click();
	await expect(row.getByRole('link', { name: 'Life Manager' })).toHaveText(/Life Manager/);

	await detail();
	await expect(group('Open')).toHaveText([/Wire the badge/]);
	await expect(group('Planned')).toHaveCount(0);

	await page.goto('/backlog');
	await page.getByRole('button', { name: 'Add to sprint: Wire the badge' }).click();
	await page.goto('/sprint');
	await expect(row.getByRole('link', { name: 'Life Manager' })).toHaveText(/Life Manager/);
	await chooseDay(page, row, 'Wed 7');

	await detail();
	await expect(group('Planned')).toHaveText([/Wire the badge/]);
	await expect(group('Open')).toHaveCount(0);

	await page.goto('/');
	await expect(row.getByRole('link', { name: 'Life Manager' })).toHaveText(/Life Manager/);
	const checkbox = page.getByRole('checkbox', { name: 'Done: Wire the badge' });
	await checkbox.click();
	await expect(checkbox).toHaveAttribute('aria-checked', 'true');

	await detail();
	await expect(group('Planned')).toHaveCount(0);
	const toggle = page.getByRole('group', { name: 'Done', exact: true }).getByRole('button', { name: /Done/ });
	await expect(toggle).toContainText('1');
	await toggle.click();
	await expect(group('Done')).toHaveText([/Wire the badge/]);
});
