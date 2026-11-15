import type { Locator, Page } from '@playwright/test';
import { aspectGroup, expect, test, reset, seed, setClock, todoRow, todoRows, type SeedInput } from './helpers';
import {
	backlogRail as rail,
	boardColumn,
	contextRail,
	railGroup,
	railToggle,
	sprintList,
	sprintPrompt
} from './sprint-locators';

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

const row = todoRow;

const iconColor = (scope: Locator) => scope.getByRole('heading').locator('svg').nth(1).evaluate((svg) => getComputedStyle(svg).color);

async function seedRunning(request: Parameters<typeof seed>[0], todos: SeedInput['todos']) {
	return seed(request, { aspects: ASPECTS, sprint: { state: 'active', weekStart: WEEK }, todos });
}

test('Scenario: Sprint tab shows the backlog rail grouped by aspect', async ({ page, request }) => {
	await seedRunning(request, [
		{ title: 'Morning run', inSprint: true },
		{ title: 'Read chapter 4', aspect: 1, inSprint: true },
		{ title: 'Book a physio appointment' },
		{ title: 'Stretch for ten minutes' },
		{ title: 'Email the tutor', aspect: 1 }
	]);
	await page.goto('/sprint');

	await expect(rail(page)).toBeVisible();
	const groups = rail(page).getByRole('region');
	await expect(groups).toHaveCount(2);
	await expect(groups.nth(0)).toHaveAccessibleName('In backlog: Health');
	await expect(groups.nth(1)).toHaveAccessibleName('In backlog: Uni');

	const health = railGroup(page, 'Health');
	await expect(todoRows(health)).toHaveText([/Book a physio appointment/, /Stretch for ten minutes/]);
	await expect(todoRows(railGroup(page, 'Uni'))).toHaveText([/Email the tutor/]);

	const sprintGroups = sprintList(page).getByRole('region');
	await expect(sprintGroups).toHaveCount(2);
	for (const [i, { name }] of ASPECTS!.entries()) {
		await expect(sprintGroups.nth(i)).toHaveAccessibleName(new RegExp(`^${name}\\b`));
		const sprintColor = await aspectGroup(sprintList(page), name).getByRole('heading').locator('svg').first()
			.evaluate((svg) => getComputedStyle(svg).color);
		expect(await iconColor(railGroup(page, name))).toBe(sprintColor);
	}
});

test('Scenario: Rail is shown on the sprint\'s Sunday', async ({ page, request }) => {
	await seedRunning(request, [
		{ title: 'Weekly reset', inSprint: true, day: '2026-10-11' },
		{ title: 'Book a physio appointment' }
	]);
	await setClock(request, SUNDAY);
	await page.goto('/sprint');

	const prompt = sprintPrompt(page);
	await expect(prompt.getByRole('link', { name: 'Review it', exact: true })).toBeVisible();
	const promptBox = (await prompt.boundingBox())!;
	const listBox = (await sprintList(page).boundingBox())!;
	expect(promptBox.y + promptBox.height).toBeLessThanOrEqual(listBox.y);
	await expect(row(rail(page), 'Book a physio appointment')).toBeVisible();
});

test('Scenario: No rail without a running sprint', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, todos: [{ title: 'Book a physio appointment' }] });
	await page.goto('/sprint');
	const plan = sprintPrompt(page).getByRole('link', { name: 'Plan your week', exact: true });
	await expect(plan).toBeVisible();
	await expect(plan).toHaveAttribute('href', '/sprint/plan');
	await expect(rail(page)).toHaveCount(0);
	await expect(contextRail(page)).toHaveCount(0);

	await reset(request);
	await seed(request, {
		aspects: ASPECTS,
		sprint: { state: 'planning' },
		todos: [{ title: 'Book a physio appointment' }]
	});
	await page.goto('/sprint');
	await expect(sprintPrompt(page).getByRole('link', { name: 'Continue planning', exact: true })).toBeVisible();
	await expect(rail(page)).toHaveCount(0);
	await expect(contextRail(page)).toHaveCount(0);
});

