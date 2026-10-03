import { expect, test, type Page } from '@playwright/test';
import { reset, seed, setClock, type SeedInput } from './helpers';

// Wednesday 7 October 2026 in Berlin; the active sprint runs Monday 5 to Sunday 11 October.
const NOW = '2026-10-07T10:00:00Z';
const SUNDAY = '2026-10-11T10:00:00Z';
const WEEK = '2026-10-05';

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const ASPECTS: SeedInput['aspects'] = [
	{ name: 'Health', color: 'sage', icon: 'heart' },
	{ name: 'Uni', color: 'lavender', icon: 'cap' }
];

const rail = (page: Page) => page.getByTestId('backlog-rail');
const sprintList = (page: Page) => page.getByTestId('sprint-list');
const row = (scope: ReturnType<Page['getByTestId']>, title: string) =>
	scope.getByTestId('todo-row').filter({ hasText: title });

const iconColor = (scope: ReturnType<Page['getByTestId']>) =>
	scope.locator('svg').nth(1).evaluate((svg) => getComputedStyle(svg).color);

async function seedRunning(request: Parameters<typeof seed>[0], todos: SeedInput['todos']) {
	return seed(request, { aspects: ASPECTS, sprint: { state: 'active', weekStart: WEEK }, todos });
}

test('Scenario: Sprint tab shows the backlog rail grouped by aspect', async ({ page, request }) => {
	const { aspects } = await seedRunning(request, [
		{ title: 'Morning run', inSprint: true },
		{ title: 'Read chapter 4', aspect: 1, inSprint: true },
		{ title: 'Book a physio appointment' },
		{ title: 'Stretch for ten minutes' },
		{ title: 'Email the tutor', aspect: 1 }
	]);
	await page.goto('/sprint');

	await expect(rail(page)).toBeVisible();
	const groups = rail(page).locator('[data-testid^="rail-group-"]');
	await expect(groups).toHaveCount(2);
	await expect(groups.nth(0)).toHaveAttribute('data-testid', `rail-group-${aspects[0]}`);
	await expect(groups.nth(1)).toHaveAttribute('data-testid', `rail-group-${aspects[1]}`);

	const health = page.getByTestId(`rail-group-${aspects[0]}`);
	await expect(health.getByTestId('todo-row')).toHaveText([/Book a physio appointment/, /Stretch for ten minutes/]);
	await expect(page.getByTestId(`rail-group-${aspects[1]}`).getByTestId('todo-row')).toHaveText([/Email the tutor/]);

	const sprintGroups = sprintList(page).locator('[data-testid^="aspect-group-"]');
	await expect(sprintGroups).toHaveCount(2);
	for (const [i, id] of aspects.entries()) {
		await expect(sprintGroups.nth(i)).toHaveAttribute('data-testid', `aspect-group-${id}`);
		const sprintColor = await page.getByTestId(`aspect-group-${id}`).locator('h2 svg').first()
			.evaluate((svg) => getComputedStyle(svg).color);
		expect(await iconColor(page.getByTestId(`rail-group-${id}`))).toBe(sprintColor);
	}
});

test('Scenario: Rail is shown on the sprint\'s Sunday', async ({ page, request }) => {
	await seedRunning(request, [
		{ title: 'Weekly reset', inSprint: true, day: '2026-10-11' },
		{ title: 'Book a physio appointment' }
	]);
	await setClock(request, SUNDAY);
	await page.goto('/sprint');

	const prompt = page.getByTestId('sprint-prompt');
	await expect(prompt).toHaveAttribute('data-phase', 'review-available');
	const promptBox = (await prompt.boundingBox())!;
	const listBox = (await sprintList(page).boundingBox())!;
	expect(promptBox.y + promptBox.height).toBeLessThanOrEqual(listBox.y);
	await expect(row(rail(page), 'Book a physio appointment')).toBeVisible();
});

test('Scenario: No rail without a running sprint', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, todos: [{ title: 'Book a physio appointment' }] });
	await page.goto('/sprint');
	await expect(page.getByTestId('sprint-prompt')).toHaveAttribute('data-phase', 'none');
	await expect(page.getByTestId('sprint-prompt').getByRole('link')).toHaveAttribute('href', '/sprint/plan');
	await expect(rail(page)).toHaveCount(0);
	await expect(page.getByTestId('context-rail')).toHaveCount(0);

	await reset(request);
	await seed(request, {
		aspects: ASPECTS,
		sprint: { state: 'planning' },
		todos: [{ title: 'Book a physio appointment' }]
	});
	await page.goto('/sprint');
	await expect(page.getByTestId('sprint-prompt')).toHaveAttribute('data-phase', 'planning');
	await expect(rail(page)).toHaveCount(0);
	await expect(page.getByTestId('context-rail')).toHaveCount(0);
});

