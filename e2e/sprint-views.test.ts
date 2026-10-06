import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock } from './helpers';

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

const row = (page: Page, title: string) => page.getByTestId('todo-row').filter({ hasText: title });

test('Scenario: Sprint screens prompt to review when pending', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: '2026-09-28' },
		todos: [{ title: 'Clean the fridge', inSprint: true }]
	});

	for (const view of ['aspect', 'board', 'week']) {
		await page.goto(`/sprint?view=${view}`);
		const prompt = page.getByTestId('sprint-prompt');
		await expect(prompt).toHaveAttribute('data-phase', 'review-required');
		await expect(prompt.getByRole('link')).toHaveAttribute('href', '/sprint/review');
		await expect(page.locator('a[href="/sprint/plan"]')).toHaveCount(0);
		await expect(page.getByRole('button', { name: /start/i })).toHaveCount(0);
		await expect(page.getByTestId('todo-row')).toHaveCount(0);
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
		const prompt = page.getByTestId('sprint-prompt');
		await expect(prompt).toHaveAttribute('data-phase', 'review-available');
		await expect(prompt.getByRole('link')).toHaveAttribute('href', '/sprint/review');
		await expect(row(page, 'Weekly reset')).toBeVisible();
	}

	await page.goto('/sprint');
	await page.getByRole('checkbox', { name: 'Done: Weekly reset' }).click();
	await expect(row(page, 'Weekly reset')).toHaveAttribute('data-status', 'done');
	await page.reload();
	await expect(row(page, 'Weekly reset')).toHaveAttribute('data-status', 'done');
});

test('Scenario: Sprint by aspect groups todos with status', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Morning run', aspect: 0, inSprint: true, status: 'done' },
			{ title: 'Book a physio appointment', aspect: 0, inSprint: true, status: 'doing' },
			{ title: 'Read chapter 4', aspect: 1, inSprint: true }
		]
	});
	await page.goto('/sprint');

	const health = page.getByTestId(`aspect-group-${aspects[0]}`);
	await expect(health.getByRole('heading', { name: 'Health' })).toBeVisible();
	await expect(health.getByRole('heading').locator('svg')).toBeVisible();
	await expect(health.getByTestId('todo-row')).toHaveCount(2);
	await expect(row(page, 'Morning run').getByLabel('Status')).toHaveValue('done');
	await expect(row(page, 'Book a physio appointment').getByLabel('Status')).toHaveValue('doing');

	const uni = page.getByTestId(`aspect-group-${aspects[1]}`);
	await expect(uni.getByRole('heading', { name: 'Uni' })).toBeVisible();
	await expect(uni.getByTestId('todo-row')).toHaveCount(1);
	await expect(row(page, 'Read chapter 4').getByLabel('Status')).toHaveValue('todo');
});

test('Scenario: Aspects without sprint todos are hidden', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [
			{ title: 'Morning run', aspect: 0, inSprint: true },
			{ title: 'Clean the fridge', aspect: 2 }
		]
	});
	await page.goto('/sprint?view=aspect');

	await expect(page.getByTestId(`aspect-group-${aspects[0]}`)).toBeVisible();
	await expect(page.getByTestId(`aspect-group-${aspects[1]}`)).toHaveCount(0);
	await expect(page.getByTestId(`aspect-group-${aspects[2]}`)).toHaveCount(0);
});

test('Scenario: Empty sprint points to the backlog', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge' }]
	});
	await page.goto('/sprint');

	const empty = page.getByTestId('empty-state');
	await expect(empty).toBeVisible();
	await empty.getByRole('link', { name: /backlog/i }).click();
	await expect(page).toHaveURL(/\/backlog$/);
});

