import type { Locator, Page } from '@playwright/test';
import { aspectGroup, dayColumn, expect, test, reset, seed, setClock, todoRow, todoRows } from './helpers';
import {
	backlogRail,
	boardColumn,
	contextRail,
	manageButton,
	railHide,
	railTab,
	sprintList,
	sprintPrompt,
	weekGrid
} from './sprint-locators';
import { STATUS_LABEL, chooseDay, chooseStatus, statusOf } from './row-locators';

// Wednesday 7 October 2026 in Berlin; its sprint week runs Monday 5 to Sunday 11 October.
const NOW = '2026-10-07T10:00:00Z';
const WEEK = '2026-10-05';

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await setClock(request, NOW);
	await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const ASPECTS = [
	{ name: 'Health', color: 'sage', icon: 'heart' },
	{ name: 'Uni', color: 'lavender', icon: 'cap' },
	{ name: 'Home', color: 'ochre', icon: 'house' }
] as const;

const row = todoRow;

test('Scenario: Sprint screens prompt to review when pending', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: '2026-09-28' },
		todos: [{ title: 'Clean the fridge', inSprint: true }]
	});

	for (const view of ['aspect', 'board', 'week']) {
		await page.goto(`/sprint?view=${view}`);
		const prompt = sprintPrompt(page);
		await expect(prompt.getByRole('link', { name: 'Review the sprint', exact: true })).toHaveAttribute('href', '/sprint/review');
		await expect(prompt.getByRole('link')).toHaveAttribute('href', '/sprint/review');
		await expect(page.locator('a[href="/sprint/plan"]')).toHaveCount(0);
		await expect(page.getByRole('button', { name: /start/i })).toHaveCount(0);
		await expect(todoRows(page)).toHaveCount(0);
	}
});

test('Scenario: Sunday shows the review prompt above the sprint', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Weekly reset', inSprint: true, day: '2026-10-11' }]
	});
	await setClock(request, '2026-10-11T10:00:00Z');

	for (const view of ['aspect', 'board', 'week']) {
		await page.goto(`/sprint?view=${view}`);
		const prompt = sprintPrompt(page);
		await expect(prompt.getByRole('link', { name: 'Review it', exact: true })).toHaveAttribute('href', '/sprint/review');
		await expect(prompt.getByRole('link')).toHaveAttribute('href', '/sprint/review');
		await expect(row(page, 'Weekly reset')).toBeVisible();
	}

	await page.goto('/sprint');
	await chooseStatus(page, row(page, 'Weekly reset'), 'Done');
	await expect(statusOf(row(page, 'Weekly reset'), 'Done')).toBeVisible();
	await page.reload();
	await expect(statusOf(row(page, 'Weekly reset'), 'Done')).toBeVisible();
});

test('Scenario: Sprint by aspect groups todos with status', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Morning run', aspect: 0, inSprint: true, status: 'done' },
			{ title: 'Book a physio appointment', aspect: 0, inSprint: true, status: 'doing' },
			{ title: 'Read chapter 4', aspect: 1, inSprint: true }
		]
	});
	await page.goto('/sprint');

	const health = aspectGroup(sprintList(page), 'Health');
	await expect(health.getByRole('heading', { name: 'Health' })).toBeVisible();
	await expect(health.locator('.nav-tile svg')).toBeVisible();
	await expect(todoRows(health)).toHaveCount(2);
	await expect(statusOf(row(page, 'Morning run'), 'Done')).toBeVisible();
	await expect(statusOf(row(page, 'Book a physio appointment'), 'Doing')).toBeVisible();

	const uni = aspectGroup(sprintList(page), 'Uni');
	await expect(uni.getByRole('heading', { name: 'Uni' })).toBeVisible();
	await expect(todoRows(uni)).toHaveCount(1);
	await expect(statusOf(row(page, 'Read chapter 4'), 'To do')).toBeVisible();
});

test('Scenario: Aspects without sprint todos are hidden', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Morning run', aspect: 0, inSprint: true },
			{ title: 'Clean the fridge', aspect: 2 }
		]
	});
	await page.goto('/sprint?view=aspect');

	await expect(aspectGroup(sprintList(page), 'Health')).toBeVisible();
	await expect(aspectGroup(sprintList(page), 'Uni')).toHaveCount(0);
	await expect(aspectGroup(sprintList(page), 'Home')).toHaveCount(0);
});