test('Scenario: No rail while the review is required', async ({ page, request }) => {
	await seed(request, {
		aspects: ASPECTS,
		sprint: { state: 'active', weekStart: '2026-09-28' },
		todos: [{ title: 'Clean the fridge', inSprint: true }, { title: 'Book a physio appointment' }]
	});
	await page.goto('/sprint');
	await expect(page.getByTestId('sprint-prompt')).toHaveAttribute('data-phase', 'review-required');
	await expect(rail(page)).toHaveCount(0);
	await expect(page.getByTestId('context-rail')).toHaveCount(0);
	await expect(page.getByTestId('todo-row')).toHaveCount(0);
});

test('Scenario: Sprint at 1280 shows a context rail', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');

	const context = page.getByTestId('context-rail');
	await expect(context).toBeVisible();
	const box = (await context.boundingBox())!;
	const width = await page.evaluate(() => document.documentElement.clientWidth);
	expect(Math.abs(box.x + box.width - width)).toBeLessThanOrEqual(1);
	const [background, sunk] = await context.evaluate((el) => {
		const probe = document.createElement('div');
		probe.style.background = 'var(--paper-sunk)';
		document.body.append(probe);
		const value = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return [getComputedStyle(el).backgroundColor, value];
	});
	expect(background).toBe(sunk);

	const sidebarRight = await page.evaluate(
		() => document.querySelector('main')!.previousElementSibling!.getBoundingClientRect().right
	);
	const list = (await sprintList(page).boundingBox())!;
	expect(list.width).toBeLessThanOrEqual(720);
	expect(list.x - sidebarRight).toBeLessThanOrEqual(64);
	expect(list.x + list.width).toBeLessThanOrEqual(box.x);
});

test('Scenario: Rail becomes an overlay toggle between 1024 and 1279', async ({ page, request }) => {
	await page.setViewportSize({ width: 1100, height: 800 });
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');

	const context = page.getByTestId('context-rail');
	const toggle = page.getByTestId('rail-toggle');
	await expect(context).toBeHidden();
	await expect(toggle).toBeVisible();

	await toggle.click();
	await expect(context).toBeVisible();
	await expect(row(rail(page), 'Book a physio appointment')).toBeVisible();
	await expect(context).toHaveCSS('transform', 'none');
	expect(await page.evaluate(() => document.querySelector('dialog[open]'))).toBeNull();
	// Content stays usable while the overlay is open: no scrim covers it.
	await expect(row(sprintList(page), 'Morning run')).toBeVisible();
	const hit = await page.evaluate(() => {
		const el = document.querySelector('[data-testid="sprint-list"]')!;
		const r = el.getBoundingClientRect();
		return el.contains(document.elementFromPoint(r.left + 10, r.top + 10));
	});
	expect(hit).toBe(true);

	await toggle.click();
	await expect(context).toBeHidden();
});

test('Scenario: Rail title filter narrows the list', async ({ page, request }) => {
	await seedRunning(request, [
		{ title: 'Morning run', inSprint: true },
		{ title: 'Book a physio appointment' },
		{ title: 'Stretch for ten minutes' },
		{ title: 'Email the tutor', aspect: 1 }
	]);
	await page.goto('/sprint');

	const filter = page.getByTestId('rail-filter');
	await filter.fill('PHYSIO');
	await expect(rail(page).getByTestId('todo-row')).toHaveText([/Book a physio appointment/]);

	await filter.fill('');
	await expect(rail(page).getByTestId('todo-row')).toHaveCount(3);
});

test('Scenario: Rail filter without a match', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');

	await page.getByTestId('rail-filter').fill('dentist');
	await expect(rail(page).getByTestId('todo-row')).toHaveCount(0);
	await expect(rail(page)).toContainText('No backlog todo matches');
});