test('Scenario: Todo created from a sprint view joins the active sprint', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK }
	});
	await page.goto('/sprint?view=aspect');

	await page.getByRole('button', { name: 'Add a todo' }).click();
	const form = page.getByRole('form', { name: 'New todo' });
	await form.getByLabel('Title').fill('Read chapter 4');
	await form.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await form.getByRole('button', { name: 'Add todo' }).click();

	const created = page.getByTestId(`aspect-group-${aspects[1]}`).getByTestId('todo-row');
	await expect(created).toContainText('Read chapter 4');
	await page.reload();
	await expect(created).toHaveAttribute('data-status', 'todo');
	await expect(created).toHaveAttribute('data-day', '');
	await page.goto('/backlog');
	await expect(page.getByTestId('empty-state')).toBeVisible();
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
		await expect(row(page, title)).toHaveAttribute('data-status', status);
		await expect(row(page, title).getByLabel('Status')).toHaveValue(status);
		if (view === 'board') await expect(page.getByTestId(`board-column-${status}`)).toContainText(title);
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
	await row(page, title).getByLabel('Status').selectOption('doing');
	await expect(row(page, title)).toHaveAttribute('data-status', 'doing');
	await expectStatusInEveryView(page, title, 'doing');

	await page.goto('/sprint?view=board');
	await row(page, title).getByLabel('Status').selectOption('done');
	await expect(page.getByTestId('board-column-done')).toContainText(title);
	await expectStatusInEveryView(page, title, 'done');

	await page.goto('/sprint?view=week');
	await row(page, title).getByLabel('Status').selectOption('todo');
	await expect(row(page, title)).toHaveAttribute('data-status', 'todo');
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
		await page.getByRole('checkbox', { name: `Done: ${title}` }).click();
		await expect(row(page, title)).toHaveAttribute('data-status', 'done');
		await page.reload();
		await expect(row(page, title)).toBeVisible();
		await expect(page.getByRole('checkbox', { name: `Done: ${title}` })).toHaveAttribute('aria-checked', 'true');
		await expect(row(page, title).getByRole('button', { name: title })).toHaveCSS(
			'text-decoration-line',
			'line-through'
		);
	}
});

test('Scenario: Move a todo between board columns by drag', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Draft the cover letter', aspect: 1, inSprint: true }]
	});
	await page.goto('/sprint?view=board');

	await row(page, 'Draft the cover letter').dragTo(page.getByTestId('board-column-doing'), { sourcePosition: { x: 8, y: 8 } });
	await expect(page.getByTestId('board-column-doing')).toContainText('Draft the cover letter');

	await page.reload();
	await expect(page.getByTestId('board-column-doing')).toContainText('Draft the cover letter');
	await expect(row(page, 'Draft the cover letter')).toHaveAttribute('data-status', 'doing');
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
	const cardIn = (scope: ReturnType<Page['getByTestId']>, title: string) =>
		scope.getByTestId('sprint-card').filter({ hasText: title });
	const menu = page.getByRole('menu');

	await page.goto('/sprint?view=week');
	await cardIn(day(page, '2026-10-06'), 'Clean the fridge').getByTestId('row-actions').click();
	await expect(menu.getByRole('menuitem')).toHaveText(['Move to backlog']);
	await page.keyboard.press('Escape');
	await cardIn(day(page, '2026-10-06'), 'Gym').getByTestId('row-actions').click();
	await expect(menu.getByRole('menuitem')).toHaveText(['Remove from sprint']);
	await page.keyboard.press('Escape');

	await page.goto('/sprint?view=board');
	const doing = page.getByTestId('board-column-doing');
	await cardIn(doing, 'Draft the cover letter').getByTestId('row-actions').click();
	await menu.getByRole('menuitem', { name: 'Move to backlog' }).click();
	const inRail = page.getByTestId('backlog-rail').getByTestId('todo-row').filter({ hasText: 'Draft the cover letter' });
	await expect(doing.getByTestId('todo-row')).toHaveCount(0);
	await expect(inRail).toBeVisible();

	await page.reload();
	await expect(inRail).toBeVisible();
	await expect(doing.getByTestId('todo-row')).toHaveCount(0);
});