test('Scenario: Empty sprint points to the backlog', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge' }]
	});
	await page.goto('/sprint');

	const empty = sprintList(page);
	await expect(empty.getByRole('heading', { name: 'Nothing in this sprint yet' })).toBeVisible();
	await expect(empty).toContainText('Add a todo above, or pull some in from the backlog.');
	await empty.getByRole('link', { name: 'Open backlog' }).click();
	await expect(page).toHaveURL(/\/backlog$/);
});

test('Scenario: Todo created from a sprint view joins the active sprint', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK }
	});
	await page.goto('/sprint?view=aspect');

	// The inline add takes a title for the first aspect; another aspect or a day goes through "New todo".
	await page.getByRole('textbox', { name: 'Add a todo' }).fill('Read chapter 4');
	await page.getByRole('button', { name: 'Add', exact: true }).click();

	const created = todoRows(aspectGroup(sprintList(page), 'Health'));
	await expect(created).toContainText('Read chapter 4');
	await page.reload();
	await expect(statusOf(created, 'To do')).toBeVisible();
	await expect(created).toHaveAttribute('data-day', '');
	await page.goto('/backlog');
	await expect(page.getByText('Your backlog is empty')).toBeVisible();
});

test('Switching views keeps the sprint and marks the current view', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }]
	});
	await page.goto('/sprint');
	const views = page.getByRole('navigation', { name: 'Sprint view' });
	await expect(views.getByRole('link', { name: 'By aspect' })).toHaveAttribute('aria-current', 'page');

	await views.getByRole('link', { name: 'Board' }).click();
	await expect(page).toHaveURL(/view=board$/);
	await expect(views.getByRole('link', { name: 'Board' })).toHaveAttribute('aria-current', 'page');

	await views.getByRole('link', { name: 'Week' }).click();
	await expect(page).toHaveURL(/view=week$/);
	await expect(row(page, 'Clean the fridge')).toBeVisible();
});

async function expectStatusInEveryView(page: Page, title: string, status: string) {
	for (const view of ['aspect', 'board', 'week']) {
		await page.goto(`/sprint?view=${view}`);
		await page.reload();
		await expect(statusOf(row(page, title), STATUS_LABEL[status])).toBeVisible();
		if (view === 'board') await expect(boardColumn(page, status as 'todo' | 'doing' | 'done')).toContainText(title);
	}
}

test('Scenario: Change status from every sprint view', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Draft the cover letter', aspect: 1, inSprint: true, day: '2026-10-06' }]
	});
	const title = 'Draft the cover letter';

	await page.goto('/sprint?view=aspect');
	await chooseStatus(page, row(page, title), 'Doing');
	await expect(statusOf(row(page, title), 'Doing')).toBeVisible();
	await expectStatusInEveryView(page, title, 'doing');

	await page.goto('/sprint?view=board');
	await chooseStatus(page, row(page, title), 'Done');
	await expect(boardColumn(page, 'done')).toContainText(title);
	await expectStatusInEveryView(page, title, 'done');

	await page.goto('/sprint?view=week');
	await chooseStatus(page, row(page, title), 'To do');
	await expect(statusOf(row(page, title), 'To do')).toBeVisible();
	await expectStatusInEveryView(page, title, 'todo');
});

test('Scenario: Checkbox toggles done', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Clean the fridge', aspect: 2, inSprint: true },
			{ title: 'Book a physio appointment', aspect: 0, inSprint: true, status: 'doing' }
		]
	});

	for (const [view, title] of [
		['aspect', 'Clean the fridge'],
		['board', 'Book a physio appointment']
	]) {
		await page.goto(`/sprint?view=${view}`);
		await chooseStatus(page, row(page, title), 'Done');
		await expect(statusOf(row(page, title), 'Done')).toBeVisible();
		await page.reload();
		await expect(row(page, title)).toBeVisible();
		await expect(statusOf(row(page, title), 'Done')).toBeVisible();
		await expect(row(page, title).getByRole('button', { name: title })).not.toHaveCSS('text-decoration-line', /line-through/);
	}
});