test('Scenario: Empty backlog shows the rail\'s empty state', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }]);
	await page.goto('/sprint');

	await expect(rail(page)).toContainText('The backlog is empty.');
	await expect(rail(page).getByRole('link')).toHaveAttribute('href', '/backlog');
	await expect(page.getByTestId('rail-filter')).toHaveCount(0);
});

test('Scenario: Collapsed rail groups are remembered', async ({ page, request }) => {
	const { aspects } = await seedRunning(request, [
		{ title: 'Book a physio appointment' },
		{ title: 'Email the tutor', aspect: 1 }
	]);
	await page.goto('/sprint');

	const health = page.getByTestId(`rail-group-${aspects[0]}`);
	const uni = page.getByTestId(`rail-group-${aspects[1]}`);
	await health.getByRole('button', { name: 'Health' }).click();
	await expect(health).toHaveAttribute('data-collapsed', 'true');
	await expect(health.getByTestId('todo-row')).toHaveCount(0);

	await page.reload();
	await expect(health).toHaveAttribute('data-collapsed', 'true');
	await expect(health.getByTestId('todo-row')).toHaveCount(0);
	await expect(uni).toHaveAttribute('data-collapsed', 'false');
	await expect(row(uni, 'Email the tutor')).toBeVisible();
});

test('Scenario: Add to sprint from the rail', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');
	await page.evaluate(() => ((window as unknown as { __stay: boolean }).__stay = true));

	await page.getByRole('button', { name: 'Add to sprint: Book a physio appointment' }).click();
	await expect(row(rail(page), 'Book a physio appointment')).toHaveCount(0);
	const added = row(sprintList(page), 'Book a physio appointment');
	await expect(added).toHaveAttribute('data-status', 'todo');
	await expect(added).toHaveAttribute('data-day', '');
	await expect(page).toHaveURL(/\/sprint$/);
	expect(await page.evaluate(() => (window as unknown as { __stay?: boolean }).__stay)).toBe(true);

	await page.reload();
	await expect(row(sprintList(page), 'Book a physio appointment')).toHaveAttribute('data-status', 'todo');
	await expect(row(rail(page), 'Book a physio appointment')).toHaveCount(0);
});

test('Scenario: Drag a rail todo onto the sprint list', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');

	await row(rail(page), 'Book a physio appointment').dragTo(sprintList(page));
	await expect(row(sprintList(page), 'Book a physio appointment')).toBeVisible();

	await page.reload();
	await expect(row(sprintList(page), 'Book a physio appointment')).toHaveAttribute('data-status', 'todo');
	await expect(row(rail(page), 'Book a physio appointment')).toHaveCount(0);
});

