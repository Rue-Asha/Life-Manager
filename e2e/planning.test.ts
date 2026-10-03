import { expect, test, type Page } from '@playwright/test';
import { reset, seed, setClock } from './helpers';

// Wednesday 7 October 2026 in Berlin; the target week runs Monday 5 to Sunday 11 October.
const NOW = '2026-10-07T10:00:00Z';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const ASPECTS = [
	{ name: 'Health', color: 'sage', icon: 'heart' },
	{ name: 'Uni', color: 'lavender', icon: 'cap' }
] as const;

const row = (page: Page, title: string) => page.getByTestId('todo-row').filter({ hasText: title });

// Starting lands on the sprint view for the target week; what wasn't pulled stays in the backlog,
// and planning is over.
async function expectStarted(page: Page, inSprint: string[], inBacklog: string[]) {
	await expect(page).toHaveURL(/\/sprint$/);
	await expect(page.getByTestId('sprint-week')).toHaveText('Mon 5 – Sun 11 Oct');
	await expect(page.getByTestId('todo-row')).toHaveCount(inSprint.length);
	for (const title of inSprint) await expect(row(page, title)).toHaveAttribute('data-status', 'todo');
	await page.goto('/backlog');
	for (const title of inSprint) await expect(row(page, title)).toHaveCount(0);
	for (const title of inBacklog) await expect(row(page, title)).toBeVisible();
	await page.goto('/sprint/plan');
	await expect(page).toHaveURL(/\/sprint$/);
}

test.describe('desktop', () => {
	test.use({ viewport: { width: 1280, height: 800 } });

	test('Scenario: First run can plan immediately', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			todos: [{ title: 'Book a physio appointment' }, { title: 'Read chapter 4', aspect: 1 }]
		});
		await page.goto('/sprint/plan');

		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Plan your week');
		await expect(page.getByTestId('plan-week')).toHaveText('Mon 5 – Sun 11 Oct');
		const backlog = page.getByTestId('plan-backlog');
		await expect(backlog.getByTestId('todo-row')).toHaveCount(2);
		await expect(page.getByTestId('plan-sprint').getByTestId('todo-row')).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Start sprint' })).toBeEnabled();
	});

	test('Scenario: Pull todos by drag and start the sprint', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			todos: [
				{ title: 'Book a physio appointment' },
				{ title: 'Read chapter 4', aspect: 1 },
				{ title: 'Clean the fridge' }
			]
		});
		await page.goto('/sprint/plan');
		const sprint = page.getByTestId('plan-sprint');
		const backlog = page.getByTestId('plan-backlog');

		await row(page, 'Book a physio appointment').dragTo(sprint);
		await expect(sprint.getByTestId('todo-row')).toHaveCount(1);
		await row(page, 'Read chapter 4').dragTo(sprint);
		await expect(sprint.getByTestId('todo-row')).toHaveCount(2);
		await expect(backlog.getByTestId('todo-row')).toHaveText([/Clean the fridge/]);

		await page.getByRole('button', { name: 'Start sprint with 2 todos' }).click();
		await expectStarted(page, ['Book a physio appointment', 'Read chapter 4'], ['Clean the fridge']);
	});

	test('Drag a planned todo back to the backlog', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			sprint: { state: 'planning' },
			todos: [{ title: 'Book a physio appointment', inSprint: true }]
		});
		await page.goto('/sprint/plan');

		await row(page, 'Book a physio appointment').dragTo(page.getByTestId('plan-backlog'));
		await expect(page.getByTestId('plan-backlog').getByTestId('todo-row')).toHaveCount(1);
		await expect(page.getByTestId('plan-sprint').getByTestId('todo-row')).toHaveCount(0);
	});

	test('Planning waits for the review while one is pending', async ({ page, request }) => {
		await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: '2026-09-28' } });
		await page.goto('/sprint/plan');
		await expect(page).toHaveURL(/\/sprint\/review$/);
	});
});

test.describe('suggestions', () => {
	test.use({ viewport: { width: 1280, height: 800 } });

	test('Scenario: Due-this-week todos are suggested pre-marked', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			todos: [
				{ title: 'Submit lab report', aspect: 1, dueDate: '2026-10-08' },
				{ title: 'Clean the fridge' }
			]
		});
		await page.goto('/sprint/plan');

		const suggestions = page.getByTestId('plan-suggestions');
		await expect(suggestions.getByTestId('todo-row')).toHaveText([/Submit lab report/]);
		await expect(suggestions.getByRole('checkbox', { name: 'Include: Submit lab report' })).toBeChecked();
		await expect(page.getByTestId('plan-backlog').getByTestId('todo-row')).toHaveText([/Clean the fridge/]);

		await page.getByRole('button', { name: 'Start sprint with 1 todo' }).click();
		await expectStarted(page, ['Submit lab report'], ['Clean the fridge']);
	});

	test('Scenario: Unmarked suggestion stays in the backlog', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			todos: [
				{ title: 'Submit lab report', aspect: 1, dueDate: '2026-10-08' },
				{ title: 'Pay the electricity bill', dueDate: '2026-10-11' }
			]
		});
		await page.goto('/sprint/plan');

		await page.getByRole('checkbox', { name: 'Include: Pay the electricity bill' }).uncheck();
		await page.getByRole('button', { name: 'Start sprint with 1 todo' }).click();
		await expectStarted(page, ['Submit lab report'], ['Pay the electricity bill']);
	});

	test('Scenario: No suggestion section when nothing is due', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			todos: [{ title: 'Buy running shoes', dueDate: '2026-10-12' }, { title: 'Clean the fridge' }]
		});
		await page.goto('/sprint/plan');

		await expect(page.getByTestId('plan-backlog').getByTestId('todo-row')).toHaveCount(2);
		await expect(page.getByTestId('plan-suggestions')).toHaveCount(0);
		await expect(page.getByText('Due this week')).toHaveCount(0);
	});
});

test.describe('touch phone', () => {
	test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

	test('Scenario: Pull todos with the picker on touch', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			todos: [{ title: 'Book a physio appointment' }, { title: 'Clean the fridge' }]
		});
		await page.goto('/sprint/plan');

		await page.getByRole('button', { name: 'Add to sprint: Book a physio appointment' }).tap();
		await expect(page.getByTestId('plan-sprint').getByTestId('todo-row')).toHaveText([/Book a physio appointment/]);

		await page.getByRole('button', { name: 'Start sprint with 1 todo' }).tap();
		await expectStarted(page, ['Book a physio appointment'], ['Clean the fridge']);
	});
});