const railRow = (page: Page, title: string) =>
	page.getByTestId('backlog-rail').getByTestId('todo-row').filter({ hasText: title });

// The view switch cross-fades; a drag that starts during the snapshot would hit the old page.
async function settled(page: Page) {
	await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
}

test('Scenario: Drop a rail todo on a board column sets its status', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Morning run', aspect: 0, inSprint: true }, { title: 'Book a physio appointment', aspect: 0 }]
	});
	await page.goto('/sprint?view=board');
	await settled(page);

	await railRow(page, 'Book a physio appointment').dragTo(page.getByTestId('board-column-doing'), {
		sourcePosition: { x: 8, y: 8 }
	});
	await expect(page.getByTestId('board-column-doing')).toContainText('Book a physio appointment');

	await page.reload();
	await expect(row(page, 'Book a physio appointment')).toHaveAttribute('data-status', 'doing');
	await expect(page.getByTestId('board-column-doing')).toContainText('Book a physio appointment');
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

	await railRow(page, 'Book a physio appointment').dragTo(page.getByTestId('board-column-done'), {
		sourcePosition: { x: 8, y: 8 }
	});
	await expect(page.getByTestId('board-column-done')).toContainText('Book a physio appointment');

	await page.reload();
	await expect(row(page, 'Book a physio appointment')).toHaveAttribute('data-status', 'done');
	await expect(page.getByRole('checkbox', { name: 'Done: Book a physio appointment' })).toHaveAttribute('aria-checked', 'true');
});

test('Scenario: Drop a rail todo on a day column sets its day', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Morning run', aspect: 0, inSprint: true }, { title: 'Book a physio appointment', aspect: 0 }]
	});
	await page.goto('/sprint?view=week');
	await settled(page);
	await page.getByTestId('rail-toggle').click();
	await expect(railRow(page, 'Book a physio appointment')).toBeVisible();

	await railRow(page, 'Book a physio appointment').dragTo(page.getByTestId('day-column-2026-10-08'), {
		sourcePosition: { x: 8, y: 8 }
	});
	await expect(page.getByTestId('day-column-2026-10-08')).toContainText('Book a physio appointment');

	await page.reload();
	await expect(row(page, 'Book a physio appointment')).toHaveAttribute('data-day', '2026-10-08');
	await expect(row(page, 'Book a physio appointment')).toHaveAttribute('data-status', 'todo');
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

	const todo = page.getByTestId('board-column-todo');
	const doing = page.getByTestId('board-column-doing');
	await row(page, 'Draft the cover letter').dragTo(doing, { sourcePosition: { x: 8, y: 8 } });
	await expect(doing).toContainText('Draft the cover letter');

	refuse();
	await expect(todo.getByTestId('todo-row').filter({ hasText: 'Draft the cover letter' })).toBeVisible();
	await expect(doing.getByTestId('todo-row')).toHaveCount(0);
	await page.reload();
	await expect(row(page, 'Draft the cover letter')).toHaveAttribute('data-status', 'todo');
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

	await expect(page.getByTestId('board-column-doing').getByTestId('column-placeholder')).toBeVisible();
	await expect(page.getByTestId('board-column-doing').getByTestId('todo-row')).toHaveCount(0);
	await expect(page.getByTestId('board-column-todo').getByTestId('column-placeholder')).toHaveCount(0);
});

test('Board cards show their aspect as a tag', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Read chapter 4', aspect: 1, inSprint: true }]
	});
	await page.goto('/sprint?view=board');

	const card = page.getByTestId('sprint-card').filter({ hasText: 'Read chapter 4' });
	await expect(card.getByTestId('aspect-tag')).toHaveText('Uni');
	await expect(card.getByTestId('aspect-tag').locator('svg')).toBeVisible();
});

const day = (page: Page, key: string) => page.getByTestId(`day-column-${key}`);

