import type { Locator, Page } from '@playwright/test';
import { dayColumn, expect, openNav, openNewTodo, test, reset, seed, setClock, todoRow, todoRows } from './helpers';
import { backlogRail, boardColumn, contextRail, railHide, railTab, sprintList, sprintPrompt, weekGrid } from './sprint-locators';
import { chooseDay, chooseStatus, statusOf } from './row-locators';

// Monday 5 October 2026, morning in Berlin: the first sprint runs 5–11 October.
const MONDAY = '2026-10-05T07:00:00Z';
const SUNDAY = '2026-10-11T16:00:00Z';

test.use({ viewport: { width: 1280, height: 800 } });

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const row = todoRow;
const day = (page: Page, key: string) => dayColumn(page, key === 'unscheduled' ? null : key);
const shot = (page: Page, name: string) =>
	page.screenshot({ path: `test-results/shots/journey-${name}-1280.png`, fullPage: true });

async function quickAdd(page: Page, title: string, aspect: string, due?: string) {
	const form = await openNewTodo(page);
	await form.getByLabel('Title').fill(title);
	await form.getByLabel('Aspect').selectOption({ label: aspect });
	if (due) await form.getByLabel('Due date', { exact: true }).fill(due);
	await form.getByRole('button', { name: 'Add todo' }).click();
	await expect(row(page, title)).toBeVisible();
}

// A drag can't start while the view cross-fade still plays: the old view lies under the new one and the new one is still fading in.
async function switchView(page: Page, name: string, view: string) {
	await page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name }).click();
	await expect(page).toHaveURL(new RegExp(`view=${view}$`));
	await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition') && document.getAnimations().length === 0);
}