test('Scenario: Move a todo between board columns by drag', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Draft the cover letter', aspect: 1, inSprint: true }]
	});
	await page.goto('/sprint?view=board');

	await row(page, 'Draft the cover letter').dragTo(boardColumn(page, 'doing'), { sourcePosition: { x: 8, y: 8 } });
	await expect(boardColumn(page, 'doing')).toContainText('Draft the cover letter');

	await page.reload();
	await expect(boardColumn(page, 'doing')).toContainText('Draft the cover letter');
	await expect(statusOf(row(page, 'Draft the cover letter'), 'Doing')).toBeVisible();
});

test('Scenario: Board and week cards offer the send-back action', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Draft the cover letter', aspect: 1, inSprint: true, status: 'doing', day: '2026-10-08' },
			{ title: 'Clean the fridge', aspect: 2, inSprint: true, day: '2026-10-06' },
			{ title: 'Gym', aspect: 0, inSprint: true, day: '2026-10-06', recurring: true }
		]
	});
	const cardIn = (scope: Locator, title: string) => scope.getByRole('group', { name: title });
	const menu = page.getByRole('menu');

	// A week chip keeps its moves in the "Status and day" menu behind its glyph; the Board card has "More actions".
	await page.goto('/sprint?view=week');
	await cardIn(day(page, '2026-10-06'), 'Clean the fridge').getByRole('button', { name: /^Status: / }).click();
	await expect(menu.getByRole('menuitem')).toHaveText(['Move to backlog']);
	await page.keyboard.press('Escape');
	await cardIn(day(page, '2026-10-06'), 'Gym').getByRole('button', { name: /^Status: / }).click();
	await expect(menu.getByRole('menuitem')).toHaveText(['Remove from sprint']);
	await page.keyboard.press('Escape');

	await page.goto('/sprint?view=board');
	const doing = boardColumn(page, 'doing');
	await cardIn(doing, 'Draft the cover letter').getByRole('button', { name: 'More actions' }).click();
	await menu.getByRole('menuitem', { name: 'Move to backlog' }).click();
	const inRail = row(backlogRail(page), 'Draft the cover letter');
	await expect(todoRows(doing)).toHaveCount(0);
	await expect(inRail).toBeVisible();

	await page.reload();
	await expect(inRail).toBeVisible();
	await expect(todoRows(doing)).toHaveCount(0);
});

const railRow = (page: Page, title: string) => row(backlogRail(page), title);

// The view switch and the rail's fold cross-fade; a drag that starts during them would hit the old page or a layout still moving.
async function settled(page: Page) {
	await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition') && document.getAnimations().length === 0);
}

test('Scenario: Drop a rail todo on a board column sets its status', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Morning run', aspect: 0, inSprint: true }, { title: 'Book a physio appointment', aspect: 0 }]
	});
	await page.goto('/sprint?view=board');
	await settled(page);

	await railRow(page, 'Book a physio appointment').dragTo(boardColumn(page, 'doing'), {
		sourcePosition: { x: 8, y: 8 }
	});
	await expect(boardColumn(page, 'doing')).toContainText('Book a physio appointment');

	await page.reload();
	await expect(statusOf(row(page, 'Book a physio appointment'), 'Doing')).toBeVisible();
	await expect(boardColumn(page, 'doing')).toContainText('Book a physio appointment');
	await expect(railRow(page, 'Book a physio appointment')).toHaveCount(0);
});

test('Scenario: Drop a rail todo on the Done column', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Morning run', aspect: 0, inSprint: true }, { title: 'Book a physio appointment', aspect: 0 }]
	});
	await page.goto('/sprint?view=board');
	await settled(page);

	await railRow(page, 'Book a physio appointment').dragTo(boardColumn(page, 'done'), {
		sourcePosition: { x: 8, y: 8 }
	});
	await expect(boardColumn(page, 'done')).toContainText('Book a physio appointment');

	await page.reload();
	await expect(statusOf(row(page, 'Book a physio appointment'), 'Done')).toBeVisible();
	await expect(statusOf(row(page, 'Book a physio appointment'), 'Done')).toBeVisible();
});