const box = async (locator: ReturnType<Page['getByTestId']>) => (await locator.boundingBox())!;
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

	const columns = await Promise.all(['todo', 'doing', 'done'].map((s) => box(page.getByTestId(`board-column-${s}`))));
	for (const c of columns) expect(Math.abs(c.width - columns[0].width)).toBeLessThanOrEqual(1);

	const views = await box(page.getByRole('navigation', { name: 'Sprint view' }));
	const rail = await box(page.getByTestId('context-rail'));
	const last = columns[2];
	expect(Math.abs(columns[0].x - views.x)).toBeLessThanOrEqual(1);
	// The content area ends one gutter (32 px) before the rail.
	expect(Math.abs(rail.x - 32 - (last.x + last.width))).toBeLessThanOrEqual(1);

	// Down to the bottom of the page content area: the viewport bottom less the page's bottom padding.
	// Summed over the ancestors, so whichever container pads the page at this width is the one measured.
	const padding = await page.getByTestId('board-column-todo').evaluate((el) => {
		let sum = 0;
		for (let a = el.parentElement; a; a = a.parentElement) sum += parseFloat(getComputedStyle(a).paddingBottom);
		return sum;
	});
	expect(padding).toBeGreaterThan(0);
	for (const c of columns) expect(Math.abs(c.y + c.height - (800 - padding))).toBeLessThanOrEqual(1);
});

test('Scenario: Week shows the whole week in one row at 1280', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }, { title: 'Book a physio appointment', aspect: 0 }]
	});
	await page.goto('/sprint?view=week');
	await settled(page);

	const rail = page.getByTestId('context-rail');
	const toggle = page.getByTestId('rail-toggle');
	await expect(rail).toBeHidden();
	await expect(toggle).toBeVisible();

	const days = await Promise.all(weekdays(page).map(box));
	for (const d of days) {
		expect(d.y).toBe(days[0].y);
		expect(d.width).toBeGreaterThanOrEqual(120);
	}
	for (let i = 1; i < days.length; i++) expect(days[i].x).toBeGreaterThan(days[i - 1].x);
	const week = day(page, '2026-10-05').locator('..');
	expect(await week.evaluate((el) => el.scrollWidth === el.clientWidth)).toBe(true);
	await expect(week.getByTestId('day-column-unscheduled')).toHaveCount(0);

	await toggle.click();
	await expect(rail).toBeVisible();
	await expect(page.getByTestId('day-column-unscheduled')).toHaveCount(1);
	const unscheduled = rail.getByTestId('day-column-unscheduled');
	await expect(unscheduled).toContainText('Clean the fridge');
	const backlog = rail.getByTestId('backlog-rail');
	await expect(backlog).toContainText('Book a physio appointment');
	expect((await box(unscheduled)).y).toBeLessThan((await box(backlog)).y);
});

// Docked, the rail is a sticky grid column; as an overlay it is a fixed panel behind a toggle.
async function expectDocked(page: Page, docked: boolean) {
	await settled(page);
	const rail = page.getByTestId('context-rail');
	if (docked) {
		await expect(rail).toBeVisible();
		await expect(rail).toHaveCSS('position', 'sticky');
		await expect(page.getByTestId('rail-toggle')).toBeHidden();
	} else {
		await expect(rail).toBeHidden();
		await expect(rail).toHaveCSS('position', 'fixed');
		await expect(page.getByTestId('rail-toggle')).toBeVisible();
	}
}

test('Scenario: Switching Week and Board swaps overlay and docked rail', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }, { title: 'Book a physio appointment', aspect: 0 }]
	});
	await page.goto('/sprint?view=board');
	const views = page.getByRole('navigation', { name: 'Sprint view' });
	await expectDocked(page, true);

	await views.getByRole('link', { name: 'Week' }).click();
	await expect(page).toHaveURL(/view=week$/);
	await expectDocked(page, false);

	await views.getByRole('link', { name: 'Board' }).click();
	await expect(page).toHaveURL(/view=board$/);
	await expectDocked(page, true);
});

