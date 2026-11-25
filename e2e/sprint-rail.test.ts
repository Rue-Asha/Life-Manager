import type { Locator, Page } from '@playwright/test';
import { aspectGroup, expect, test, reset, seed, setClock, todoRow, todoRows, type SeedInput } from './helpers';
import {
	backlogRail as rail,
	boardColumn,
	contextRail,
	manageButton,
	railGroup,
	railTab,
	sprintList,
	sprintPrompt
} from './sprint-locators';
import { statusOf } from './row-locators';

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

// The aspect's colour as the sprint group's icon tile and the rail group's dot show it.
const tileColor = (scope: Locator) => scope.locator('.nav-tile').evaluate((el) => getComputedStyle(el).backgroundColor);
const dotColor = (scope: Locator) => scope.locator('.hs-asp').evaluate((el) => getComputedStyle(el).backgroundColor);

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
		expect(await dotColor(railGroup(page, name))).toBe(await tileColor(aspectGroup(sprintList(page), name)));
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

	// By aspect and Board keep the rail docked at the right of the content, with no fold control and no Manage.
	for (const width of [1280, 1600]) {
		await page.setViewportSize({ width, height: 800 });
		for (const view of ['aspect', 'board']) {
			await page.goto(`/sprint?view=${view}`);
			await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
			const context = contextRail(page);
			await expect(context).toBeVisible();
			await expect(context).toHaveCSS('position', 'sticky');
			await expect(railTab(page)).toHaveCount(0);
			await expect(manageButton(page)).toBeHidden();
			const rail = (await context.boundingBox())!;
			const content = (await (view === 'aspect' ? sprintList(page) : boardColumn(page, 'done')).boundingBox())!;
			expect(content.x + content.width, `${view} overlaps the rail at ${width}`).toBeLessThanOrEqual(rail.x);
			expect(rail.x - (content.x + content.width), `${view} stops short of the rail at ${width}`).toBeLessThanOrEqual(64);
			expect(rail.x + rail.width).toBeLessThanOrEqual(width);
		}
	}
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

	await expect(rail(page)).toContainText('The backlog is empty');
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
	await expect(statusOf(added, 'To do')).toBeVisible();
	await expect(added).toHaveAttribute('data-day', '');
	await expect(page).toHaveURL(/\/sprint$/);
	expect(await page.evaluate(() => (window as unknown as { __stay?: boolean }).__stay)).toBe(true);

	await page.reload();
	await expect(statusOf(row(sprintList(page), 'Book a physio appointment'), 'To do')).toBeVisible();
	await expect(row(rail(page), 'Book a physio appointment')).toHaveCount(0);
});

test('Scenario: Drag a rail todo onto the sprint list', async ({ page, request }) => {
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);
	await page.goto('/sprint');

	await row(rail(page), 'Book a physio appointment').dragTo(sprintList(page));
	await expect(row(sprintList(page), 'Book a physio appointment')).toBeVisible();

	await page.reload();
	await expect(statusOf(row(sprintList(page), 'Book a physio appointment'), 'To do')).toBeVisible();
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
	// Tall enough to see the list and the rail together: a drag that has to scroll mid-press does not start.
	await page.setViewportSize({ width: 1280, height: 1100 });
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

	// The signed header names the count only ("1 / 3"), with the aspect's colour on its icon tile; there is no bar.
	const group = aspectGroup(sprintList(page), 'Health');
	const header = group.locator('.hs-group-head');
	await expect(header).toHaveText(/^\s*Health\s*Done\s*1 \/ 3\s*$/);
	const tile = header.locator('.nav-tile');
	await expect(tile).toHaveAttribute('data-color', 'sage');
	const sage = await page.evaluate(() => {
		const probe = document.createElement('span');
		probe.style.background = 'var(--aspect-sage)';
		document.body.append(probe);
		const value = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return value;
	});
	await expect(tile).toHaveCSS('background-color', sage);
	await expect(group.getByRole('progressbar')).toHaveCount(0);
	await expect(group.locator('progress, meter')).toHaveCount(0);
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
	await expect(header.getByText('1 / 2')).toBeVisible();
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
	await seedRunning(request, [{ title: 'Morning run', inSprint: true }, { title: 'Book a physio appointment' }]);

	for (const width of [375, 1100]) {
		await page.setViewportSize({ width, height: 812 });
		await page.goto('/sprint');

		await expect(page.getByRole('button', { name: 'Manage', exact: true })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Manage', exact: true })).toHaveText('Manage');
		await expect(contextRail(page)).toBeHidden();
		await expect(railTab(page)).toBeHidden();
		await expect(rail(page).getByRole('listitem', { name: 'Book a physio appointment', includeHidden: true })).toBeHidden();
	}
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
		await expect(statusOf(row(sprintList(page), 'Book a physio appointment'), 'To do')).toBeVisible();

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

		const items = page.getByRole('dialog', { name: 'Backlog' }).getByRole('listitem');
		await expect(items).toHaveCount(2);
		for (const item of await items.all()) {
			await expect(item).not.toHaveAttribute('draggable', 'true');
			await expect(item.getByRole('button', { name: /^Add to sprint: / })).toBeVisible();
		}
		await expect(sprintList(page).locator('[draggable="true"]')).toHaveCount(0);
	});
});

// Records in which rendered frame after the last click the first animation got its start time on the document timeline: a count of frames
// (100 ms is six at 60 Hz), not milliseconds, so a loaded machine that renders late can't make it look slow.
async function watchAnimations(page: Page) {
	await page.waitForFunction(() => document.getAnimations().length === 0);
	await page.evaluate(() => {
		const w = window as unknown as { __motion: { press: number; first: number | null; delay: number; max: number } };
		w.__motion = { press: 0, first: null, delay: 0, max: 0 };
		let pending: Animation[] = [];
		let frames: number[] = [];
		document.addEventListener('click', () => ((w.__motion.press = performance.now()), (w.__motion.first = null), (pending = []), (frames = [])), true);
		const tick = (now: number) => {
			if (w.__motion.press) frames.push(now);
			const running = document.getAnimations();
			w.__motion.max = Math.max(w.__motion.max, running.length);
			if (w.__motion.first === null) {
				if (!pending.length) pending = running;
				const start = Math.min(Infinity, ...pending.map((a) => Number(a.startTime ?? Infinity)));
				if (start !== Infinity) {
					w.__motion.first = frames.filter((t) => t < start).length;
					w.__motion.delay = Math.max(0, ...pending.map((a) => Number(a.effect?.getTiming().delay ?? 0)));
				}
			}
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});
}

const motion = (page: Page) =>
	page.evaluate(() => (window as unknown as { __motion: { first: number | null; delay: number; max: number } }).__motion);

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
	const { first, delay } = await motion(page);
	expect(first).not.toBeNull();
	// 100 ms at 60 Hz
	expect(first!).toBeLessThanOrEqual(6);
	expect(delay).toBe(0);
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
	await expect(statusOf(row(boardColumn(page, 'doing'), 'Morning run'), 'Doing')).toBeVisible();
});
