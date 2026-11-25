import type { Page } from '@playwright/test';
import { expect, test, reset, seed, setClock, todoRow, type SeedInput } from './helpers';

const NOW = '2026-10-07T10:00:00Z';
const WEEK = '2026-10-05';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Edit todo' });
const form = (page: Page) => dialog(page).getByRole('form', { name: 'Edit todo' });

async function open(page: Page, title: string) {
	await todoRow(page, title).getByRole('button', { name: title, exact: true }).click();
	await expect(dialog(page)).toBeVisible();
}

const LINKS: SeedInput = {
	aspects: [
		{ name: 'IT', color: 'sky', icon: 'code' },
		{ name: 'Uni', color: 'lavender', icon: 'cap' },
		{ name: 'Health', color: 'sage', icon: 'heart' }
	],
	itAspect: 0,
	uniAspect: 1,
	projects: [{ name: 'Life Manager', status: 'active' }],
	semesters: [{ name: 'WS 26/27' }, { name: 'WS 25/26', archivedAt: '2026-03-01' }],
	classes: [
		{ semester: 0, name: 'Analysis II' },
		{ semester: 1, name: 'Old Algebra' }
	],
	sprint: { state: 'active', weekStart: WEEK }
};

test('Scenario: Editor shows every field and saves', async ({ page, request }) => {
	await seed(request, { ...LINKS, todos: [{ title: 'Ship the editor', aspect: 0, inSprint: true }] });
	await page.goto('/sprint?view=aspect');

	await open(page, 'Ship the editor');
	const f = form(page);
	for (const name of ['Title', 'Aspect', 'Priority', 'Due date', 'Status', 'Planned', 'Description', 'Project']) {
		await expect(f.getByLabel(name, { exact: true })).toBeVisible();
	}
	await expect(dialog(page).getByRole('heading', { name: 'Checklist' })).toBeVisible();

	await f.getByLabel('Priority').selectOption({ label: 'Priority 2' });
	await f.getByLabel('Due date', { exact: true }).fill('2026-10-09');
	await f.getByLabel('Status', { exact: true }).selectOption({ label: 'Doing' });
	await f.getByLabel('Planned', { exact: true }).fill('2026-10-08');
	await f.getByLabel('From').fill('18:00');
	await f.getByLabel('To').fill('19:30');
	await f.getByLabel('Description').fill('Cover the **sheet** and its footer.');
	await f.getByLabel('Project').selectOption({ label: 'Life Manager' });
	await dialog(page).getByLabel('New checklist item').fill('Write the tests');
	await dialog(page).getByLabel('New checklist item').press('Enter');
	await expect(dialog(page).getByLabel('Checklist item 1')).toHaveValue('Write the tests');
	await dialog(page).getByRole('button', { name: 'Save' }).click();
	await expect(dialog(page)).toBeHidden();

	await page.reload();
	await open(page, 'Ship the editor');
	const again = form(page);
	await expect(again.getByLabel('Priority')).toHaveValue('2');
	await expect(again.getByLabel('Due date', { exact: true })).toHaveValue('2026-10-09');
	await expect(again.getByLabel('Status', { exact: true })).toHaveValue('doing');
	await expect(again.getByLabel('Planned', { exact: true })).toHaveValue('2026-10-08');
	await expect(again.getByLabel('From')).toHaveValue('18:00');
	await expect(again.getByLabel('To')).toHaveValue('19:30');
	await expect(again.getByLabel('Description')).toHaveValue('Cover the **sheet** and its footer.');
	await expect(again.getByLabel('Project')).not.toHaveValue('');
	await expect(dialog(page).getByLabel('Checklist item 1')).toHaveValue('Write the tests');
});

test('Scenario: Link fields follow the aspect', async ({ page, request }) => {
	await seed(request, { ...LINKS, todos: [{ title: 'Plan the trip', aspect: 2 }] });
	await page.goto('/backlog');
	await open(page, 'Plan the trip');
	const f = form(page);

	await expect(f.getByLabel('Project')).toHaveCount(0);
	await expect(f.getByLabel('Class')).toHaveCount(0);
	await expect(f.getByRole('group', { name: 'Type' })).toHaveCount(0);

	await f.getByLabel('Aspect').selectOption({ label: 'IT' });
	await expect(f.getByLabel('Project')).toBeVisible();
	await expect(f.getByLabel('Class')).toHaveCount(0);
	await expect(f.getByRole('group', { name: 'Type' })).toHaveCount(0);

	await f.getByLabel('Aspect').selectOption({ label: 'Uni' });
	await expect(f.getByLabel('Project')).toHaveCount(0);
	await expect(f.getByLabel('Class')).toBeVisible();
	await f.getByLabel('Class').selectOption({ label: 'Analysis II' });
	await expect(f.getByRole('group', { name: 'Type' })).toBeVisible();
});