test('Scenario: Drop a rail todo on a day column sets its day', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Morning run', aspect: 0, inSprint: true }, { title: 'Book a physio appointment', aspect: 0 }]
	});
	// Tall enough to see Unscheduled and the days together: a drag that has to scroll mid-press does not start.
	await page.setViewportSize({ width: 1280, height: 1100 });
	await page.goto('/sprint?view=week');
	await settled(page);
	await railTab(page).click();
	await expect(railRow(page, 'Book a physio appointment')).toBeVisible();
	await settled(page);

	await railRow(page, 'Book a physio appointment').dragTo(day(page, '2026-10-08'), {
		sourcePosition: { x: 8, y: 8 }
	});
	await expect(day(page, '2026-10-08')).toContainText('Book a physio appointment');

	await page.reload();
	await expect(row(page, 'Book a physio appointment')).toHaveAttribute('data-day', '2026-10-08');
	await expect(statusOf(row(page, 'Book a physio appointment'), 'To do')).toBeVisible();
	await expect(railRow(page, 'Book a physio appointment')).toHaveCount(0);
});

test('Scenario: Refused move returns the item to where it was', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Draft the cover letter', aspect: 1, inSprint: true }]
	});
	let refuse!: () => void;
	const held = new Promise<void>((resolve) => (refuse = resolve));
	await page.route(
		(url) => url.pathname === '/todos' && url.search === '?/setStatus',
		async (route) => {
			await held;
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ type: 'failure', status: 400, data: JSON.stringify([{ error: 1 }, 'not-found']) })
			});
		}
	);
	await page.goto('/sprint?view=board');
	await settled(page);

	const todo = boardColumn(page, 'todo');
	const doing = boardColumn(page, 'doing');
	await row(page, 'Draft the cover letter').dragTo(doing, { sourcePosition: { x: 8, y: 8 } });
	await expect(doing).toContainText('Draft the cover letter');

	refuse();
	await expect(row(todo, 'Draft the cover letter')).toBeVisible();
	await expect(todoRows(doing)).toHaveCount(0);
	await page.reload();
	await expect(statusOf(row(page, 'Draft the cover letter'), 'To do')).toBeVisible();
});

test('Scenario: Empty board column shows a placeholder', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Clean the fridge', aspect: 2, inSprint: true },
			{ title: 'Morning run', aspect: 0, inSprint: true, status: 'done' }
		]
	});
	await page.goto('/sprint?view=board');

	await expect(boardColumn(page, 'doing').getByText('Nothing in progress')).toBeVisible();
	await expect(todoRows(boardColumn(page, 'doing'))).toHaveCount(0);
	await expect(boardColumn(page, 'todo').getByText('Nothing left to start')).toHaveCount(0);
});

test('Scenario: Board card shows the aspect in its meta line', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Read chapter 4', aspect: 1, inSprint: true, status: 'doing' }]
	});
	await page.goto('/sprint?view=board');

	const card = boardColumn(page, 'doing').getByRole('group', { name: 'Read chapter 4' });
	const tag = card.getByText('Uni', { exact: true });
	await expect(tag).toHaveText('Uni');
	const [dot, uni] = await tag.evaluate((el) => {
		const probe = document.createElement('i');
		probe.style.background = 'var(--aspect-lavender)';
		document.body.append(probe);
		const colour = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return [getComputedStyle(el.querySelector('i')!).backgroundColor, colour];
	});
	expect(dot).toBe(uni);
	await expect(card.getByText('Doing', { exact: true })).toBeHidden();
	await expect(card.getByRole('button', { name: /^Status: / })).toHaveCount(0);
});

const day = (page: Page | Locator, key: string) => dayColumn(page, key === 'unscheduled' ? null : key);

const box = async (locator: Locator) => (await locator.boundingBox())!;
const weekdays = (page: Page) =>
	['05', '06', '07', '08', '09', '10', '11'].map((d) => day(page, `2026-10-${d}`));

test('Scenario: Board columns share the width at 1280', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Draft the cover letter', aspect: 1, inSprint: true }]
	});
	await page.goto('/sprint?view=board');
	await settled(page);

	const columns = await Promise.all(['todo', 'doing', 'done'].map((s) => box(boardColumn(page, s as 'todo' | 'doing' | 'done'))));
	for (const c of columns) {
		expect(Math.abs(c.width - columns[0].width)).toBeLessThanOrEqual(1);
		expect(Math.abs(c.y - columns[0].y)).toBeLessThanOrEqual(1);
	}

	// Together the columns span the board's content width, and the board stops short of the docked rail.
	const row = await box(boardColumn(page, 'todo').locator('xpath=..'));
	expect(Math.abs(columns[0].x - row.x)).toBeLessThanOrEqual(1);
	expect(Math.abs(columns[2].x + columns[2].width - (row.x + row.width))).toBeLessThanOrEqual(1);
	const rail = await box(contextRail(page));
	expect(columns[2].x + columns[2].width).toBeLessThanOrEqual(rail.x);

	// The columns hold their cards; they do not reach down to the viewport bottom.
	for (const c of columns) expect(c.y + c.height).toBeLessThan(800 - 32);
});