test('Done-when journey', async ({ page, request }) => {
	// One test for the whole product: about 17 s alone, so the 30 s default is under 2x of headroom on a loaded runner.
	test.setTimeout(90_000);
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
	await openNav(page, 'Recurring');
	await page.getByRole('button', { name: 'New rule' }).click();
	const rule = page.getByRole('dialog', { name: 'New rule' });
	await rule.getByLabel('Title').fill('Gym');
	await rule.getByRole('radio', { name: 'Health' }).check();
	await rule.getByRole('checkbox', { name: 'Tuesday' }).check();
	await rule.getByRole('checkbox', { name: 'Thursday' }).check();
	await rule.getByRole('button', { name: 'Add rule' }).click();
	await expect(page.getByRole('listitem').filter({ hasText: 'Gym' })).toHaveCount(1);
	await shot(page, 'recurring');

	// Capture
	await openNav(page, 'Backlog');
	await quickAdd(page, 'Read chapter 4', 'Uni');
	await quickAdd(page, 'Book a physio appointment', 'Health');
	await quickAdd(page, 'Submit lab report', 'Uni', '2026-10-08');
	await quickAdd(page, 'Clean the fridge', 'Health');
	await shot(page, 'backlog');

	// Plan
	await openNav(page, 'Sprint');
	await sprintPrompt(page).getByRole('link').click();
	await expect(page).toHaveURL(/\/sprint\/plan$/);
	const planned = page.getByRole('region', { name: /^This sprint/ });
	await expect(todoRows(page.getByRole('region', { name: /^Due this week/ }))).toHaveText([/Submit lab report/]);
	await row(page, 'Read chapter 4').dragTo(planned);
	await row(page, 'Book a physio appointment').dragTo(planned);
	await expect(todoRows(planned)).toHaveCount(3);
	await shot(page, 'plan');
	await page.getByRole('button', { name: 'Start sprint with 3 todos' }).click();
	await expect(page).toHaveURL(/\/sprint$/);
	await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));

	// Work it in all three views
	await chooseStatus(page, row(page, 'Book a physio appointment'), 'Done');
	await expect(statusOf(row(page, 'Book a physio appointment'), 'Done')).toBeVisible();
	await shot(page, 'sprint-aspect');

	await switchView(page, 'Board', 'board');
	await row(page, 'Read chapter 4').dragTo(boardColumn(page, 'doing'), { sourcePosition: { x: 8, y: 8 } });
	await expect(boardColumn(page, 'doing')).toContainText('Read chapter 4');
	await expect(boardColumn(page, 'done')).toContainText('Book a physio appointment');
	await shot(page, 'sprint-board');

	await switchView(page, 'Week', 'week');
	// Tall enough to see Unscheduled and the days together: a drag that has to scroll mid-press does not start.
	await page.setViewportSize({ width: 1280, height: 1100 });
	for (const gymDay of ['2026-10-06', '2026-10-08']) {
		await expect(row(day(page, gymDay), 'Gym')).toBeVisible();
	}
	// Without a day, the dated todo sits on its due date until it is moved.
	await expect(day(page, '2026-10-08')).toContainText('Submit lab report');
	await row(page, 'Submit lab report').dragTo(day(page, '2026-10-07'), { sourcePosition: { x: 8, y: 8 } });
	await expect(day(page, '2026-10-07')).toContainText('Submit lab report');
	await expect(day(page, '2026-10-08')).not.toContainText('Submit lab report');
	await shot(page, 'sprint-week');

	await setClock(request, '2026-10-07T07:00:00Z');
	await openNav(page, 'Today');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Today');
	await expect(row(page, 'Submit lab report')).toBeVisible();
	await shot(page, 'today');

	// Review on Sunday
	await setClock(request, SUNDAY);
	await page.goto('/');
	await sprintPrompt(page).getByRole('link', { name: 'Review it' }).click();
	await expect(page).toHaveURL(/\/sprint\/review$/);
	await expect(page.getByRole('group', { name: 'Done todos' })).toContainText('Done 1');
	await page.getByRole('radiogroup', { name: 'Submit lab report' }).getByRole('radio', { name: 'Back to backlog' }).check();
	for (const gym of await page.getByRole('radiogroup', { name: 'Gym' }).all()) await gym.getByRole('radio', { name: 'Drop' }).check();
	await shot(page, 'review');
	await page.getByRole('button', { name: 'Carry 1, return 1, drop 2 and close' }).click();

	// Plan the next week
	await expect(page).toHaveURL(/\/sprint\/plan$/);
	await expect(page.getByText('Mon 12 – Sun 18 Oct', { exact: true })).toBeVisible();
	await expect(todoRows(planned)).toHaveText([/Read chapter 4/]);
	await expect(row(page, 'Read chapter 4')).toContainText('Status: Doing');
	await expect(backlogRail(page)).toContainText('Submit lab report');
	await row(page, 'Clean the fridge').dragTo(planned);
	await page.getByRole('button', { name: 'Start sprint with 2 todos' }).click();
	await expect(page).toHaveURL(/\/sprint$/);

	await switchView(page, 'Week', 'week');
	for (const gymDay of ['2026-10-13', '2026-10-15']) {
		await expect(todoRows(day(page, gymDay))).toContainText('Gym');
	}
	// The week holds its four todos; the carried-back one waits in the backlog, one tap on the "Backlog" tab away.
	await expect(todoRows(weekGrid(page))).toHaveCount(4);
	await railTab(page).click();
	await expect(todoRows(backlogRail(page))).toHaveText([/Submit lab report/]);
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

const hiddenRows = (scope: Page | Locator) => scope.getByRole('listitem', { name: /\S/, includeHidden: true });

async function expectAspectPage(page: Page, aspect: number) {
	await expect(page).toHaveURL(new RegExp(`/aspects/${aspect}$`));
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Uni');
	await expect(row(page, 'Read chapter 4')).toBeVisible();
	await expect(todoRows(page.getByRole('region', { name: /^This sprint/ }))).toHaveText([/Read chapter 4/]);
	await expect(row(page, 'Read chapter 4')).toHaveAttribute('data-day', '2026-10-08');
	await expect(todoRows(page.getByRole('region', { name: /^Backlog\b/ }))).toHaveText([/Draft the cover letter/]);
}