test('Scenario: Todo already moved elsewhere is refused quietly', async ({ page, context, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');

	const other = await context.newPage();
	await other.goto('/sprint');
	await other.getByRole('button', { name: 'Add to sprint: Book a physio appointment' }).click();
	await expect(row(sprintList(other), 'Book a physio appointment')).toBeVisible();
	await other.close();

	await page.getByRole('button', { name: 'Add to sprint: Book a physio appointment' }).click();
	await expect(row(sprintList(page), 'Book a physio appointment')).toHaveCount(1);
	await expect(row(rail(page), 'Book a physio appointment')).toHaveCount(0);
	await expect(page.getByRole('alert')).toHaveCount(0);
});

test('Scenario: Drag a sprint todo onto the rail', async ({ page, request }) => {
	await seedRunning(request, [
		{ title: 'Morning run', inSprint: true },
		{ title: 'Book a physio appointment', inSprint: true, status: 'doing', day: '2026-10-08' }
	]);
	await page.goto('/sprint');

	await row(sprintList(page), 'Book a physio appointment').dragTo(rail(page), { sourcePosition: { x: 8, y: 8 } });
	await expect(row(rail(page), 'Book a physio appointment')).toBeVisible();

	await page.reload();
	await expect(row(rail(page), 'Book a physio appointment')).toBeVisible();
	await expect(row(sprintList(page), 'Book a physio appointment')).toHaveCount(0);
	await expect(row(sprintList(page), 'Morning run')).toBeVisible();
});

test('Scenario: Group header shows done of total', async ({ page, request }) => {
	const { aspects } = await seedRunning(request, [
		{ title: 'Morning run', inSprint: true, status: 'done' },
		{ title: 'Stretch for ten minutes', inSprint: true },
		{ title: 'Book a physio appointment', inSprint: true, status: 'doing' }
	]);
	await page.goto('/sprint');

	const header = page.getByTestId(`aspect-group-${aspects[0]}`).locator('h2');
	const progress = header.getByTestId('progress');
	await expect(progress).toHaveText('1 / 3');
	const bar = await progress.evaluate((el) => {
		const [track, fill] = [el.lastElementChild!, el.lastElementChild!.firstElementChild!];
		return {
			ratio: fill.getBoundingClientRect().width / track.getBoundingClientRect().width,
			color: getComputedStyle(fill).backgroundColor
		};
	});
	expect(bar.ratio).toBeCloseTo(1 / 3, 1);
	expect(bar.color).toBe(await header.locator('svg').first().evaluate((svg) => getComputedStyle(svg).color));
});

test('Scenario: Rail header shows backlog count and progress', async ({ page, request }) => {
	const { aspects } = await seedRunning(request, [
		{ title: 'Morning run', inSprint: true, status: 'done' },
		{ title: 'Stretch for ten minutes', inSprint: true },
		{ title: 'Book a physio appointment' },
		{ title: 'Buy running shoes' }
	]);
	await page.goto('/sprint');

	const header = page.getByTestId(`rail-group-${aspects[0]}`).locator('h3');
	await expect(header.getByTestId('rail-count')).toHaveText('2');
	await expect(header.getByTestId('progress')).toHaveText('1 / 2');
});

test('Scenario: Aspect without sprint todos shows only in the rail', async ({ page, request }) => {
	const { aspects } = await seedRunning(request, [
		{ title: 'Morning run', inSprint: true },
		{ title: 'Email the tutor', aspect: 1 }
	]);
	await page.goto('/sprint');

	await expect(page.getByTestId(`aspect-group-${aspects[1]}`)).toHaveCount(0);
	const uni = page.getByTestId(`rail-group-${aspects[1]}`);
	await expect(uni).toBeVisible();
	await expect(uni.getByTestId('rail-count')).toHaveText('1');
	await expect(uni.getByTestId('progress')).toHaveCount(0);
});

test('Scenario: Aspect without backlog todos is omitted from the rail', async ({ page, request }) => {
	const { aspects } = await seedRunning(request, [
		{ title: 'Morning run', inSprint: true },
		{ title: 'Email the tutor', aspect: 1 }
	]);
	await page.goto('/sprint');

	await expect(page.getByTestId(`aspect-group-${aspects[0]}`)).toBeVisible();
	await expect(page.getByTestId(`rail-group-${aspects[0]}`)).toHaveCount(0);
});

test('Scenario: Phone Sprint tab shows Manage instead of a rail', async ({ page, request }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');

	await expect(page.getByTestId('manage-button')).toBeVisible();
	await expect(page.getByTestId('manage-button')).toHaveText('Manage');
	await expect(page.getByTestId('context-rail')).toBeHidden();
	await expect(page.getByTestId('rail-toggle')).toBeHidden();
	await expect(row(page.getByTestId('backlog-rail'), 'Book a physio appointment')).toBeHidden();
});

test('Manage is not offered beside a docked rail', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');
	await expect(page.getByTestId('context-rail')).toBeVisible();
	await expect(page.getByTestId('manage-button')).toBeHidden();
});