test('Scenario: Week shows the whole week in one row at 1280', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }, { title: 'Book a physio appointment', aspect: 0 }]
	});
	await page.goto('/sprint?view=week');
	await settled(page);

	// Folded: no docked rail, a slim "Backlog" tab with the count.
	const tab = railTab(page);
	await expect(contextRail(page)).toBeHidden();
	await expect(tab).toBeVisible();
	await expect(tab).toHaveAttribute('aria-expanded', 'false');
	await expect(tab).toContainText('Backlog');
	await expect(tab).toContainText('1');

	const days = await Promise.all(weekdays(page).map(box));
	for (const d of days) {
		expect(d.y).toBe(days[0].y);
		expect(d.width).toBeGreaterThanOrEqual(120);
	}
	for (let i = 1; i < days.length; i++) expect(days[i].x).toBeGreaterThan(days[i - 1].x);
	const week = weekGrid(page);
	expect(await week.evaluate((el) => el.scrollWidth === el.clientWidth)).toBe(true);

	// Unscheduled sits in the content below the day columns, never in the rail.
	const unscheduled = day(page, 'unscheduled');
	await expect(unscheduled).toContainText('Clean the fridge');
	expect((await box(unscheduled)).y).toBeGreaterThan(days[0].y + days[0].height - 1);

	await tab.click();
	await expect(contextRail(page)).toBeVisible();
	await expect(railHide(page)).toHaveAttribute('aria-expanded', 'true');
	await expect(railRow(page, 'Book a physio appointment')).toBeVisible();
	await expect(contextRail(page).getByRole('region', { name: /^Unscheduled/, includeHidden: true })).toHaveCount(0);
});

test('Scenario: Switching Week and Board folds and docks the rail', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }, { title: 'Book a physio appointment', aspect: 0 }]
	});
	await page.goto('/sprint?view=board');
	const views = page.getByRole('navigation', { name: 'Sprint view' });
	await settled(page);
	await expect(contextRail(page)).toBeVisible();
	await expect(railTab(page)).toHaveCount(0);
	await expect(railHide(page)).toHaveCount(0);

	await views.getByRole('link', { name: 'Week' }).click();
	await expect(page).toHaveURL(/view=week$/);
	await settled(page);
	await expect(contextRail(page)).toBeHidden();
	await expect(railTab(page)).toBeVisible();

	await views.getByRole('link', { name: 'Board' }).click();
	await expect(page).toHaveURL(/view=board$/);
	await settled(page);
	await expect(contextRail(page)).toBeVisible();
	await expect(railTab(page)).toHaveCount(0);
	await expect(railHide(page)).toHaveCount(0);
});

test('Scenario: Unfolded backlog wraps the week days', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }, { title: 'Book a physio appointment', aspect: 0 }]
	});
	await page.goto('/sprint?view=week');
	await settled(page);
	const tab = railTab(page);
	await tab.click();
	await expect(tab).toHaveCount(0);
	await expect(contextRail(page)).toBeVisible();
	await expect(railHide(page)).toBeFocused();

	// Docked, the seven columns no longer share one row, and nothing scrolls sideways.
	const docked = await Promise.all(weekdays(page).map(box));
	expect(new Set(docked.map((d) => d.y)).size).toBeGreaterThan(1);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

	await railHide(page).click();
	await expect(contextRail(page)).toBeHidden();
	await expect(railTab(page)).toBeFocused();
	await expect(railTab(page)).toHaveAttribute('aria-expanded', 'false');
	await settled(page);
	const folded = await Promise.all(weekdays(page).map(box));
	expect(new Set(folded.map((d) => d.y)).size).toBe(1);
});