test('Scenario: No rail while the review is required', async ({ page, request }) => {
	await seed(request, {
		aspects: ASPECTS,
		sprint: { state: 'active', weekStart: '2026-09-28' },
		todos: [{ title: 'Clean the fridge', inSprint: true }, { title: 'Book a physio appointment' }]
	});
	await page.goto('/sprint');
	await expect(sprintPrompt(page).getByRole('link', { name: 'Review the sprint', exact: true })).toBeVisible();
	await expect(rail(page)).toHaveCount(0);
	await expect(contextRail(page)).toHaveCount(0);
	await expect(todoRows(page)).toHaveCount(0);
});

test('Scenario: Sprint at 1280 shows a context rail', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	const context = contextRail(page);
	const sidebarRight = () =>
		page.evaluate(() => document.querySelector('main')!.previousElementSibling!.getBoundingClientRect().right);

	async function expectDockedRail() {
		await expect(context).toBeVisible();
		await expect(railToggle(page)).toBeHidden();
		const box = (await context.boundingBox())!;
		const width = await page.evaluate(() => document.documentElement.clientWidth);
		expect(Math.abs(box.x + box.width - width)).toBeLessThanOrEqual(1);
		const [background, surface, edge] = await context.evaluate((el) => {
			const probe = document.createElement('div');
			probe.style.background = 'var(--surface)';
			document.body.append(probe);
			const value = getComputedStyle(probe).backgroundColor;
			probe.remove();
			return [getComputedStyle(el).backgroundColor, value, getComputedStyle(el).borderLeftWidth];
		});
		expect(background).toBe(surface);
		expect(edge).toBe('1px');
		return box;
	}

	// At 1280 the track between sidebar and rail is narrower than the list cap, so only 1600 can tell a
	// centred, capped column from a filled one.
	for (const width of [1280, 1600]) {
		await page.setViewportSize({ width, height: 800 });
		await page.goto('/sprint?view=aspect');
		const box = await expectDockedRail();
		const list = (await sprintList(page).boundingBox())!;
		expect(list.width).toBeLessThanOrEqual(720);
		const free = ((await sidebarRight()) + box.x) / 2;
		expect(Math.abs(list.x + list.width / 2 - free), `list off-centre at ${width}`).toBeLessThanOrEqual(2);
		expect(list.x + list.width).toBeLessThanOrEqual(box.x);

		await page.goto('/sprint?view=board');
		await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
		const boardRail = await expectDockedRail();
		const todo = (await boardColumn(page, 'todo').boundingBox())!;
		const done = (await boardColumn(page, 'done').boundingBox())!;
		expect(todo.x - (await sidebarRight()), `board starts late at ${width}`).toBeLessThanOrEqual(64);
		expect(done.x + done.width).toBeLessThanOrEqual(boardRail.x);
		expect(boardRail.x - (done.x + done.width), `board stops short of the rail at ${width}`).toBeLessThanOrEqual(64);
	}
});

test('Scenario: Rail becomes an overlay toggle below 1280', async ({ page, request }) => {
	await page.setViewportSize({ width: 1100, height: 800 });
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');

	const context = contextRail(page);
	const toggle = railToggle(page);
	await expect(context).toBeHidden();
	await expect(toggle).toBeVisible();

	await toggle.click();
	await expect(context).toBeVisible();
	await expect(row(rail(page), 'Book a physio appointment')).toBeVisible();
	await expect(context).toHaveCSS('transform', 'none');
	expect(await page.evaluate(() => document.querySelector('dialog[open]'))).toBeNull();
	// Content stays usable while the overlay is open: no scrim covers it.
	await expect(row(sprintList(page), 'Morning run')).toBeVisible();
	const hit = await sprintList(page).evaluate((el) => {
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

	const filter = page.getByRole('searchbox', { name: 'Filter backlog' });
	await filter.fill('PHYSIO');
	await expect(todoRows(rail(page))).toHaveText([/Book a physio appointment/]);

	await filter.fill('');
	await expect(todoRows(rail(page))).toHaveCount(3);
});

test('Scenario: Rail filter without a match', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');

	await page.getByRole('searchbox', { name: 'Filter backlog' }).fill('dentist');
	await expect(todoRows(rail(page))).toHaveCount(0);
	await expect(rail(page)).toContainText('No backlog todo matches');
});

test('Scenario: Empty backlog shows the rail\'s empty state', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }]);
	await page.goto('/sprint');

	await expect(rail(page)).toContainText('The backlog is empty.');
	await expect(rail(page).getByRole('link')).toHaveAttribute('href', '/backlog');
	await expect(page.getByRole('searchbox', { name: 'Filter backlog' })).toHaveCount(0);
});

