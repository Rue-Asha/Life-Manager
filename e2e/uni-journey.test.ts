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

const seedClass = (request: Parameters<typeof seed>[0], extra: Parameters<typeof seed>[1] = {}) =>
	seed(request, {
		aspects: [{ name: 'Health' }, { name: 'Studies', color: 'lavender', icon: 'book' }],
		uniAspect: 1,
		semesters: [{ name: 'WS 26/27' }],
		classes: [
			{
				semester: 0,
				name: 'Analysis II',
				color: 'sky',
				icon: 'book',
				lecturer: 'Prof. Kühn',
				room: 'H 2.013',
				ects: 7.5,
				notes: '## Lecture 5\n\nMean value theorem',
				examAt: '2027-02-10T09:00'
			},
			{ semester: 0, name: 'Algorithms' }
		],
		...extra
	});

test('Scenario: Class card opens the class detail', async ({ page, request }) => {
	const { classes } = await seedClass(request, {
		todos: [{ title: 'Exercise sheet 4', aspect: 1, class: 0, type: 'EXC' }]
	});
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/uni');
	await expect(page.getByRole('heading', { level: 1, name: 'Uni' })).toBeVisible();

	await page.getByTestId('class-card').filter({ hasText: 'Analysis II' }).click();
	await expect(page).toHaveURL(new RegExp(`/uni/classes/${classes[0]}$`));
	await expect(page.getByRole('heading', { level: 1, name: 'Analysis II' })).toBeVisible();
	await expect(page.getByTestId('context-rail')).toBeVisible();
	const meta = page.getByTestId('class-meta');
	await expect(meta).toContainText('Prof. Kühn');
	await expect(meta).toContainText('H 2.013');
	await expect(meta).toContainText('7.5');
	await expect(page.getByTestId('class-notes')).toContainText('Mean value theorem');
	await expect(page.getByTestId('class-todos-open').getByTestId('todo-row')).toHaveText([/Exercise sheet 4/]);
});

test("Scenario: Class todo moves through the class's groups", async ({ page, request }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	const { classes } = await seedClass(request, { sprint: { state: 'active', weekStart: '2026-10-05' } });
	const row = page.getByTestId('todo-row').filter({ hasText: 'Exercise sheet 5' });
	const group = (name: string) => page.getByTestId(`class-todos-${name}`).getByTestId('todo-row');
	const detail = async () => {
		await page.goto(`/uni/classes/${classes[0]}`);
		await expect(page.getByRole('heading', { level: 1, name: 'Analysis II' })).toBeVisible();
	};
	const expectBadge = async () => {
		await expect(row.getByTestId('class-badge')).toContainText('Analysis II');
		await expect(row.getByTestId('class-badge')).toContainText('EXC');
	};

	await detail();
	await page.getByRole('button', { name: 'Add a todo' }).click();
	const form = page.getByRole('form', { name: 'New todo' });
	await expect(form.getByLabel('Class')).toHaveValue(String(classes[0]));
	await form.getByTestId('type-field').getByRole('button', { name: 'EXC' }).click();
	await form.getByLabel('Title').fill('Exercise sheet 5');
	await form.getByRole('button', { name: 'Add todo' }).click();
	await expect(group('open')).toHaveText([/Exercise sheet 5/]);
	await expect(group('planned')).toHaveCount(0);

	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();
	await expectBadge();
	await page.getByRole('button', { name: 'Add to sprint: Exercise sheet 5' }).click();
	await expect(row).toHaveCount(0);

	await page.goto('/sprint');
	await expect(page.getByRole('heading', { level: 1, name: 'Sprint' })).toBeVisible();
	const sprintRow = page.getByTestId('sprint-list').getByTestId('todo-row').filter({ hasText: 'Exercise sheet 5' });
	await expect(sprintRow.getByTestId('class-badge')).toContainText('Analysis II');
	await sprintRow.getByLabel('Day').selectOption({ label: 'Wed 7' });

	await detail();
	await expect(group('planned')).toHaveText([/Exercise sheet 5/]);
	await expect(group('open')).toHaveCount(0);

	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
	await expectBadge();
	const checkbox = page.getByRole('checkbox', { name: 'Done: Exercise sheet 5' });
	await checkbox.click();
	await expect(checkbox).toHaveAttribute('aria-checked', 'true');

	await detail();
	await expect(group('planned')).toHaveCount(0);
	const toggle = page.getByTestId('class-todos-done').getByRole('button', { name: /Done/ });
	await expect(toggle).toContainText('1');
	await toggle.click();
	await expect(group('done')).toHaveText([/Exercise sheet 5/]);
});
