import type { Page } from '@playwright/test';
import { aspectGroup, expect, test, reset, seed, setClock, todoRow as row, todoRows, tokenColor } from './helpers';
import { statusOf } from './row-locators';

// Wednesday 7 October 2026 in Berlin; its sprint week starts Monday 5 October.
const NOW = '2026-10-07T10:00:00Z';
const TODAY = '2026-10-07';

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
	{ name: 'Finance', color: 'lagoon', icon: 'wallet' }
] as const;

const ACTIVE = { state: 'active', weekStart: '2026-10-05' } as const;

const overdueGroup = (page: Page) => page.getByRole('region', { name: /^Overdue\b/ });
const summary = (page: Page) => page.getByRole('region', { name: 'Summary' });
const PROMPT_LINKS = {
	none: 'Plan your week',
	planning: 'Continue planning',
	'review-available': 'Review it',
	'review-required': 'Review the sprint'
} as const;
const promptLink = (page: Page, phase: keyof typeof PROMPT_LINKS) => page.getByRole('link', { name: PROMPT_LINKS[phase], exact: true });
const addForm = (page: Page) => page.getByRole('form', { name: 'Add a todo' });
const emptyHeading = (page: Page) => page.getByRole('heading', { level: 2, name: 'Nothing planned for today' });

test('Scenario: Today shows today\'s sprint todos and overdue todos', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [
			{ title: 'Morning run', aspect: 0, inSprint: true, day: TODAY },
			{ title: 'Book a physio appointment', aspect: 0, inSprint: true, day: '2026-10-08' },
			{ title: 'Send tax receipts', aspect: 1, dueDate: '2026-10-06' }
		]
	});
	await page.goto('/');

	await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
	await expect(todoRows(page)).toHaveCount(2);
	await expect(aspectGroup(page, 'Health').getByRole('heading', { name: 'Health' })).toBeVisible();
	await expect(row(page, 'Morning run')).toBeVisible();
	await expect(todoRows(aspectGroup(page, 'Health'))).toHaveText(/Morning run/);

	const overdue = overdueGroup(page);
	await expect(overdue.getByRole('heading', { name: /Overdue/ })).toBeVisible();
	await expect(todoRows(overdue)).toHaveCount(1);
	await expect(todoRows(overdue)).toContainText('Send tax receipts');
	await expect(todoRows(overdue)).toContainText('Finance');
	await expect(todoRows(overdue)).toContainText('Overdue');

	await expect(row(page, 'Book a physio appointment')).toHaveCount(0);
});

test('Scenario: Today at 1280 shows sprint progress per aspect', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [
			{ title: 'Morning run', aspect: 0, inSprint: true, day: TODAY, status: 'done' },
			{ title: 'Book a physio appointment', aspect: 0, inSprint: true, day: '2026-10-08' },
			{ title: 'Pay the rent', aspect: 1, inSprint: true },
			{ title: 'Send tax receipts', aspect: 1 }
		]
	});
	await page.goto('/');

	const rail = page.getByRole('complementary', { name: 'This sprint' });
	await expect(rail).toBeVisible();
	const items = rail.getByRole('listitem');
	await expect(items).toHaveCount(2);
	await expect(items.filter({ hasText: 'Health' }).getByText(/1 \/ 2/)).toBeVisible();
	await expect(items.filter({ hasText: 'Finance' }).getByText(/0 \/ 1/)).toBeVisible();
});

test('An overdue todo planned for today is listed once, under Overdue', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [{ title: 'Pay the rent', aspect: 1, inSprint: true, day: TODAY, dueDate: '2026-10-01' }]
	});
	await page.goto('/');

	await expect(row(page, 'Pay the rent')).toHaveCount(1);
	await expect(todoRows(overdueGroup(page))).toContainText('Pay the rent');
});

test('Scenario: Status toggle on Today', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [
			{ title: 'Morning run', inSprint: true, day: TODAY },
			{ title: 'Pay the rent', aspect: 1, inSprint: true, day: '2026-10-06', dueDate: '2026-10-06' }
		]
	});
	await page.goto('/');

	for (const title of ['Morning run', 'Pay the rent']) {
		const checkbox = page.getByRole('checkbox', { name: `Done: ${title}` });
		await checkbox.click();
		await expect(checkbox).toHaveAttribute('aria-checked', 'true');
		await expect(row(page, title)).toContainText('Status: Done');
		await expect(row(page, title).getByRole('button', { name: title, exact: true })).not.toHaveCSS('text-decoration-line', /line-through/);
		await expect(row(page, title).getByRole('button', { name: title, exact: true })).toHaveCSS('color', await tokenColor(page, '--ink-secondary'));
	}

	// An overdue sprint todo is no longer overdue once done; it stays on Today, muted, never struck through.
	await page.reload();
	for (const title of ['Morning run', 'Pay the rent']) {
		await expect(row(page, title)).toContainText('Status: Done');
		await expect(row(page, title).getByRole('button', { name: title, exact: true })).not.toHaveCSS('text-decoration-line', /line-through/);
		await expect(row(page, title).getByRole('button', { name: title, exact: true })).toHaveCSS('color', await tokenColor(page, '--ink-secondary'));
	}
});

