import { expect, test, type Page } from '@playwright/test';
import { reset, seed, setClock } from './helpers';

// Wednesday 7 October 2026, midday in Berlin.
const NOW = '2026-10-07T10:00:00Z';

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await setClock(request, NOW);
	await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

async function quickAdd(page: Page, fields: { title: string; aspect?: string; due?: string }) {
	await page.getByRole('button', { name: 'Add a todo' }).first().click();
	const form = page.getByRole('form', { name: 'New todo' });
	await form.getByLabel('Title').fill(fields.title);
	if (fields.aspect) await form.getByLabel('Aspect').selectOption({ label: fields.aspect });
	if (fields.due) await form.getByLabel('Due date', { exact: true }).fill(fields.due);
	await form.getByRole('button', { name: 'Add todo' }).click();
}

const row = (page: Page, title: string) => page.getByTestId('todo-row').filter({ hasText: title });

test('GET /todos redirects to the backlog', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/todos');
	await expect(page).toHaveURL(/\/backlog$/);
});

test('Scenario: Quick add creates a todo in the backlog', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [
			{ name: 'Health', color: 'sage', icon: 'heart' },
			{ name: 'Uni', color: 'lavender', icon: 'cap' }
		]
	});
	await page.goto('/backlog');

	await quickAdd(page, { title: 'Read chapter 4', aspect: 'Uni' });

	const group = page.getByTestId(`aspect-group-${aspects[1]}`);
	await expect(group.getByTestId('todo-row').filter({ hasText: 'Read chapter 4' })).toBeVisible();
	await expect(page.getByTestId(`aspect-group-${aspects[0]}`)).toHaveCount(0);

	await page.reload();
	await expect(group.getByTestId('todo-row').filter({ hasText: 'Read chapter 4' })).toBeVisible();
});

test('Quick add rejects an empty title inline', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/backlog');

	await quickAdd(page, { title: '   ' });

	await expect(page.getByRole('form', { name: 'New todo' }).getByText('Give the todo a title.')).toBeVisible();
	await expect(page.getByTestId('todo-row')).toHaveCount(0);
});

test('Scenario: Past due date is allowed and shown overdue', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Finance', color: 'lagoon', icon: 'wallet' }] });
	await page.goto('/backlog');

	await quickAdd(page, { title: 'Send tax receipts', due: '2026-10-05' });

	const created = row(page, 'Send tax receipts');
	await expect(created).toHaveAttribute('data-overdue', 'true');
	await expect(created.getByText('2d late')).toBeVisible();
});

test('Quick add on phone opens a sheet', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/backlog');

	await quickAdd(page, { title: 'Book a physio appointment' });

	await expect(row(page, 'Book a physio appointment')).toBeVisible();
	await expect(page.getByRole('form', { name: 'New todo' })).toBeHidden();
});

const editor = (page: Page) => page.getByRole('form', { name: 'Edit todo' });

async function openTodo(page: Page, title: string) {
	await row(page, title).getByRole('button', { name: title, exact: true }).click();
	await expect(editor(page)).toBeVisible();
}

test('Scenario: Edit every field of a todo', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [
			{ name: 'Health', color: 'sage', icon: 'heart' },
			{ name: 'Uni', color: 'lavender', icon: 'cap' }
		],
		todos: [{ title: 'Book physio', aspect: 0 }]
	});
	await page.goto('/backlog');

	await openTodo(page, 'Book physio');
	const form = editor(page);
	await form.getByLabel('Title').fill('Book a physio appointment');
	await form.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await form.getByLabel('Notes').fill('Ask about the knee');
	await form.getByLabel('Priority').selectOption({ label: 'Priority 1' });
	await form.getByLabel('Due date', { exact: true }).fill('2026-10-09');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toBeHidden();

	const edited = page.getByTestId(`aspect-group-${aspects[1]}`).getByTestId('todo-row');
	await expect(edited).toContainText('Book a physio appointment');
	await expect(edited.getByRole('img', { name: 'Priority 1' })).toBeVisible();
	await expect(edited).toContainText('2d left');
	await expect(page.getByTestId(`aspect-group-${aspects[0]}`)).toHaveCount(0);

	await page.reload();
	await openTodo(page, 'Book a physio appointment');
	await expect(form.getByLabel('Title')).toHaveValue('Book a physio appointment');
	await expect(form.getByLabel('Aspect')).toHaveValue(String(aspects[1]));
	await expect(form.getByLabel('Notes')).toHaveValue('Ask about the knee');
	await expect(form.getByLabel('Priority')).toHaveValue('1');
	await expect(form.getByLabel('Due date', { exact: true })).toHaveValue('2026-10-09');
});

test('Scenario: Checklist items are added, renamed, toggled and deleted', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Uni' }], todos: [{ title: 'Read chapter 4' }] });
	await page.goto('/backlog');
	await openTodo(page, 'Read chapter 4');
	const checklist = page.getByRole('list', { name: 'Checklist' });
	const newItem = page.getByLabel('New checklist item');

	await newItem.fill('Section 4.1');
	await newItem.press('Enter');
	await expect(checklist.getByRole('listitem')).toHaveCount(1);
	await newItem.fill('Section 4.2');
	await newItem.press('Enter');
	await expect(checklist.getByRole('listitem')).toHaveCount(2);

	const first = checklist.getByLabel('Checklist item 1');
	await first.fill('Section 4.1 and exercises');
	await first.press('Enter');
	await expect(first).toHaveValue('Section 4.1 and exercises');

	const second = checklist.getByRole('listitem').nth(1);
	await second.getByRole('checkbox').click();
	await expect(second.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
	await second.getByRole('checkbox').click();
	await expect(second.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');

	await checklist.getByRole('listitem').first().getByRole('button', { name: /^Delete item/ }).click();
	await expect(checklist.getByRole('listitem')).toHaveCount(1);

	await page.reload();
	await expect(row(page, 'Read chapter 4')).toContainText('0/1');
	await openTodo(page, 'Read chapter 4');
	await expect(checklist.getByRole('listitem')).toHaveCount(1);
	await expect(checklist.getByLabel('Checklist item 1')).toHaveValue('Section 4.2');
	await expect(checklist.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
});

test('Scenario: Deleting a todo asks for confirmation', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Home' }], todos: [{ title: 'Clean the fridge' }] });
	await page.goto('/backlog');

	await openTodo(page, 'Clean the fridge');
	await page.getByRole('button', { name: 'Delete', exact: true }).click();
	const confirm = page.getByRole('dialog', { name: 'Delete this todo?' });
	await expect(confirm).toBeVisible();
	await confirm.getByRole('button', { name: 'Cancel' }).click();
	await expect(confirm).toBeHidden();
	await page.reload();
	await expect(row(page, 'Clean the fridge')).toBeVisible();

	await openTodo(page, 'Clean the fridge');
	await page.getByRole('button', { name: 'Delete', exact: true }).click();
	await confirm.getByRole('button', { name: 'Delete todo' }).click();
	await expect(row(page, 'Clean the fridge')).toHaveCount(0);
	await page.reload();
	await expect(row(page, 'Clean the fridge')).toHaveCount(0);
});

test('Editing on phone uses a sheet', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Home' }], todos: [{ title: 'Clean the fridge' }] });
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/backlog');

	await openTodo(page, 'Clean the fridge');
	await expect(page.getByRole('dialog', { name: 'Edit todo' })).toBeVisible();
	await editor(page).getByLabel('Title').fill('Clean the fridge and freezer');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(row(page, 'Clean the fridge and freezer')).toBeVisible();
});