test('Scenario: Long title and notes wrap in the editor', async ({ page, request }) => {
	const title = `${'Prepare the quarterly planning notes '.repeat(5)}${'x'.repeat(60)}`.slice(0, 200);
	const notes = `${'A long line of notes without any hurry. '.repeat(90)}${'unbroken'.repeat(8)}`.slice(0, 4000);
	await seed(request, { ...LINKS, todos: [{ title, aspect: 2, notes }] });
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/backlog');
	await todoRow(page, title).getByRole('button', { name: title, exact: true }).click();
	await expect(dialog(page)).toBeVisible();
	await page.waitForTimeout(400);

	const f = form(page);
	await expect(f.getByLabel('Title')).toHaveValue(title);
	await expect(f.getByLabel('Description')).toHaveValue(notes);
	const fits = await dialog(page).evaluate((d) => {
		const box = d.getBoundingClientRect();
		const fieldsFit = [...d.querySelectorAll('textarea, input, select')].every((el) => el.getBoundingClientRect().right <= box.right + 1);
		return { fieldsFit, noSideScroll: document.documentElement.scrollWidth <= innerWidth, bodyFits: d.querySelector('.body')!.scrollWidth <= d.querySelector('.body')!.clientWidth + 1 };
	});
	expect(fits).toEqual({ fieldsFit: true, noSideScroll: true, bodyFits: true });
	// The title shows in full as wrapped lines, not one cut line.
	const wrapped = await f.getByLabel('Title').evaluate((el) => (el as HTMLTextAreaElement).clientHeight >= (el as HTMLTextAreaElement).scrollHeight - 1);
	expect(wrapped).toBe(true);
	await expect(dialog(page).getByRole('button', { name: 'Save' })).toBeInViewport();
	await f.getByLabel('Description').evaluate((el) => (el.scrollTop = el.scrollHeight));
	await expect(dialog(page).getByRole('button', { name: 'Save' })).toBeInViewport();
});

test('Scenario: Delete asks first', async ({ page, request }) => {
	await seed(request, { ...LINKS, todos: [{ title: 'Clean the fridge', aspect: 2 }] });
	await page.goto('/backlog');

	await open(page, 'Clean the fridge');
	await dialog(page).getByRole('button', { name: 'Delete todo' }).click();
	const confirm = page.getByRole('dialog', { name: 'Delete this todo?' });
	await expect(confirm).toBeVisible();
	await expect(confirm.getByRole('button', { name: 'Delete todo' })).toBeVisible();
	await confirm.getByRole('button', { name: 'Cancel' }).click();
	await expect(confirm).toBeHidden();
	await page.reload();
	await expect(todoRow(page, 'Clean the fridge')).toBeVisible();

	await open(page, 'Clean the fridge');
	await dialog(page).getByRole('button', { name: 'Delete todo' }).click();
	await confirm.getByRole('button', { name: 'Delete todo' }).click();
	await expect(todoRow(page, 'Clean the fridge')).toHaveCount(0);
});

test('Scenario: Archived class todo opens read-only', async ({ page, request }) => {
	await seed(request, { ...LINKS, todos: [{ title: 'Old sheet', aspect: 1, class: 1, inSprint: true }] });
	await page.goto('/sprint?view=aspect');

	await open(page, 'Old sheet');
	const d = dialog(page);
	await expect(d.getByLabel('Title')).toHaveValue('Old sheet');
	expect(await d.locator('input:not([readonly]):not([disabled]):not([type=hidden]), textarea:not([readonly]), select:not([disabled])').count()).toBe(0);
	await expect(d.getByRole('button', { name: 'Delete todo' })).toHaveCount(0);
	await expect(d.getByRole('button', { name: 'Save' })).toHaveCount(0);
	await d.getByRole('button', { name: 'Close' }).click();
	await expect(d).toBeHidden();
});