test('Scenario: Overdue todos outside the sprint offer the sprint instead of a checkbox', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [{ title: 'Send tax receipts', aspect: 1, dueDate: '2026-10-06' }]
	});
	await page.goto('/');

	const overdue = overdueGroup(page);
	await expect(row(page, 'Send tax receipts')).toBeVisible();
	await expect(overdue.getByRole('checkbox')).toHaveCount(0);

	await page.getByRole('button', { name: 'Add to sprint: Send tax receipts' }).click();
	await expect(page.getByRole('checkbox', { name: 'Done: Send tax receipts' })).toHaveAttribute('aria-checked', 'false');
	await expect(row(page, 'Send tax receipts')).toContainText('Status: To do');

	await page.goto('/sprint');
	await expect(statusOf(row(page, 'Send tax receipts'), 'To do')).toBeVisible();
});

test('Scenario: Quick add is shown in every Today state', async ({ page, request }) => {
	const addButton = addForm(page).getByRole('button', { name: 'Add', exact: true });
	const phase = (name: keyof typeof PROMPT_LINKS) => expect(promptLink(page, name)).toBeVisible();

	await seed(request, { aspects: [...ASPECTS] });
	await page.goto('/');
	await phase('none');
	await expect(addButton).toBeVisible();

	await reset(request);
	await setClock(request, NOW);
	await seed(request, { aspects: [...ASPECTS], sprint: { state: 'planning' } });
	await page.goto('/');
	await phase('planning');
	await expect(addButton).toBeVisible();

	await reset(request);
	await setClock(request, NOW);
	await seed(request, { aspects: [...ASPECTS], sprint: ACTIVE });
	await page.goto('/');
	await expect(page.getByRole('link', { name: /^(Plan your week|Continue planning|Review it|Review the sprint)$/ })).toHaveCount(0);
	await expect(addButton).toBeVisible();

	await setClock(request, '2026-10-11T10:00:00Z');
	await page.goto('/');
	await phase('review-available');
	await expect(addButton).toBeVisible();

	await setClock(request, '2026-10-12T10:00:00Z');
	await page.goto('/');
	await phase('review-required');
	await expect(addButton).toBeVisible();

	await setClock(request, '2026-10-11T18:00:00Z');
	await page.goto('/sprint/review');
	await page.getByRole('button', { name: 'Close sprint' }).click();
	await expect(page).toHaveURL(/\/sprint\/plan$/);
	await page.goto('/');
	await phase('planning');
	await expect(addButton).toBeVisible();
});

test('Scenario: Quick add on Today adds to the sprint on today', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], sprint: ACTIVE });
	await page.goto('/');

	await quickAdd(page, 'Stretch for ten minutes');

	const added = row(page, 'Stretch for ten minutes');
	await expect(added).toHaveAttribute('data-day', TODAY);
	await expect(added).toContainText('Status: To do');
	await expect(aspectGroup(page, 'Health')).toContainText('Stretch for ten minutes');

	// Today lists only active-sprint todos, so surviving a reload proves the membership.
	await page.reload();
	await expect(row(page, 'Stretch for ten minutes')).toHaveAttribute('data-day', TODAY);
	await page.goto('/backlog');
	await expect(row(page, 'Stretch for ten minutes')).toHaveCount(0);
});

async function quickAdd(page: Page, title: string) {
	const form = addForm(page);
	await form.getByRole('textbox', { name: 'Title' }).fill(title);
	await form.getByRole('button', { name: 'Add', exact: true }).click();
}

