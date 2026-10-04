import { expect, test } from '@playwright/test';
import { reset, seed, setClock } from './helpers';

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
	const row = page.getByTestId('todo-row').filter({ hasText: 'Wire the badge' });
	const group = (name: string) => page.getByTestId(`project-todos-${name}`).getByTestId('todo-row');
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
	await expect(row.getByTestId('project-badge')).toHaveText(/Life Manager/);

	await detail();
	await expect(group('open')).toHaveText([/Wire the badge/]);
	await expect(group('planned')).toHaveCount(0);

	await page.goto('/backlog');
	await page.getByRole('button', { name: 'Add to sprint: Wire the badge' }).click();
	await page.goto('/sprint');
	await expect(row.getByTestId('project-badge')).toHaveText(/Life Manager/);
	await row.getByLabel('Day').selectOption({ label: 'Wed 7' });

	await detail();
	await expect(group('planned')).toHaveText([/Wire the badge/]);
	await expect(group('open')).toHaveCount(0);

	await page.goto('/');
	await expect(row.getByTestId('project-badge')).toHaveText(/Life Manager/);
	const checkbox = page.getByRole('checkbox', { name: 'Done: Wire the badge' });
	await checkbox.click();
	await expect(checkbox).toHaveAttribute('aria-checked', 'true');

	await detail();
	await expect(group('planned')).toHaveCount(0);
	const toggle = page.getByTestId('project-todos-done').getByRole('button', { name: /Done/ });
	await expect(toggle).toContainText('1');
	await toggle.click();
	await expect(group('done')).toHaveText([/Wire the badge/]);
});