test('Scenario: Collapsed rail groups are remembered', async ({ page, request }) => {
	await seedRunning(request, [
		{ title: 'Book a physio appointment' },
		{ title: 'Email the tutor', aspect: 1 }
	]);
	await page.goto('/sprint');

	const health = railGroup(page, 'Health');
	const uni = railGroup(page, 'Uni');
	await health.getByRole('button', { name: 'Health' }).click();
	await expect(health.getByRole('button', { name: 'Health' })).toHaveAttribute('aria-expanded', 'false');
	await expect(todoRows(health)).toHaveCount(0);

	await page.reload();
	await expect(health.getByRole('button', { name: 'Health' })).toHaveAttribute('aria-expanded', 'false');
	await expect(todoRows(health)).toHaveCount(0);
	await expect(uni.getByRole('button', { name: 'Uni' })).toHaveAttribute('aria-expanded', 'true');
	await expect(row(uni, 'Email the tutor')).toBeVisible();
});

test('Scenario: Add to sprint from the rail', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');
	await page.evaluate(() => ((window as unknown as { __stay: boolean }).__stay = true));

	await page.getByRole('button', { name: 'Add to sprint: Book a physio appointment' }).click();
	await expect(row(rail(page), 'Book a physio appointment')).toHaveCount(0);
	const added = row(sprintList(page), 'Book a physio appointment');
	await expect(added.getByLabel('Status')).toHaveValue('todo');
	await expect(added).toHaveAttribute('data-day', '');
	await expect(page).toHaveURL(/\/sprint$/);
	expect(await page.evaluate(() => (window as unknown as { __stay?: boolean }).__stay)).toBe(true);

	await page.reload();
	await expect(row(sprintList(page), 'Book a physio appointment').getByLabel('Status')).toHaveValue('todo');
	await expect(row(rail(page), 'Book a physio appointment')).toHaveCount(0);
});

test('Scenario: Drag a rail todo onto the sprint list', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');

	await row(rail(page), 'Book a physio appointment').dragTo(sprintList(page));
	await expect(row(sprintList(page), 'Book a physio appointment')).toBeVisible();

	await page.reload();
	await expect(row(sprintList(page), 'Book a physio appointment').getByLabel('Status')).toHaveValue('todo');
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
	await seedRunning(request, [
		{ title: 'Morning run', inSprint: true, status: 'done' },
		{ title: 'Stretch for ten minutes', inSprint: true },
		{ title: 'Book a physio appointment', inSprint: true, status: 'doing' }
	]);
	await page.goto('/sprint');

	const header = aspectGroup(sprintList(page), 'Health').getByRole('heading');
	const progress = header.getByText('1 / 3', { exact: true });
	await expect(progress).toBeVisible();
	const bar = await progress.evaluate((count) => {
		const [track, fill] = [count.nextElementSibling!, count.nextElementSibling!.firstElementChild!];
		return {
			ratio: fill.getBoundingClientRect().width / track.getBoundingClientRect().width,
			color: getComputedStyle(fill).backgroundColor
		};
	});
	expect(bar.ratio).toBeCloseTo(1 / 3, 1);
	expect(bar.color).toBe(await header.locator('svg').first().evaluate((svg) => getComputedStyle(svg).color));
});

test('Scenario: Rail header shows backlog count and progress', async ({ page, request }) => {
	await seedRunning(request, [
		{ title: 'Morning run', inSprint: true, status: 'done' },
		{ title: 'Stretch for ten minutes', inSprint: true },
		{ title: 'Book a physio appointment' },
		{ title: 'Buy running shoes' }
	]);
	await page.goto('/sprint');

	const header = railGroup(page, 'Health').getByRole('heading');
	await expect(header.getByLabel('2 in backlog')).toHaveText('2');
	await expect(header.getByText('1 / 2', { exact: true })).toBeVisible();
});