test.describe('touch phone', () => {
	test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

	test('Scenario: Manage sheet adds a todo to the sprint', async ({ page, request }) => {
		const { aspects } = await seedRunning(request, [
			{ title: 'Morning run', inSprint: true },
			{ title: 'Book a physio appointment' },
			{ title: 'Email the tutor', aspect: 1 }
		]);
		await page.goto('/sprint');

		await page.getByTestId('manage-button').tap();
		const sheet = page.getByTestId('manage-sheet');
		await expect(sheet).toBeVisible();
		await expect(sheet.getByTestId(`rail-group-${aspects[0]}`).getByTestId('todo-row')).toHaveText([
			/Book a physio appointment/
		]);
		await expect(sheet.getByTestId(`rail-group-${aspects[1]}`).getByTestId('todo-row')).toHaveText([/Email the tutor/]);

		await sheet.getByRole('button', { name: 'Add to sprint: Book a physio appointment' }).tap();
		await expect(row(sheet, 'Book a physio appointment')).toHaveCount(0);
		await expect(row(sheet, 'Email the tutor')).toBeVisible();
		await page.getByRole('button', { name: 'Close' }).tap();
		await expect(row(sprintList(page), 'Book a physio appointment')).toHaveAttribute('data-status', 'todo');

		await page.reload();
		await expect(row(sprintList(page), 'Book a physio appointment')).toBeVisible();
	});

	test('Scenario: Touch offers no drag in the rail', async ({ page, request }) => {
		await seedRunning(request, [
			{ title: 'Morning run', inSprint: true },
			{ title: 'Book a physio appointment' },
			{ title: 'Email the tutor', aspect: 1 }
		]);
		await page.goto('/sprint');
		await page.getByTestId('manage-button').tap();

		const items = page.getByTestId('manage-sheet').locator('.item');
		await expect(items).toHaveCount(2);
		for (const item of await items.all()) {
			await expect(item).not.toHaveAttribute('draggable', 'true');
			await expect(item.getByRole('button', { name: /^Add to sprint: / })).toBeVisible();
		}
		await expect(sprintList(page).locator('[draggable="true"]')).toHaveCount(0);
	});
});

// Records when animations run, from a rAF loop, relative to the last pointerdown.
async function watchAnimations(page: Page) {
	await page.waitForFunction(() => document.getAnimations().length === 0);
	await page.evaluate(() => {
		const w = window as unknown as { __motion: { press: number; first: number | null; max: number } };
		w.__motion = { press: 0, first: null, max: 0 };
		document.addEventListener('pointerdown', () => ((w.__motion.press = performance.now()), (w.__motion.first = null)), true);
		const tick = () => {
			const running = document.getAnimations().length;
			w.__motion.max = Math.max(w.__motion.max, running);
			if (running > 0 && w.__motion.first === null) w.__motion.first = performance.now() - w.__motion.press;
			requestAnimationFrame(tick);
		};
		tick();
	});
}

const motion = (page: Page) =>
	page.evaluate(() => (window as unknown as { __motion: { first: number | null; max: number } }).__motion);

test('Scenario: Moving a todo from the rail starts a move animation', async ({ page, request }) => {
	const { aspects } = await seedRunning(request, [
		{ title: 'Morning run', inSprint: true },
		{ title: 'Book a physio appointment' },
		{ title: 'Stretch for ten minutes' }
	]);
	await page.goto('/sprint');
	const count = page.getByTestId(`rail-group-${aspects[0]}`).getByTestId('rail-count');
	await expect(count).toHaveText('2');
	await watchAnimations(page);

	await page.getByRole('button', { name: 'Add to sprint: Book a physio appointment' }).click();
	await page.waitForTimeout(400);
	const { first } = await motion(page);
	expect(first).not.toBeNull();
	expect(first!).toBeLessThanOrEqual(100);
	await expect(row(sprintList(page), 'Book a physio appointment')).toBeVisible({ timeout: 1 });
	await expect(count).toHaveText('1', { timeout: 1 });
});

test('Scenario: Reduced motion moves instantly', async ({ page, request }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await seedRunning(request, [
		{ title: 'Morning run', inSprint: true },
		{ title: 'Book a physio appointment' },
		{ title: 'Stretch for ten minutes' }
	]);
	await page.goto('/sprint');
	await watchAnimations(page);

	await page.getByRole('button', { name: 'Add to sprint: Book a physio appointment' }).click();
	await expect(row(sprintList(page), 'Book a physio appointment')).toBeVisible();
	await expect(row(rail(page), 'Book a physio appointment')).toHaveCount(0);

	await page.getByRole('navigation', { name: 'Sprint view' }).getByRole('link', { name: 'Board' }).click();
	await expect(page).toHaveURL(/view=board$/);
	const doing = page.getByTestId('board-column-doing');
	await page.getByTestId('board-column-todo').getByTestId('todo-row').filter({ hasText: 'Morning run' })
		.dragTo(doing, { sourcePosition: { x: 8, y: 8 } });
	await expect(row(doing, 'Morning run')).toBeVisible();
	await expect(row(page.getByTestId('board-column-todo'), 'Book a physio appointment')).toBeVisible();

	await page.waitForTimeout(300);
	expect((await motion(page)).max).toBe(0);
	await page.reload();
	await expect(row(page.getByTestId('board-column-doing'), 'Morning run')).toHaveAttribute('data-status', 'doing');
});
