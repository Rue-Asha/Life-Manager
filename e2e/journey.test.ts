import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock } from './helpers';

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
		await expect(day(page, gymDay).getByTestId('todo-row').filter({ hasText: 'Gym' })).toContainText('Recurring');
	}
	// Without a day, the dated todo sits on its due date until it is moved.
	await expect(day(page, '2026-10-08')).toContainText('Submit lab report');
	await row(page, 'Submit lab report').dragTo(day(page, '2026-10-07'), { sourcePosition: { x: 8, y: 8 } });
	await expect(day(page, '2026-10-07')).toContainText('Submit lab report');
	await expect(day(page, '2026-10-08')).not.toContainText('Submit lab report');
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

// Wednesday 7 October 2026: the sprint of 5–11 October is running, with work left in the backlog.
async function seedManaged(request: Parameters<typeof seed>[0]) {
	await reset(request);
	await setClock(request, '2026-10-07T10:00:00Z');
	return seed(request, {
		aspects: [
			{ name: 'Health', color: 'sage', icon: 'heart' },
			{ name: 'Uni', color: 'lavender', icon: 'cap' }
		],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [
			{ title: 'Morning run', aspect: 0, inSprint: true, day: '2026-10-05' },
			{ title: 'Draft the cover letter', aspect: 1, inSprint: true, day: '2026-10-06' },
			{ title: 'Read chapter 4', aspect: 1 },
			{ title: 'Book a physio appointment', aspect: 0 }
		]
	});
}

async function expectAspectPage(page: Page, aspect: number) {
	await expect(page).toHaveURL(new RegExp(`/aspects/${aspect}$`));
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Uni');
	await expect(row(page, 'Read chapter 4')).toBeVisible();
	await expect(page.getByTestId('aspect-sprint').getByTestId('todo-row')).toHaveText([/Read chapter 4/]);
	await expect(row(page, 'Read chapter 4')).toHaveAttribute('data-day', '2026-10-08');
	await expect(page.getByTestId('aspect-backlog').getByTestId('todo-row')).toHaveText([/Draft the cover letter/]);
}

test('Sprint management journey', async ({ page, request }) => {
	const { aspects } = await seedManaged(request);
	const rail = page.getByTestId('backlog-rail');
	const menu = page.getByRole('menu');

	// Pull from the docked rail
	await page.goto('/sprint');
	await page.getByRole('button', { name: 'Add to sprint: Read chapter 4' }).click();
	await expect(page.getByTestId('sprint-list').getByTestId('todo-row').filter({ hasText: 'Read chapter 4' })).toBeVisible();
	await expect(rail.getByTestId('todo-row').filter({ hasText: 'Read chapter 4' })).toHaveCount(0);

	// Give it a day from the Week's overlay rail, where Unscheduled lives
	await switchView(page, 'Week', 'week');
	await page.getByTestId('rail-toggle').click();
	await expect(day(page, 'unscheduled')).toContainText('Read chapter 4');
	await row(page, 'Read chapter 4').dragTo(day(page, '2026-10-08'), { sourcePosition: { x: 8, y: 8 } });
	await expect(day(page, '2026-10-08')).toContainText('Read chapter 4');

	// Send another back from its card
	await day(page, '2026-10-06').getByTestId('row-actions').click();
	await menu.getByRole('menuitem', { name: 'Move to backlog' }).click();
	await expect(day(page, '2026-10-06').getByTestId('todo-row')).toHaveCount(0);
	await expect(rail.getByTestId('todo-row').filter({ hasText: 'Draft the cover letter' })).toBeVisible();
	await page.getByTestId('rail-toggle').click();
	await expect(page.getByTestId('context-rail')).toBeHidden();
	await shot(page, 'manage-week');

	// Its aspect page shows both sides of the pipeline
	await page.getByRole('navigation', { name: 'Main' }).getByRole('list', { name: 'Aspects' }).getByRole('link', { name: 'Uni' }).click();
	await expectAspectPage(page, aspects[1]);
	await shot(page, 'manage-aspect');
});

test.describe('on a touch phone', () => {
	test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

	test('Sprint management journey', async ({ page, request }) => {
		const { aspects } = await seedManaged(request);
		const sheet = page.getByTestId('manage-sheet');
		const days = page.getByRole('navigation', { name: 'Days' });

		// Pull through the Manage sheet
		await page.goto('/sprint');
		await page.getByTestId('manage-button').tap();
		await sheet.getByRole('button', { name: 'Add to sprint: Read chapter 4' }).tap();
		await expect(sheet.getByTestId('todo-row').filter({ hasText: 'Read chapter 4' })).toHaveCount(0);
		await page.getByRole('button', { name: 'Close' }).tap();
		await expect(page.getByTestId('sprint-list').getByTestId('todo-row').filter({ hasText: 'Read chapter 4' })).toBeVisible();

		// Give it a day with the day picker
		await page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name: 'Week' }).tap();
		await expect(page).toHaveURL(/view=week$/);
		await days.getByRole('button', { name: 'Unscheduled' }).tap();
		await row(page, 'Read chapter 4').getByLabel('Day').selectOption({ label: 'Thu 8' });
		await expect(day(page, 'unscheduled').getByTestId('todo-row')).toHaveCount(0);
		await days.getByRole('button', { name: 'Thu 8' }).tap();
		await expect(day(page, '2026-10-08')).toContainText('Read chapter 4');

		// Send another back from its row
		await days.getByRole('button', { name: 'Tue 6' }).tap();
		await day(page, '2026-10-06').getByTestId('row-actions').tap();
		await page.getByRole('menu').getByRole('menuitem', { name: 'Move to backlog' }).tap();
		await expect(day(page, '2026-10-06').getByTestId('todo-row')).toHaveCount(0);
		await page.getByTestId('manage-button').tap();
		await expect(sheet.getByTestId('todo-row').filter({ hasText: 'Draft the cover letter' })).toBeVisible();
		await page.getByRole('button', { name: 'Close' }).tap();

		// Its aspect page, through Lists → Aspects
		await page.getByRole('link', { name: 'Lists' }).tap();
		await expect(page).toHaveURL(/\/menu$/);
		await page.getByRole('navigation', { name: 'Lists' }).getByRole('link', { name: 'Aspects', exact: true }).tap();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aspects');
		await page.getByRole('main').getByRole('link', { name: 'Uni', exact: true }).tap();
		await expectAspectPage(page, aspects[1]);
		await page.screenshot({ path: 'test-results/shots/journey-manage-aspect-375.png', fullPage: true });
	});
});