test('Scenario: Busy day grows inside the week without sideways scroll', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: Array.from({ length: 15 }, (_, i) => ({
			title: `Errand ${i + 1}`,
			aspect: 2,
			inSprint: true,
			day: '2026-10-07'
		}))
	});
	await page.goto('/sprint?view=week');
	await settled(page);

	const busy = day(page, '2026-10-07');
	await expect(todoRows(busy)).toHaveCount(15);
	// The column grows with its todos (the page scrolls vertically); it holds them all and does not scroll inside.
	const grown = await busy.evaluate((el) => ({ inside: el.scrollHeight > el.clientHeight + 1, height: el.getBoundingClientRect().height }));
	expect(grown.inside).toBe(false);
	expect(grown.height).toBeGreaterThan(15 * 30);
	expect(await page.evaluate(() => document.documentElement.scrollHeight > document.documentElement.clientHeight)).toBe(true);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('Scenario: Week wraps between 1024 and 1279', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }]
	});
	await page.setViewportSize({ width: 1100, height: 800 });
	await page.goto('/sprint?view=week');
	await settled(page);

	await expect(contextRail(page)).toBeHidden();
	await expect(railTab(page)).toBeHidden();
	await expect(manageButton(page)).toBeVisible();

	const days = await Promise.all(weekdays(page).map(box));
	expect(days[6].y).toBeGreaterThan(days[0].y);

	await expect(day(page, 'unscheduled')).toHaveCount(1);
	await expect(day(page, 'unscheduled')).toBeVisible();
	await expect(day(page, 'unscheduled')).toContainText('Clean the fridge');
	expect((await box(day(page, 'unscheduled'))).y).toBeGreaterThan(days[6].y);
});

test('Scenario: Assign a todo to a day by drag', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }]
	});
	// Tall enough to see Unscheduled and the days together: a drag that has to scroll mid-press does not start.
	await page.setViewportSize({ width: 1280, height: 1100 });
	await page.goto('/sprint?view=week');
	await settled(page);
	await expect(day(page, 'unscheduled')).toContainText('Clean the fridge');

	await row(page, 'Clean the fridge').dragTo(day(page, '2026-10-06'));
	await expect(day(page, '2026-10-06')).toContainText('Clean the fridge');

	await page.reload();
	await expect(day(page, '2026-10-06')).toContainText('Clean the fridge');
	await expect(todoRows(day(page, 'unscheduled'))).toHaveCount(0);
	await expect(row(page, 'Clean the fridge')).toHaveAttribute('data-day', '2026-10-06');
});

test('Scenario: Day picker offers only days of the active sprint', async ({ page, request, baseURL }) => {
	const { todos } = await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Clean the fridge', aspect: 2, inSprint: true },
			{ title: 'Water the plants', aspect: 2, inSprint: true }
		]
	});
	// Week chips move by drag on desktop; the row's picker is the same one the phone's week uses.
	await page.goto('/sprint?view=aspect');

	await row(page, 'Clean the fridge').getByRole('button', { name: 'More actions' }).click();
	await expect(page.getByRole('menu', { name: 'More actions' }).getByRole('menuitemradio')).toHaveText([
		'Unscheduled',
		'Mon 5',
		'Tue 6',
		'Wed 7',
		'Thu 8',
		'Fri 9',
		'Sat 10',
		'Sun 11'
	]);
	await page.keyboard.press('Escape');

	const setDay = async (id: number, day: string) => {
		const response = await request.post('/todos?/setDay', {
			form: { id: String(id), day },
			headers: { origin: baseURL!, 'x-sveltekit-action': 'true' }
		});
		return response.json();
	};
	expect((await setDay(todos[0], '2026-10-12')).type).toBe('success');
	const refused = await setDay(todos[1], '2026-10-04');
	expect(refused.type).toBe('failure');
	expect(refused.data).toContain('day-in-past');

	await page.reload();
	const remaining = todoRows(sprintList(page));
	await expect(remaining).toHaveCount(1);
	await expect(remaining).toContainText('Water the plants');
	await expect(remaining).toHaveAttribute('data-day', '');
	await page.goto('/backlog');
	await expect(row(page, 'Clean the fridge')).toHaveAttribute('data-day', '2026-10-12');
});

test('Scenario: Today is highlighted in the week view', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: WEEK } });
	await page.goto('/sprint?view=week');

	// Today's column is the charcoal one: the inverse ground of the fingerprint, read from the token rather than a literal.
	const inverse = await page.evaluate(() => {
		const probe = document.createElement('i');
		probe.style.background = 'var(--surface-inverse)';
		document.body.append(probe);
		const colour = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return colour;
	});
	await expect(day(page, '2026-10-07')).toHaveCSS('background-color', inverse);
	await expect(day(page, '2026-10-06')).not.toHaveCSS('background-color', inverse);
});