test('Sprint management journey', async ({ page, request }) => {
	const { aspects } = await seedManaged(request);
	const rail = backlogRail(page);
	const menu = page.getByRole('menu');

	// Pull from the docked rail
	await page.goto('/sprint');
	await page.getByRole('button', { name: 'Add to sprint: Read chapter 4' }).click();
	await expect(row(sprintList(page), 'Read chapter 4')).toBeVisible();
	await expect(row(rail, 'Read chapter 4')).toHaveCount(0);

	// Give it a day from the Week view, where Unscheduled sits below the days (tall enough to see both without scrolling mid-drag)
	await page.setViewportSize({ width: 1280, height: 1100 });
	await switchView(page, 'Week', 'week');
	await expect(day(page, 'unscheduled')).toContainText('Read chapter 4');
	await row(page, 'Read chapter 4').dragTo(day(page, '2026-10-08'), { sourcePosition: { x: 8, y: 8 } });
	await expect(day(page, '2026-10-08')).toContainText('Read chapter 4');

	// Send another back from its chip's "Status and day" menu; the folded backlog's tab unfolds it
	await day(page, '2026-10-06').getByRole('button', { name: /^Status: / }).click();
	await menu.getByRole('menuitem', { name: 'Move to backlog' }).click();
	await expect(todoRows(day(page, '2026-10-06'))).toHaveCount(0);
	await railTab(page).click();
	await expect(row(rail, 'Draft the cover letter')).toBeVisible();
	await railHide(page).click();
	await expect(contextRail(page)).toBeHidden();
	await shot(page, 'manage-week');

	// Its aspect page shows both sides of the pipeline
	await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: /^More/ }).click();
	await page.getByRole('menu', { name: 'More' }).getByRole('group', { name: 'Aspects' }).getByRole('menuitem', { name: /^Uni/ }).click();
	await expectAspectPage(page, aspects[1]);
	await shot(page, 'manage-aspect');
});

test.describe('on a touch phone', () => {
	test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

	test('Sprint management journey', async ({ page, request }) => {
		const { aspects } = await seedManaged(request);
		const sheet = backlogRail(page.getByRole('dialog', { name: 'Backlog' }));
		const days = page.getByRole('navigation', { name: 'Days' });

		// Pull through the Manage sheet
		await page.goto('/sprint');
		await page.getByRole('button', { name: 'Manage', exact: true }).tap();
		await sheet.getByRole('button', { name: 'Add to sprint: Read chapter 4' }).tap();
		await expect(row(sheet, 'Read chapter 4')).toHaveCount(0);
		await page.getByRole('button', { name: 'Close' }).tap();
		await expect(row(sprintList(page), 'Read chapter 4')).toBeVisible();

		// Give it a day with the day picker
		await page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name: 'Week' }).tap();
		await expect(page).toHaveURL(/view=week$/);
		await page.waitForFunction(() => document.getAnimations().length === 0);
		await days.getByRole('button', { name: 'Unscheduled' }).tap();
		await chooseDay(page, row(page, 'Read chapter 4'), 'Thu 8');
		await expect(todoRows(day(page, 'unscheduled'))).toHaveCount(0);
		await days.getByRole('button', { name: 'Thu 8' }).tap();
		await expect(day(page, '2026-10-08')).toContainText('Read chapter 4');

		// Send another back from its row
		await days.getByRole('button', { name: 'Tue 6' }).tap();
		await day(page, '2026-10-06').getByRole('button', { name: 'More actions' }).tap();
		await page.getByRole('menu').getByRole('menuitem', { name: 'Move to backlog' }).tap();
		await expect(todoRows(day(page, '2026-10-06'))).toHaveCount(0);
		await page.getByRole('button', { name: 'Manage', exact: true }).tap();
		await expect(row(sheet, 'Draft the cover letter')).toBeVisible();
		await page.getByRole('button', { name: 'Close' }).tap();

		// Its aspect page, through the More tab
		await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^More/ }).tap();
		await expect(page).toHaveURL(/\/menu$/);
		await page.getByRole('main').getByRole('list', { name: 'Aspects' }).getByRole('link', { name: /^Uni/ }).tap();
		await expectAspectPage(page, aspects[1]);
		await page.screenshot({ path: 'test-results/shots/journey-manage-aspect-375.png', fullPage: true });
	});
});