test('Scenario: Quick add on Today outside the sprint\'s days saves a backlog todo due today', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: '2026-10-12' } });
	await setClock(request, '2026-10-11T18:00:00Z');
	await page.goto('/');

	await quickAdd(page, 'Call the landlord');
	await expect(addForm(page).getByRole('textbox', { name: 'Title' })).toHaveValue('');
	await expect(aspectGroup(page, 'Health')).toContainText('Call the landlord');

	await page.goto('/backlog');
	const added = row(page, 'Call the landlord');
	await expect(added).toBeVisible();
	await expect(added).toHaveAttribute('data-day', '');
	await expect(added.getByText('Today', { exact: true })).toHaveText('Today');

	await reset(request);
	await seed(request, { aspects: [...ASPECTS], sprint: ACTIVE });
	await setClock(request, '2026-10-12T10:00:00Z');
	await page.goto('/');
	await expect(promptLink(page, 'review-required')).toBeVisible();

	await quickAdd(page, 'Renew the passport');
	await expect(aspectGroup(page, 'Health')).toContainText('Renew the passport');

	await page.goto('/backlog');
	const fallback = row(page, 'Renew the passport');
	await expect(fallback).toBeVisible();
	await expect(fallback).toHaveAttribute('data-day', '');
	await expect(fallback.getByText('Today', { exact: true })).toHaveText('Today');
});

test('Scenario: Quick add on Today without any sprint saves a backlog todo due today', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS] });
	await page.goto('/');

	await quickAdd(page, 'Call the landlord');
	await expect(aspectGroup(page, 'Health')).toContainText('Call the landlord');

	await page.reload();
	await expect(aspectGroup(page, 'Health')).toContainText('Call the landlord');

	await page.goto('/backlog');
	await expect(row(page, 'Call the landlord').getByText('Today', { exact: true })).toHaveText('Today');
});

test('Scenario: Quick add on a phone stays inline in every state', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS] });
	await page.setViewportSize({ width: 390, height: 800 });
	await page.goto('/');

	await quickAdd(page, 'Call the landlord');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(addForm(page).getByRole('textbox', { name: 'Title' })).toHaveValue('');
	await expect(aspectGroup(page, 'Health')).toContainText('Call the landlord');
});

test('Scenario: Today\'s quick add states its destination', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], sprint: ACTIVE });
	await page.goto('/');
	await expect(addForm(page).getByText('Goes to this sprint, planned today', { exact: true })).toBeVisible();

	await reset(request);
	await setClock(request, NOW);
	await seed(request, { aspects: [...ASPECTS] });
	await page.goto('/');
	await expect(addForm(page).getByText('Goes to the backlog, due today', { exact: true })).toBeVisible();
});

test('Scenario: Backlog todos due today are listed only when today is not a sprint day', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [{ title: 'Call the landlord', aspect: 1, dueDate: TODAY }]
	});
	await page.goto('/');
	await expect(emptyHeading(page)).toBeVisible();
	await expect(row(page, 'Call the landlord')).toHaveCount(0);

	await reset(request);
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: '2026-10-12' },
		todos: [{ title: 'Call the landlord', aspect: 1, dueDate: '2026-10-11' }]
	});
	await setClock(request, '2026-10-11T18:00:00Z');
	await page.goto('/');
	await expect(aspectGroup(page, 'Finance')).toContainText('Call the landlord');
	await expect(emptyHeading(page)).toHaveCount(0);

	await reset(request);
	await seed(request, { aspects: [...ASPECTS], todos: [{ title: 'Call the landlord', aspect: 1, dueDate: '2026-10-11' }] });
	await setClock(request, '2026-10-11T18:00:00Z');
	await page.goto('/');
	await expect(row(page, 'Call the landlord')).toBeVisible();
});

test('Scenario: Due-today backlog todos offer the sprint instead of a checkbox', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'active', weekStart: '2026-10-12' },
		todos: [{ title: 'Call the landlord', aspect: 1, dueDate: '2026-10-11' }]
	});
	await setClock(request, '2026-10-11T18:00:00Z');
	await page.goto('/');

	await expect(row(page, 'Call the landlord')).toBeVisible();
	await expect(page.getByRole('checkbox')).toHaveCount(0);
	await page.getByRole('button', { name: 'Add to sprint: Call the landlord' }).click();
	await expect(page.getByRole('checkbox', { name: 'Done: Call the landlord' })).toHaveAttribute('aria-checked', 'false');
	await expect(row(page, 'Call the landlord')).toContainText('Status: To do');

	await page.goto('/sprint');
	await expect(statusOf(row(page, 'Call the landlord'), 'To do')).toBeVisible();

	await reset(request);
	await seed(request, { aspects: [...ASPECTS], todos: [{ title: 'Call the landlord', aspect: 1, dueDate: '2026-10-11' }] });
	await setClock(request, '2026-10-11T18:00:00Z');
	await page.goto('/');
	await expect(row(page, 'Call the landlord')).toBeVisible();
	await expect(page.getByRole('checkbox')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Add to sprint: Call the landlord' })).toHaveCount(0);
});

