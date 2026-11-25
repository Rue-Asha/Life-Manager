import { aspectGroup, expect, openNewTodo, test, reset, seed, setClock, todoRow, todoRows } from './helpers';
import { sprintList } from './sprint-locators';

// Thursday 15 October 2026 in Berlin, inside the sprint of 12–18 October.
const THURSDAY = '2026-10-15T08:00:00Z';
const SPRINT = { state: 'active', weekStart: '2026-10-12' } as const;
const ASPECTS = [{ name: 'Health' }, { name: 'Home' }];

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await setClock(request, THURSDAY);
	await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

test('Scenario: Plus on the phone adds a backlog todo', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, sprint: SPRINT });
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/recurring');

	const dialog = await openNewTodo(page);
	await dialog.getByLabel('Title').fill('Buy stamps');
	await dialog.getByLabel('Aspect').selectOption({ label: 'Home' });
	await dialog.getByLabel('Title').press('Enter');
	await expect(dialog).toBeHidden();

	await page.goto('/backlog');
	await expect(todoRows(aspectGroup(page, 'Home'))).toHaveText([/Buy stamps/]);
	await page.goto('/sprint');
	await expect(sprintList(page)).toBeVisible();
	await expect(todoRows(sprintList(page))).toHaveCount(0);
});

test('Scenario: New todo on desktop states the destination live', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, sprint: SPRINT });
	await page.goto('/backlog');

	const dialog = await openNewTodo(page);
	await expect(dialog.getByText('Goes to the backlog')).toBeVisible();
	await dialog.getByLabel('Planned', { exact: true }).fill('2026-10-16');
	await expect(dialog.getByText('Goes to this sprint')).toBeVisible();
	await expect(dialog.getByText('Goes to the backlog')).toHaveCount(0);
	await dialog.getByLabel('Title').fill('Pack the gym bag');
	await dialog.getByRole('button', { name: 'Add todo' }).click();
	await expect(dialog).toBeHidden();

	await page.goto('/sprint?view=aspect');
	await expect(todoRow(page, 'Pack the gym bag')).toHaveAttribute('data-day', '2026-10-16');
});

test('Scenario: Quick add on an aspect page pre-fills the aspect', async ({ page, request }) => {
	const { aspects } = await seed(request, { aspects: [{ name: 'Health' }, { name: 'Home' }, { name: 'Studies' }], sprint: SPRINT });
	await page.goto(`/aspects/${aspects[1]}`);
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Home');

	const dialog = await openNewTodo(page);
	await expect(dialog.getByLabel('Aspect')).toHaveValue(String(aspects[1]));
	await expect(dialog.getByLabel('Aspect').locator('option:checked')).toHaveText('Home');

	await page.goto('/backlog');
	const other = await openNewTodo(page);
	await expect(other.getByLabel('Aspect').locator('option:checked')).toHaveText('Health');
});

test('Scenario: Quick add on the sprint pre-sets the sprint destination', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS, sprint: SPRINT });
	await page.goto('/sprint');
	await expect(sprintList(page)).toBeVisible();

	const dialog = await openNewTodo(page);
	await expect(dialog.getByText('Goes to this sprint')).toBeVisible();
	await dialog.getByLabel('Title').fill('Sort the mail');
	await dialog.getByRole('button', { name: 'Add todo' }).click();
	await expect(dialog).toBeHidden();

	await expect(todoRows(sprintList(page))).toHaveText([/Sort the mail/]);
	await page.goto('/sprint?view=aspect');
	await expect(todoRow(page, 'Sort the mail')).toHaveAttribute('data-day', '');
});

test('Scenario: No running sprint offers only the backlog', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS });
	await page.goto('/sprint');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	const dialog = await openNewTodo(page);
	await expect(dialog.getByText('Goes to the backlog')).toBeVisible();
	await expect(dialog.getByRole('button', { name: 'This sprint' })).toHaveCount(0);
});

test('Scenario: Review required disables the sprint destination', async ({ page, request }) => {
	await setClock(request, '2026-10-14T10:00:00Z');
	await seed(request, { aspects: ASPECTS, sprint: { state: 'active', weekStart: '2026-10-05' } });
	await page.goto('/backlog');

	const dialog = await openNewTodo(page);
	await expect(dialog.getByRole('button', { name: 'This sprint' })).toBeDisabled();
	await expect(dialog.getByRole('link', { name: 'Review the sprint' })).toHaveAttribute('href', '/sprint/review');
	await expect(dialog.getByText('Goes to the backlog')).toBeVisible();
	await dialog.getByLabel('Title').fill('After the review');
	await dialog.getByRole('button', { name: 'Add todo' }).click();
	await expect(dialog).toBeHidden();

	await page.goto('/backlog');
	await expect(todoRows(page.getByRole('main'))).toHaveText([/After the review/]);
});

test('Scenario: Missing title shows an inline alert', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS });
	await page.goto('/backlog');

	const dialog = await openNewTodo(page);
	await dialog.getByRole('button', { name: 'Add todo' }).click();
	await expect(dialog.getByRole('alert')).toHaveText('Give the todo a title.');
	await expect(dialog).toBeVisible();

	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await page.reload();
	await expect(todoRows(page.getByRole('main'))).toHaveCount(0);
});

test('Scenario: Escape and backdrop close the quick add without a todo', async ({ page, request }) => {
	await seed(request, { aspects: ASPECTS });
	await page.goto('/backlog');
	const trigger = page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'New todo' });

	let dialog = await openNewTodo(page);
	await dialog.getByLabel('Title').fill('Never mind');
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();

	dialog = await openNewTodo(page);
	await dialog.getByLabel('Title').fill('Never mind either');
	await page.mouse.click(4, 4);
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();

	await page.reload();
	await expect(todoRows(page.getByRole('main'))).toHaveCount(0);
});