test("Scenario: Today's column is marked", async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: WEEK } });
	await page.goto('/sprint?view=week');

	// By attribute and by the word, so the mark does not rest on the colour alone.
	await expect(day(page, '2026-10-07')).toHaveAttribute('aria-current', 'date');
	await expect(day(page, '2026-10-07')).toContainText('Today');
	await expect(page.locator('[aria-current="date"]')).toHaveCount(1);
	for (const d of ['05', '06', '08', '09', '10', '11']) {
		await expect(day(page, `2026-10-${d}`)).not.toHaveAttribute('aria-current', 'date');
		await expect(day(page, `2026-10-${d}`)).not.toContainText('Today');
	}
});

test('Scenario: Done todos stay on their day', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Morning run', aspect: 0, inSprint: true, day: '2026-10-05' }]
	});
	await page.goto('/sprint?view=week');

	await chooseStatus(page, row(page, 'Morning run'), 'Done');
	await expect(statusOf(row(page, 'Morning run'), 'Done')).toBeVisible();
	await page.reload();
	await expect(statusOf(todoRows(day(page, '2026-10-05')), 'Done')).toBeVisible();
	await expect(statusOf(day(page, '2026-10-05'), 'Done')).toBeVisible();
});

test('Scenario: Todo created in a day column is assigned to that day', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: WEEK } });
	await page.goto('/sprint?view=week');

	await day(page, '2026-10-07').getByRole('button', { name: 'Add a todo to Wed 7' }).click();
	const form = page.getByRole('form', { name: 'New todo' });
	await form.getByLabel('Title').fill('Return library books');
	await form.getByRole('button', { name: 'Add todo' }).click();

	await expect(day(page, '2026-10-07')).toContainText('Return library books');
	await page.reload();
	await expect(row(page, 'Return library books')).toHaveAttribute('data-day', '2026-10-07');
	await page.goto('/sprint?view=aspect');
	await expect(row(page, 'Return library books')).toBeVisible();
});

test('Scenario: Recurring instances appear in the week view', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		rules: [{ title: 'Gym', aspect: 0, weekdays: [2] }]
	});
	await page.goto('/sprint/plan');
	await page.getByRole('button', { name: 'Start sprint' }).click();
	await expect(page).toHaveURL(/\/sprint$/);
	await page.goto('/sprint?view=week');

	await expect(todoRows(day(page, '2026-10-06'))).toContainText('Gym');
});