test('Quick add stays on the Sunday before next week\'s sprint starts', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], sprint: { state: 'active', weekStart: '2026-10-12' } });
	await setClock(request, '2026-10-11T18:00:00Z');
	await page.goto('/');

	await expect(addForm(page)).toBeVisible();
	await expect(emptyHeading(page)).toBeVisible();
});

test('Scenario: Today without an active sprint prompts to plan', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], todos: [{ title: 'Send tax receipts', dueDate: '2026-10-06' }] });
	await page.goto('/');

	await expect(promptLink(page, 'none')).toBeVisible();
	await expect(promptLink(page, 'none')).toHaveAttribute('href', '/sprint/plan');
	await expect(row(page, 'Send tax receipts')).toBeVisible();
	await expect(addForm(page)).toBeVisible();
	await expect(emptyHeading(page)).toHaveCount(0);
});

test('Scenario: Today with a pending review prompts to review', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [{ title: 'Weekly reset', inSprint: true, day: '2026-10-11' }]
	});

	// Sunday of the sprint's week: the review is available and the day is still the sprint's.
	await setClock(request, '2026-10-11T10:00:00Z');
	await page.goto('/');
	await expect(promptLink(page, 'review-available')).toBeVisible();
	await expect(promptLink(page, 'review-available')).toHaveAttribute('href', '/sprint/review');
	await expect(row(page, 'Weekly reset')).toBeVisible();

	// The Monday after: the review is required and blocks adding to the old sprint.
	await setClock(request, '2026-10-12T10:00:00Z');
	await page.goto('/');
	await expect(promptLink(page, 'review-required')).toBeVisible();
	await expect(promptLink(page, 'review-required')).toHaveAttribute('href', '/sprint/review');
	await expect(addForm(page)).toBeVisible();
});

test('Scenario: Nothing today shows a calm empty state', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [
			{ title: 'Book a physio appointment', inSprint: true, day: '2026-10-08' },
			{ title: 'Paid the rent', dueDate: '2026-10-01', status: 'done' }
		]
	});
	await page.goto('/');

	await expect(emptyHeading(page)).toBeVisible();
	await expect(page.getByText('The week view has the rest of your sprint.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Week view' })).toHaveAttribute('href', '/sprint?view=week');
	await expect(todoRows(page)).toHaveCount(0);
	await expect(page.getByRole('link', { name: /^(Plan your week|Continue planning|Review it|Review the sprint)$/ })).toHaveCount(0);
});

test('Scenario: Sunday after the review prompts to plan next week', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [{ title: 'Morning run', inSprint: true, day: '2026-10-11', status: 'done' }]
	});
	await setClock(request, '2026-10-11T18:00:00Z');
	await page.goto('/sprint/review');
	await page.getByRole('button', { name: 'Close sprint' }).click();
	await expect(page).toHaveURL(/\/sprint\/plan$/);

	await page.goto('/');
	await expect(promptLink(page, 'planning')).toBeVisible();
	await promptLink(page, 'planning').click();
	await expect(page).toHaveURL(/\/sprint\/plan$/);
	await expect(page.getByText('Mon 12 – Sun 18 Oct', { exact: true })).toBeVisible();
});

test('Scenario: Planned-today backlog todo shows on Today between sprints', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: { state: 'closed', weekStart: '2026-10-12' },
		todos: [
			{ title: 'Dentist', aspect: 1, day: '2026-10-18', startTime: '18:00' },
			{ title: 'Next week', aspect: 1, day: '2026-10-19' }
		]
	});
	await setClock(request, '2026-10-18T10:00:00Z');
	await page.goto('/');

	await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
	await expect(todoRows(aspectGroup(page, 'Finance'))).toHaveText(/Dentist/);
	await expect(row(page, 'Next week')).toHaveCount(0);
	await expect(summary(page).getByText(/^1\s*open today$/)).toBeVisible();
});

test('Scenario: Header counts open todos on Today', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [
			{ title: 'Morning run', aspect: 0, inSprint: true, day: TODAY },
			{ title: 'Stretch', aspect: 0, inSprint: true, day: TODAY },
			{ title: 'Meal prep', aspect: 0, inSprint: true, day: TODAY, status: 'done' },
			{ title: 'Pay the rent', aspect: 1, dueDate: '2026-10-06' }
		]
	});
	await page.goto('/');

	const header = summary(page);
	await expect(header.getByText(/^3\s*open today$/)).toBeVisible();
});