test('Scenario: Open week overlay closes when leaving Week', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }, { title: 'Book a physio appointment', aspect: 0 }]
	});
	await page.goto('/sprint?view=week');
	await settled(page);
	const views = page.getByRole('navigation', { name: 'Sprint view' });
	const toggle = page.getByTestId('rail-toggle');
	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await expect(page.getByTestId('context-rail')).toBeVisible();

	await views.getByRole('link', { name: 'Board' }).click();
	await expect(page).toHaveURL(/view=board$/);
	await settled(page);
	await views.getByRole('link', { name: 'Week' }).click();
	await expect(page).toHaveURL(/view=week$/);
	await settled(page);

	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(page.getByTestId('context-rail')).toBeHidden();
});

test('Scenario: Busy day scrolls inside its column', async ({ page, request }) => {
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
	await expect(busy.getByTestId('todo-row')).toHaveCount(15);
	const scroll = await busy.evaluate((el) => {
		const before = el.scrollTop;
		el.scrollTop = 200;
		return { overflows: el.scrollHeight > el.clientHeight, moved: el.scrollTop > before };
	});
	expect(scroll).toEqual({ overflows: true, moved: true });
	expect((await box(busy)).y + (await box(busy)).height).toBeLessThanOrEqual(800);
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

	const days = await Promise.all(weekdays(page).map(box));
	expect(days[6].y).toBeGreaterThan(days[0].y);

	await expect(page.getByTestId('day-column-unscheduled')).toHaveCount(1);
	await expect(page.getByTestId('context-rail').getByTestId('day-column-unscheduled')).toHaveCount(0);
	await expect(page.getByTestId('day-column-unscheduled')).toBeVisible();
	await expect(page.getByTestId('day-column-unscheduled')).toContainText('Clean the fridge');
});

test('Scenario: Assign a todo to a day by drag', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }]
	});
	await page.goto('/sprint?view=week');
	await settled(page);
	await page.getByTestId('rail-toggle').click();
	await expect(day(page, 'unscheduled')).toContainText('Clean the fridge');

	await row(page, 'Clean the fridge').dragTo(day(page, '2026-10-06'));
	await expect(day(page, '2026-10-06')).toContainText('Clean the fridge');

	await page.reload();
	await expect(day(page, '2026-10-06')).toContainText('Clean the fridge');
	await expect(day(page, 'unscheduled').getByTestId('todo-row')).toHaveCount(0);
	await expect(row(page, 'Clean the fridge')).toHaveAttribute('data-day', '2026-10-06');
});

test('Scenario: Day picker offers only days of the active sprint', async ({ page, request, baseURL }) => {
	const { todos } = await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }]
	});
	await page.goto('/sprint?view=week');

	await expect(row(page, 'Clean the fridge').getByLabel('Day').locator('option')).toHaveText([
		'Unscheduled',
		'Mon 5',
		'Tue 6',
		'Wed 7',
		'Thu 8',
		'Fri 9',
		'Sat 10',
		'Sun 11'
	]);

	const refused = await request.post('/todos?/setDay', {
		form: { id: String(todos[0]), day: '2026-10-12' },
		headers: { origin: baseURL!, 'x-sveltekit-action': 'true' }
	});
	const body = await refused.json();
	expect(body.type).toBe('failure');
	expect(body.data).toContain('day-outside-sprint');
	await page.reload();
	await expect(row(page, 'Clean the fridge')).toHaveAttribute('data-day', '');
});

test('Scenario: Today is highlighted in the week view', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: WEEK } });
	await page.goto('/sprint?view=week');

	const badge = day(page, '2026-10-07').getByRole('heading').locator('[aria-current="date"]');
	await expect(badge).toHaveText('7');
	await expect(badge).toHaveCSS('background-color', 'rgb(31, 90, 68)');
	await expect(page.locator('[aria-current="date"]')).toHaveCount(1);
});

