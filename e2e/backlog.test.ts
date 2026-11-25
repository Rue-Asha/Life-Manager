import { expect, test, reset, seed, setClock, aspectGroup, todoRow, todoRows, todoTitles } from './helpers';
import { sprintList } from './sprint-locators';
import { statusOf } from './row-locators';

// Wednesday 7 October 2026 in Berlin; its sprint week starts Monday 5 October.
const NOW = '2026-10-07T10:00:00Z';

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
	{ name: 'Uni', color: 'lavender', icon: 'cap' }
] as const;

test('Scenario: Backlog is grouped by aspect', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		todos: [
			{ title: 'Undated, no priority', aspect: 0 },
			{ title: 'P2 due later', aspect: 0, priority: 2, dueDate: '2026-10-20' },
			{ title: 'P2 due sooner', aspect: 0, priority: 2, dueDate: '2026-10-10' },
			{ title: 'P1 undated', aspect: 0, priority: 1 },
			{ title: 'Read chapter 4', aspect: 1, priority: 3 }
		]
	});
	await page.goto('/backlog');

	const health = aspectGroup(page, 'Health');
	await expect(health.getByRole('heading', { name: 'Health' })).toBeVisible();
	await expect(health.getByRole('heading').locator('svg')).toBeVisible();
	await expect.poll(() => todoTitles(health)).toEqual([
		'P1 undated',
		'P2 due sooner',
		'P2 due later',
		'Undated, no priority'
	]);

	const uni = aspectGroup(page, 'Uni');
	await expect(uni.getByRole('heading', { name: 'Uni' })).toBeVisible();
	await expect(todoRows(uni)).toHaveCount(1);
	await expect(todoRows(uni)).toContainText('Read chapter 4');
});

test('Scenario: Filter the backlog to one aspect', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [...ASPECTS],
		todos: [
			{ title: 'Book a physio appointment', aspect: 0 },
			{ title: 'Read chapter 4', aspect: 1 }
		]
	});
	await page.goto('/backlog');
	const filter = page.getByRole('navigation', { name: 'Filter by aspect' });

	await filter.getByRole('link', { name: 'Uni' }).click();
	await expect(page).toHaveURL(new RegExp(`aspect=${aspects[1]}$`));
	await expect(aspectGroup(page, 'Uni')).toBeVisible();
	await expect(aspectGroup(page, 'Health')).toHaveCount(0);
	await expect(filter.getByRole('link', { name: 'Uni' })).toHaveAttribute('aria-current', 'true');

	await filter.getByRole('link', { name: 'All' }).click();
	await expect(aspectGroup(page, 'Health')).toBeVisible();
	await expect(aspectGroup(page, 'Uni')).toBeVisible();
});

test('Scenario: Empty backlog shows an empty state', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS] });
	await page.goto('/backlog');

	await expect(page.getByRole('heading', { name: 'Your backlog is empty' })).toBeVisible();
	await expect(page.getByText('Add a todo to start planning.')).toBeVisible();
	await page.getByRole('main').getByRole('button', { name: 'Add a todo' }).click();
	const dialog = page.getByRole('dialog', { name: 'New todo' });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByLabel('Title')).toBeFocused();
});

test('Scenario: Overdue todos are marked in the backlog', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		todos: [
			{ title: 'Send tax receipts', dueDate: '2026-10-04' },
			{ title: 'Renew the bike insurance', dueDate: '2026-10-09' }
		]
	});
	await page.goto('/backlog');

	const late = todoRow(page, 'Send tax receipts');
	await expect(late).toContainText('Overdue');
	await expect(late.getByText('Overdue, 3d late')).toBeVisible();

	const onTime = todoRow(page, 'Renew the bike insurance');
	await expect(onTime).not.toContainText('Overdue');
	await expect(onTime).toContainText('2d left');
});