test('Scenario: Aspect without sprint todos shows only in the rail', async ({ page, request }) => {
	await seedRunning(request, [
		{ title: 'Morning run', inSprint: true },
		{ title: 'Email the tutor', aspect: 1 }
	]);
	await page.goto('/sprint');

	await expect(aspectGroup(sprintList(page), 'Uni')).toHaveCount(0);
	const uni = railGroup(page, 'Uni');
	await expect(uni).toBeVisible();
	await expect(uni.getByLabel('1 in backlog')).toHaveText('1');
	await expect(uni.getByText(/^\d+ \/ \d+$/)).toHaveCount(0);
});

test('Scenario: Aspect without backlog todos is omitted from the rail', async ({ page, request }) => {
	await seedRunning(request, [
		{ title: 'Morning run', inSprint: true },
		{ title: 'Email the tutor', aspect: 1 }
	]);
	await page.goto('/sprint');

	await expect(aspectGroup(sprintList(page), 'Health')).toBeVisible();
	await expect(railGroup(page, 'Health')).toHaveCount(0);
});

test('Scenario: Phone Sprint tab shows Manage instead of a rail', async ({ page, request }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');

	await expect(page.getByRole('button', { name: 'Manage', exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Manage', exact: true })).toHaveText('Manage');
	await expect(contextRail(page)).toBeHidden();
	await expect(railToggle(page)).toBeHidden();
	await expect(rail(page).getByRole('listitem', { name: 'Book a physio appointment', includeHidden: true })).toBeHidden();
});

test('Manage is not offered beside a docked rail', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');
	await expect(contextRail(page)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Manage', exact: true, includeHidden: true })).toBeHidden();
});

test.describe('touch phone', () => {
	test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

	test('Scenario: Manage sheet adds a todo to the sprint', async ({ page, request }) => {
		await seedRunning(request, [
			{ title: 'Morning run', inSprint: true },
			{ title: 'Book a physio appointment' },
			{ title: 'Email the tutor', aspect: 1 }
		]);
		await page.goto('/sprint');

		await page.getByRole('button', { name: 'Manage', exact: true }).tap();
		const sheet = page.getByRole('dialog', { name: 'Backlog' });
		await expect(sheet).toBeVisible();
		await expect(todoRows(railGroup(sheet, 'Health'))).toHaveText([/Book a physio appointment/]);
		await expect(todoRows(railGroup(sheet, 'Uni'))).toHaveText([/Email the tutor/]);

		await sheet.getByRole('button', { name: 'Add to sprint: Book a physio appointment' }).tap();
		await expect(row(sheet, 'Book a physio appointment')).toHaveCount(0);
		await expect(row(sheet, 'Email the tutor')).toBeVisible();
		await page.getByRole('button', { name: 'Close' }).tap();
		await expect(row(sprintList(page), 'Book a physio appointment').getByLabel('Status')).toHaveValue('todo');

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
		await page.getByRole('button', { name: 'Manage', exact: true }).tap();

		const items = page.getByRole('dialog', { name: 'Backlog' }).getByRole('presentation');
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
	await seedRunning(request, [
		{ title: 'Morning run', inSprint: true },
		{ title: 'Book a physio appointment' },
		{ title: 'Stretch for ten minutes' }
	]);
	await page.goto('/sprint');
	const count = railGroup(page, 'Health').getByLabel(/ in backlog$/);
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
	const doing = boardColumn(page, 'doing');
	await row(boardColumn(page, 'todo'), 'Morning run').dragTo(doing, { sourcePosition: { x: 8, y: 8 } });
	await expect(row(doing, 'Morning run')).toBeVisible();
	await expect(row(boardColumn(page, 'todo'), 'Book a physio appointment')).toBeVisible();

	await page.waitForTimeout(300);
	expect((await motion(page)).max).toBe(0);
	await page.reload();
	await expect(row(boardColumn(page, 'doing'), 'Morning run').getByLabel('Status')).toHaveValue('doing');
});
