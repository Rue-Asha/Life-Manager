import { expect, test, type Page } from '@playwright/test';
import { reset, setClock } from './helpers';

// Monday 5 October 2026, morning in Berlin: the first sprint runs 5–11 October.
const MONDAY = '2026-10-05T07:00:00Z';
const SUNDAY = '2026-10-11T16:00:00Z';

test.use({ viewport: { width: 1280, height: 800 } });

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const row = (page: Page, title: string) => page.getByTestId('todo-row').filter({ hasText: title });
const day = (page: Page, key: string) => page.getByTestId(`day-column-${key}`);
const shot = (page: Page, name: string) =>
	page.screenshot({ path: `test-results/shots/journey-${name}-1280.png`, fullPage: true });

// On desktop the quick-add card stays open for the next capture.
async function quickAdd(page: Page, title: string, aspect: string, due?: string) {
	const form = page.getByRole('form', { name: 'New todo' });
	await form.getByLabel('Title').fill(title);
	await form.getByLabel('Aspect').selectOption({ label: aspect });
	if (due) await form.getByLabel('Due date', { exact: true }).fill(due);
	await form.getByRole('button', { name: 'Add todo' }).click();
	await expect(row(page, title)).toBeVisible();
}

// A drag can't start while the view cross-fade still covers the page.
async function switchView(page: Page, name: string, view: string) {
	await page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name }).click();
	await expect(page).toHaveURL(new RegExp(`view=${view}$`));
	await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
}

test('Done-when journey', async ({ page, request }) => {
	await reset(request);
	await setClock(request, MONDAY);

	// Onboarding
	await page.goto('/');
	await expect(page).toHaveURL(/\/welcome$/);
	await shot(page, 'welcome');
	await page.getByRole('checkbox', { name: 'Health', exact: true }).check();
	await page.getByRole('checkbox', { name: 'Uni', exact: true }).check();
	await page.getByRole('button', { name: 'Continue with 2 aspects' }).click();
	await expect(page).toHaveURL(/\/backlog$/);

	// A recurring rule for Tuesdays and Thursdays
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Recurring' }).click();
	await page.getByRole('button', { name: 'New rule' }).click();
	const rule = page.getByRole('dialog', { name: 'New rule' });
	await rule.getByLabel('Title').fill('Gym');
	await rule.getByRole('radio', { name: 'Health' }).check();
	await rule.getByRole('checkbox', { name: 'Tuesday' }).check();
	await rule.getByRole('checkbox', { name: 'Thursday' }).check();
	await rule.getByRole('button', { name: 'Add rule' }).click();
	await expect(page.getByTestId('rule-row')).toContainText('Gym');
	await shot(page, 'recurring');

	// Capture
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Backlog' }).click();
	await page.getByRole('button', { name: 'Add a todo' }).first().click();
	await quickAdd(page, 'Read chapter 4', 'Uni');
	await quickAdd(page, 'Book a physio appointment', 'Health');
	await quickAdd(page, 'Submit lab report', 'Uni', '2026-10-08');
	await quickAdd(page, 'Clean the fridge', 'Health');
	await shot(page, 'backlog');

	// Plan
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Sprint' }).click();
	await page.getByTestId('sprint-prompt').getByRole('link').click();
	await expect(page).toHaveURL(/\/sprint\/plan$/);
	const planned = page.getByTestId('plan-sprint');
	await expect(page.getByTestId('plan-suggestions').getByTestId('todo-row')).toHaveText([/Submit lab report/]);
	await row(page, 'Read chapter 4').dragTo(planned);
	await row(page, 'Book a physio appointment').dragTo(planned);
	await expect(planned.getByTestId('todo-row')).toHaveCount(3);
	await shot(page, 'plan');
	await page.getByRole('button', { name: 'Start sprint with 3 todos' }).click();
	await expect(page).toHaveURL(/\/sprint$/);

	// Work it in all three views
	await page.getByRole('checkbox', { name: 'Done: Book a physio appointment' }).click();
	await expect(row(page, 'Book a physio appointment')).toHaveAttribute('data-status', 'done');
	await shot(page, 'sprint-aspect');

	await switchView(page, 'Board', 'board');
	await row(page, 'Read chapter 4').dragTo(page.getByTestId('board-column-doing'), { sourcePosition: { x: 8, y: 8 } });
	await expect(page.getByTestId('board-column-doing')).toContainText('Read chapter 4');
	await expect(page.getByTestId('board-column-done')).toContainText('Book a physio appointment');
	await shot(page, 'sprint-board');

	await switchView(page, 'Week', 'week');
	for (const gymDay of ['2026-10-06', '2026-10-08']) {
		await expect(day(page, gymDay).getByTestId('todo-row')).toContainText('Gym');
		await expect(day(page, gymDay).getByTestId('todo-row')).toContainText('Recurring');
	}
	// In Week the rail, with Unscheduled, is an overlay behind its toggle.
	await page.getByTestId('rail-toggle').click();
	await row(page, 'Submit lab report').dragTo(day(page, '2026-10-07'), { sourcePosition: { x: 8, y: 8 } });
	await expect(day(page, '2026-10-07')).toContainText('Submit lab report');
	await page.getByTestId('rail-toggle').click();
	await expect(page.getByTestId('context-rail')).toBeHidden();
	await shot(page, 'sprint-week');

	await setClock(request, '2026-10-07T07:00:00Z');
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Today' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Today');
	await expect(row(page, 'Submit lab report')).toBeVisible();
	await shot(page, 'today');

	// Review on Sunday
	await setClock(request, SUNDAY);
	await page.goto('/');
	await page.getByTestId('sprint-prompt').getByRole('link', { name: 'Review it' }).click();
	await expect(page).toHaveURL(/\/sprint\/review$/);
	await expect(page.getByTestId('review-done')).toContainText('Done 1');
	await page.getByRole('radiogroup', { name: 'Submit lab report' }).getByText('Back to backlog').click();
	for (const gym of await page.getByRole('radiogroup', { name: 'Gym' }).all()) await gym.getByText('Drop').click();
	await shot(page, 'review');
	await page.getByRole('button', { name: 'Carry 1, return 1, drop 2 and close' }).click();

	// Plan the next week
	await expect(page).toHaveURL(/\/sprint\/plan$/);
	await expect(page.getByTestId('plan-week')).toHaveText('Mon 12 – Sun 18 Oct');
	await expect(planned.getByTestId('todo-row')).toHaveText([/Read chapter 4/]);
	await expect(row(page, 'Read chapter 4')).toHaveAttribute('data-status', 'doing');
	await expect(page.getByTestId('plan-backlog')).toContainText('Submit lab report');
	await row(page, 'Clean the fridge').dragTo(planned);
	await page.getByRole('button', { name: 'Start sprint with 2 todos' }).click();
	await expect(page).toHaveURL(/\/sprint$/);

	await switchView(page, 'Week', 'week');
	for (const gymDay of ['2026-10-13', '2026-10-15']) {
		await expect(day(page, gymDay).getByTestId('todo-row')).toContainText('Gym');
	}
	await expect(page.getByTestId('backlog-rail').getByTestId('todo-row')).toHaveText([/Submit lab report/]);
	await expect(page.getByTestId('todo-row')).toHaveCount(5);
	await shot(page, 'next-week');
});