test.describe('on a touch phone', () => {
	test.use({ hasTouch: true, isMobile: true });

	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 800 });
	});

	test('Scenario: Move a todo between board columns with the status menu on touch', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			sprint: { state: 'active', weekStart: WEEK },
			todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }]
		});
		await page.goto('/sprint?view=board');
		await expect(page.getByRole('group', { name: 'Clean the fridge' })).not.toHaveAttribute('draggable', 'true');

		// The card's "More actions" menu holds the Status group; the card has no status control of its own.
		await expect(row(page, 'Clean the fridge').getByRole('button', { name: /^Status: / })).toHaveCount(0);
		await chooseStatus(page, row(page, 'Clean the fridge'), 'Done');
		await expect(todoRows(boardColumn(page, 'todo'))).toHaveCount(0);

		await page.getByRole('group', { name: 'Column' }).getByRole('button', { name: /^Done/ }).click();
		await expect(boardColumn(page, 'done')).toContainText('Clean the fridge');
		await expect(boardColumn(page, 'done')).toBeVisible();
	});

	test('Scenario: Phone Board shows one column at a time', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			sprint: { state: 'active', weekStart: WEEK },
			todos: [
				{ title: 'Clean the fridge', aspect: 2, inSprint: true },
				{ title: 'Read chapter 4', aspect: 1, inSprint: true },
				{ title: 'Book a physio appointment', aspect: 0, inSprint: true, status: 'doing' }
			]
		});
		await page.goto('/sprint?view=board');

		const columns = page.getByRole('group', { name: 'Column' });
		await expect(columns.getByRole('button')).toHaveText([/To do\s*2/, /Doing\s*1/, /Done\s*0/]);
		await expect(columns.getByRole('button', { name: /^To do/ })).toHaveAttribute('aria-pressed', 'true');
		await expect(boardColumn(page, 'todo')).toBeVisible();
		await expect(boardColumn(page, 'doing')).toBeHidden();
		await expect(boardColumn(page, 'done')).toBeHidden();

		await columns.getByRole('button', { name: /^Doing/ }).click();
		await expect(boardColumn(page, 'doing')).toBeVisible();
		await expect(boardColumn(page, 'doing')).toContainText('Book a physio appointment');
		await expect(boardColumn(page, 'todo')).toBeHidden();
		await expect(boardColumn(page, 'done')).toBeHidden();
	});

	test('Scenario: Assign a todo to a day with the day picker on touch', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			sprint: { state: 'active', weekStart: WEEK },
			todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }]
		});
		await page.goto('/sprint?view=week');
		await expect(page.getByRole('listitem', { name: 'Clean the fridge', includeHidden: true })).toBeHidden();

		const days = page.getByRole('navigation', { name: 'Days' });
		await days.getByRole('button', { name: /^Unscheduled/ }).click();
		await expect(page.getByRole('group', { name: 'Clean the fridge' })).not.toHaveAttribute('draggable', 'true');
		// The Day group of the todo's "More actions" menu.
		await chooseDay(page, row(page, 'Clean the fridge'), 'Fri 9');
		await expect(todoRows(day(page, 'unscheduled'))).toHaveCount(0);

		await days.getByRole('button', { name: /^Fri 9/ }).click();
		await expect(row(page, 'Clean the fridge')).toBeVisible();
		await expect(row(page, 'Clean the fridge')).toHaveAttribute('data-day', '2026-10-09');
	});

	test('Scenario: Phone shows one day at a time', async ({ page, request }) => {
		await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: WEEK } });
		await page.goto('/sprint?view=week');

		const columns = page.getByRole('region', { name: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d|^Unscheduled/, includeHidden: true });
		await expect(columns.filter({ visible: true })).toHaveCount(1);
		await expect(day(page, '2026-10-07')).toBeVisible();

		const days = page.getByRole('navigation', { name: 'Days' });
		await expect(days.getByRole('button')).toHaveCount(8);
		for (const name of ['Mon 5', 'Tue 6', 'Wed 7', 'Thu 8', 'Fri 9', 'Sat 10', 'Sun 11', 'Unscheduled']) {
			await expect(days.getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible();
		}
		await expect(days.getByRole('button', { name: /^Wed 7/ })).toHaveAttribute('aria-current', 'true');

		await days.getByRole('button', { name: /^Fri 9/ }).click();
		await expect(day(page, '2026-10-09')).toBeVisible();
		await expect(columns.filter({ visible: true })).toHaveCount(1);

		await days.getByRole('button', { name: /^Unscheduled/ }).click();
		await expect(day(page, 'unscheduled')).toBeVisible();
		await expect(columns.filter({ visible: true })).toHaveCount(1);
	});
});

test('Scenario: Week chips stay compact at 1440', async ({ page, request }) => {
	const long = `Write the whole annual report and ${'and keep going '.repeat(12)}`.slice(0, 200).trim();
	await seed(request, {
		aspects: [...ASPECTS],
		uniAspect: 1,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Operating Systems' }],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Read OS chapter 4', aspect: 1, inSprint: true, day: '2026-10-08', class: 0, type: 'LEC', checklist: ['A', 'B'] },
			{ title: long, aspect: 1, inSprint: true, day: '2026-10-09', status: 'doing' }
		]
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/sprint?view=week');

	const cards = page.getByRole('region', { name: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d/ }).getByRole('group', { name: /\S/ });
	await expect(cards).toHaveCount(2);
	// A chip is a touch target tall; its title takes at most three lines and keeps its full text as the accessible name.
	const lines = await cards.evaluateAll((els) =>
		els.map((el) => {
			const title = el.querySelector('button[title]') as HTMLElement;
			return title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight);
		})
	);
	for (const n of lines) expect(n).toBeLessThanOrEqual(3.05);
	await expect(page.getByRole('group', { name: long })).toHaveCount(1);
	// (the closed editor inside a chip still holds the class in its fields, so only what shows counts)
	await expect(cards.getByText('Operating Systems').filter({ visible: true })).toHaveCount(0);
});