test('Scenario: Add a backlog todo to the active sprint', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [{ title: 'Clean the fridge' }, { title: 'Water the plants' }]
	});
	await page.goto('/backlog');

	await page.getByRole('button', { name: 'Add to sprint: Clean the fridge' }).click();
	await expect(todoRow(page, 'Clean the fridge')).toHaveCount(0);
	await expect(todoRow(page, 'Water the plants')).toBeVisible();

	await page.goto('/sprint');
	const added = todoRow(page, 'Clean the fridge');
	await expect(statusOf(added, 'To do')).toBeVisible();
	await expect(todoRow(sprintList(page), 'Water the plants')).toHaveCount(0);
});

test('No "Add to sprint" without an active sprint', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], todos: [{ title: 'Clean the fridge' }] });
	await page.goto('/backlog');

	await expect(todoRows(page)).toBeVisible();
	await expect(page.getByRole('button', { name: /^Add to sprint/ })).toHaveCount(0);
});

// Monday 12 October: the sprint of 5–11 October is over and its review is required.
const REVIEW_DUE = '2026-10-12T10:00:00Z';

test('Scenario: Backlog page points to Review instead of adding', async ({ page, request }) => {
	await setClock(request, REVIEW_DUE);
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [{ title: 'Clean the fridge' }]
	});
	await page.goto('/backlog');

	await expect(todoRows(page)).toBeVisible();
	await expect(page.getByRole('button', { name: /Add to sprint/ })).toHaveCount(0);
	const note = page.getByRole('status').filter({ hasText: 'This week’s sprint is over, so nothing can join it.' });
	await note.getByRole('link', { name: /review/i }).click();
	await expect(page).toHaveURL(/\/sprint\/review$/);
});

test('Scenario: Review becoming required after page load refuses the add', async ({ page, request }) => {
	await setClock(request, '2026-10-11T10:00:00Z');
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [{ title: 'Clean the fridge' }]
	});
	await page.goto('/backlog');
	await setClock(request, REVIEW_DUE);

	await page.getByRole('button', { name: 'Add to sprint: Clean the fridge' }).click();
	const message = page.getByRole('alert');
	await expect(message).toContainText('The sprint needs its review first.');
	await expect(message.getByRole('link', { name: 'Review' })).toHaveAttribute('href', '/sprint/review');

	await page.reload();
	await expect(todoRow(page, 'Clean the fridge')).toBeVisible();
});

test('Scenario: Planned todos are listed in the Planned section', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		todos: [
			{ title: 'Dentist', aspect: 0, day: '2026-10-28', startTime: '18:00', dueDate: '2026-10-30', priority: 1 },
			{ title: 'Tax return', aspect: 1, day: '2026-10-28' },
			{ title: 'Call grandma', aspect: 0, day: '2026-10-21', startTime: '09:00' },
			{ title: 'Clean the fridge', aspect: 0 }
		]
	});
	await page.goto('/backlog');

	const planned = page.getByRole('region', { name: /^Planned\b/ });
	await expect(planned.getByRole('heading', { name: 'Planned' })).toBeVisible();
	await expect.poll(() => todoTitles(planned)).toEqual(['Call grandma', 'Tax return', 'Dentist']);
	await expect(planned.getByText('Clean the fridge')).toHaveCount(0);

	// As signed: aspect, then the planned day and slot, then due and priority.
	const meta = await todoRow(planned, 'Dentist').innerText();
	const at = (part: string) => meta.indexOf(part);
	const when = await todoRow(planned, 'Dentist').getByRole('time').innerText();
	expect(at('Health')).toBeGreaterThan(-1);
	expect(at('Health')).toBeLessThan(at(when));
	expect(at(when)).toBeLessThan(at('P1'));

	const health = aspectGroup(page, 'Health');
	await expect.poll(() => todoTitles(health)).toEqual(['Clean the fridge']);
	const before = await planned.boundingBox();
	const after = await health.boundingBox();
	expect(before!.y).toBeLessThan(after!.y);
});

test('Scenario: No Planned section without planned todos', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], todos: [{ title: 'Clean the fridge', aspect: 0 }] });
	await page.goto('/backlog');
	await expect(todoRows(page)).toHaveCount(1);
	await expect(page.getByRole('region', { name: /^Planned\b/ })).toHaveCount(0);
});