test('Scenario: Header shows sprint progress during a sprint', async ({ page, request }) => {
	// Thursday 8 October: Friday, Saturday and Sunday are left.
	await setClock(request, '2026-10-08T10:00:00Z');
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [
			...['Run', 'Stretch', 'Swim', 'Physio', 'Yoga'].map((title, i) => ({
				title,
				aspect: 0,
				inSprint: true,
				status: i < 2 ? ('done' as const) : ('todo' as const)
			})),
			...['Rent', 'Taxes', 'Budget', 'Insurance'].map((title, i) => ({
				title,
				aspect: 1,
				inSprint: true,
				status: i < 1 ? ('done' as const) : ('todo' as const)
			}))
		]
	});
	await page.goto('/');

	const header = summary(page);
	await expect(header.getByText('Sprint 3 / 9 done · 3 days left', { exact: true })).toBeVisible();
	const bar = header.getByRole('img', { name: /^Sprint progress by aspect/ });
	await expect(bar).toHaveAccessibleName('Sprint progress by aspect: Health 2 of 5, Finance 1 of 4');
	await expect(bar.locator('> span')).toHaveCount(2);
});

test('Scenario: Header without a sprint shows only the count', async ({ page, request }) => {
	await seed(request, { aspects: [...ASPECTS], todos: [{ title: 'Pay the rent', aspect: 1, dueDate: TODAY }] });
	await page.goto('/');

	const header = summary(page);
	await expect(header.getByText(/^1\s*open today$/)).toBeVisible();
	await expect(header.getByText(/^Sprint \d+ \/ \d+ done/)).toHaveCount(0);
	await expect(header.getByRole('img')).toHaveCount(0);
});

test('Scenario: Overdue todo planned for today shows once on Today', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		todos: [{ title: 'Send tax receipts', aspect: 1, dueDate: '2026-10-06', day: TODAY }]
	});
	await page.goto('/');

	await expect(row(page, 'Send tax receipts')).toHaveCount(1);
	await expect(todoRows(overdueGroup(page))).toHaveCount(1);
});

test('Scenario: Today rows write status and priority as text', async ({ page, request }) => {
	await seed(request, {
		aspects: [...ASPECTS],
		sprint: ACTIVE,
		todos: [
			{ title: 'Morning run', inSprint: true, day: TODAY, status: 'doing', priority: 1 },
			{ title: 'Stretch', inSprint: true, day: TODAY, status: 'done', priority: 2 },
			{ title: 'Pay the rent', aspect: 1, inSprint: true, day: TODAY }
		]
	});
	await page.goto('/');

	await expect(row(page, 'Morning run').getByText('Doing', { exact: true })).toBeVisible();
	await expect(row(page, 'Morning run').getByRole('img', { name: 'Priority 1' })).toHaveText('P1');
	await expect(row(page, 'Stretch').getByText('Done', { exact: true })).toBeVisible();
	await expect(row(page, 'Stretch').getByRole('img', { name: 'Priority 2' })).toHaveText('P2');
	await expect(row(page, 'Pay the rent').getByText('To do', { exact: true })).toHaveCount(0);
});

test('Scenario: A todo added on Today settles in and ticking stays instant', async ({ page, request }) => {
	// Record every Web Animation the page starts, so the check reads what ran, not whether it is still running under load.
	await page.addInitScript(() => {
		const started: { target: Element; duration: number }[] = [];
		(window as unknown as { __started: typeof started }).__started = started;
		const animate = Element.prototype.animate;
		Element.prototype.animate = function (this: Element, keyframes, options) {
			started.push({ target: this, duration: Number(typeof options === 'number' ? options : (options?.duration ?? 0)) });
			return animate.call(this, keyframes, options);
		};
	});
	await seed(request, { aspects: [...ASPECTS], sprint: ACTIVE, todos: [{ title: 'Morning run', inSprint: true, day: TODAY }] });
	await page.goto('/');
	await expect(row(page, 'Morning run')).toBeVisible();

	const animated = (title: string) =>
		row(page, title).evaluate((li) => {
			const box = li.parentElement as HTMLElement;
			return (window as unknown as { __started: { target: Element; duration: number }[] }).__started.filter((a) => a.duration > 0 && (a.target === box || box.contains(a.target))).length;
		});

	await quickAdd(page, 'Stretch for ten minutes');
	await expect(row(page, 'Stretch for ten minutes')).toBeVisible();
	await expect.poll(() => animated('Stretch for ten minutes')).toBeGreaterThan(0);

	await page.waitForFunction(() => document.getAnimations().length === 0);
	const before = await animated('Morning run');
	await page.getByRole('checkbox', { name: 'Done: Morning run' }).click();
	await expect(page.getByRole('checkbox', { name: 'Done: Morning run' })).toHaveAttribute('aria-checked', 'true');
	expect(await animated('Morning run')).toBe(before);
});