test('Scenario: Done todos stay on their day', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Morning run', aspect: 0, inSprint: true, day: '2026-10-05' }]
	});
	await page.goto('/sprint?view=week');

	await page.getByRole('checkbox', { name: 'Done: Morning run' }).click();
	await expect(row(page, 'Morning run')).toHaveAttribute('data-status', 'done');
	await page.reload();
	await expect(day(page, '2026-10-05').getByTestId('todo-row')).toHaveAttribute('data-status', 'done');
	await expect(day(page, '2026-10-05').getByRole('checkbox', { name: 'Done: Morning run' })).toHaveAttribute(
		'aria-checked',
		'true'
	);
});

test('Scenario: Todo created in a day column is assigned to that day', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: WEEK } });
	await page.goto('/sprint?view=week');

	await day(page, '2026-10-07').getByRole('button', { name: 'Add a todo' }).click();
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

	await expect(day(page, '2026-10-06').getByTestId('todo-row')).toContainText('Gym');
	await expect(day(page, '2026-10-06').getByTestId('todo-row')).toContainText('Recurring');
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
		await expect(page.getByTestId('sprint-card').first()).not.toHaveAttribute('draggable', 'true');

		await row(page, 'Clean the fridge').getByLabel('Status').selectOption('done');
		await expect(page.getByTestId('board-column-done')).toContainText('Clean the fridge');
		await expect(page.getByTestId('board-column-todo').getByTestId('todo-row')).toHaveCount(0);
	});

	test('Scenario: Assign a todo to a day with the day picker on touch', async ({ page, request }) => {
		await seed(request, {
			aspects: [...ASPECTS],
			sprint: { state: 'active', weekStart: WEEK },
			todos: [{ title: 'Clean the fridge', aspect: 2, inSprint: true }]
		});
		await page.goto('/sprint?view=week');
		await expect(row(page, 'Clean the fridge')).toBeHidden();

		await page.getByRole('button', { name: 'Unscheduled' }).click();
		await expect(page.getByTestId('sprint-card').first()).not.toHaveAttribute('draggable', 'true');
		await row(page, 'Clean the fridge').getByLabel('Day').selectOption({ label: 'Fri 9' });
		await expect(day(page, 'unscheduled').getByTestId('todo-row')).toHaveCount(0);

		await page.getByRole('button', { name: 'Fri 9' }).click();
		await expect(row(page, 'Clean the fridge')).toBeVisible();
		await expect(row(page, 'Clean the fridge')).toHaveAttribute('data-day', '2026-10-09');
	});

	test('Scenario: Phone shows one day at a time', async ({ page, request }) => {
		await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: WEEK } });
		await page.goto('/sprint?view=week');

		const columns = page.locator('[data-testid^="day-column-"]');
		await expect(columns.filter({ visible: true })).toHaveCount(1);
		await expect(day(page, '2026-10-07')).toBeVisible();

		const days = page.getByRole('navigation', { name: 'Days' });
		await expect(days.getByRole('button')).toHaveCount(8);
		for (const name of ['Mon 5', 'Tue 6', 'Wed 7', 'Thu 8', 'Fri 9', 'Sat 10', 'Sun 11', 'Unscheduled']) {
			await expect(days.getByRole('button', { name, exact: true })).toBeVisible();
		}
		await expect(days.getByRole('button', { name: 'Wed 7' })).toHaveAttribute('aria-pressed', 'true');

		await days.getByRole('button', { name: 'Fri 9' }).click();
		await expect(day(page, '2026-10-09')).toBeVisible();
		await expect(columns.filter({ visible: true })).toHaveCount(1);

		await days.getByRole('button', { name: 'Unscheduled' }).click();
		await expect(day(page, 'unscheduled')).toBeVisible();
		await expect(columns.filter({ visible: true })).toHaveCount(1);
	});
});
