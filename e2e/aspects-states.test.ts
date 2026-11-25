import type { Page } from '@playwright/test';
import { ASPECT_COLORS, ASPECT_ICONS, type AspectColor } from '../src/lib/aspect-style';
import { expect, test, reset, seed, setClock, openNewTodo, todoRow, todoRows } from './helpers';

const aspectRow = (page: Page, name: string) => page.getByRole('main').getByRole('listitem', { name, exact: true });
const rowNames = (page: Page) => page.getByRole('main').getByRole('listitem', { name: /\S/ }).evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
const trigger = (page: Page, name: string) => aspectRow(page, name).getByRole('button', { name: `Actions for ${name}` });
const reordered = (page: Page) => page.waitForResponse((r) => r.url().includes('?/reorder') && r.request().method() === 'POST');

async function openMenu(page: Page, name: string) {
	await trigger(page, name).click();
	return page.getByRole('menu', { name: `Actions for ${name}` });
}

async function openDelete(page: Page, name: string) {
	await (await openMenu(page, name)).getByRole('menuitem', { name: 'Delete' }).click();
	return page.getByRole('dialog', { name: `Delete ${name}?` });
}

test.beforeEach(async ({ request }) => {
	await reset(request);
});

const THREE = { aspects: [{ name: 'Health' }, { name: 'Uni' }, { name: 'Job' }] };

test('Scenario: Move up and Move down reorder the aspects', async ({ page, request }) => {
	await seed(request, THREE);
	await page.goto('/aspects');
	await expect.poll(() => rowNames(page)).toEqual(['Health', 'Uni', 'Job']);

	await trigger(page, 'Job').focus();
	await page.keyboard.press('Enter');
	const moveUp = page.getByRole('menuitem', { name: 'Move up' });
	await expect(moveUp).toBeFocused();
	const saved = reordered(page);
	await page.keyboard.press('Enter');
	await saved;

	await expect.poll(() => rowNames(page)).toEqual(['Health', 'Job', 'Uni']);
	await expect(trigger(page, 'Job')).toBeFocused();

	await page.reload();
	await expect.poll(() => rowNames(page)).toEqual(['Health', 'Job', 'Uni']);

	await trigger(page, 'Health').focus();
	await page.keyboard.press('Enter');
	// Health is first, so the menu opens on its first enabled item.
	await expect(page.getByRole('menuitem', { name: 'Move down' })).toBeFocused();
	const again = reordered(page);
	await page.keyboard.press('Enter');
	await again;
	await expect.poll(() => rowNames(page)).toEqual(['Job', 'Health', 'Uni']);
	await expect(trigger(page, 'Health')).toBeFocused();
});

test('Scenario: Ends of the list disable the moves', async ({ page, request }) => {
	await seed(request, THREE);
	await page.goto('/aspects');

	let menu = await openMenu(page, 'Health');
	await expect(menu.getByRole('menuitem', { name: 'Move up' })).toBeDisabled();
	await expect(menu.getByRole('menuitem', { name: 'Move down' })).toBeEnabled();
	await page.keyboard.press('Escape');

	menu = await openMenu(page, 'Job');
	await expect(menu.getByRole('menuitem', { name: 'Move down' })).toBeDisabled();
	await expect(menu.getByRole('menuitem', { name: 'Move up' })).toBeEnabled();
	await page.keyboard.press('Escape');

	menu = await openMenu(page, 'Uni');
	await expect(menu.getByRole('menuitem', { name: 'Move up' })).toBeEnabled();
	await expect(menu.getByRole('menuitem', { name: 'Move down' })).toBeEnabled();
});

test('Scenario: Reorder by drag on desktop', async ({ page, request }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await seed(request, THREE);
	await page.goto('/aspects');

	const handle = aspectRow(page, 'Job').getByTestId('aspect-handle');
	await expect(handle).toBeVisible();
	const saved = reordered(page);
	await handle.dragTo(aspectRow(page, 'Health'), { targetPosition: { x: 120, y: 6 } });
	await saved;
	await expect.poll(() => rowNames(page)).toEqual(['Job', 'Health', 'Uni']);

	await page.reload();
	await expect.poll(() => rowNames(page)).toEqual(['Job', 'Health', 'Uni']);
});

test('the drag handle is not drawn on a phone', async ({ page, request }) => {
	await page.setViewportSize({ width: 375, height: 800 });
	await seed(request, THREE);
	await page.goto('/aspects');
	await expect(aspectRow(page, 'Job').getByTestId('aspect-handle')).toBeHidden();
});

test('Scenario: Delete with a move target', async ({ page, request }) => {
	await seed(request, {
		...THREE,
		todos: [{ title: 'Read one', aspect: 1 }, { title: 'Read two', aspect: 1 }, { title: 'Read three', aspect: 1 }, { title: 'Send invoice', aspect: 2 }]
	});
	await page.goto('/aspects');

	const dialog = await openDelete(page, 'Uni');
	await expect(dialog).toContainText('Uni has 3 todos.');
	const receiver = dialog.getByLabel('Move them to');
	await expect(receiver).toHaveValue('');

	await dialog.getByRole('button', { name: 'Move 3 and delete' }).click();
	await expect(dialog.getByRole('alert')).toHaveText('Pick the aspect that receives them.');
	await expect(receiver).toHaveValue('');

	await receiver.selectOption({ label: 'Job' });
	await dialog.getByRole('button', { name: 'Move 3 and delete' }).click();

	await expect(dialog).toBeHidden();
	await expect(aspectRow(page, 'Uni')).toHaveCount(0);
	await expect(aspectRow(page, 'Job')).toContainText('4 todos');
	await page.goto('/backlog');
	await expect(todoRows(page.getByRole('region', { name: /^Job\b/ }))).toHaveCount(4);
});

test('the delete count names todos only and the recurring rule gets its own sentence', async ({ page, request }) => {
	await seed(request, {
		...THREE,
		todos: [{ title: 'Read one', aspect: 1 }, { title: 'Read two', aspect: 1 }],
		rules: [{ title: 'Weekly reading', aspect: 1, weekdays: [1] }]
	});
	await page.goto('/aspects');

	const dialog = await openDelete(page, 'Uni');
	await expect(dialog).toContainText('Uni has 2 todos. Which aspect should they move to? Its 1 recurring rule moves with them.');
	await expect(dialog.getByRole('button', { name: 'Move 2 and delete' })).toBeVisible();
	await expect(aspectRow(page, 'Uni')).toContainText('2 todos');
});

test('Scenario: Delete an empty aspect needs no target', async ({ page, request }) => {
	await seed(request, THREE);
	await page.goto('/aspects');

	const dialog = await openDelete(page, 'Uni');
	await expect(dialog).toContainText('Uni has no todos or recurring rules.');
	await expect(dialog.getByLabel('Move them to')).toHaveCount(0);
	await dialog.getByRole('button', { name: 'Delete aspect' }).click();

	await expect(dialog).toBeHidden();
	await expect.poll(() => rowNames(page)).toEqual(['Health', 'Job']);
});

test('Scenario: Deleting the last empty aspect goes to welcome', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/aspects');

	const dialog = await openDelete(page, 'Health');
	await dialog.getByRole('button', { name: 'Delete aspect' }).click();

	await expect(page).toHaveURL(/\/welcome$/);
});

test('the only aspect with todos has Delete disabled', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }], todos: [{ title: 'Run' }] });
	await page.goto('/aspects');

	const menu = await openMenu(page, 'Health');
	await expect(menu.getByRole('menuitem', { name: 'Move up' })).toBeDisabled();
	await expect(menu.getByRole('menuitem', { name: 'Move down' })).toBeDisabled();
	await expect(menu.getByRole('menuitem', { name: 'Delete' })).toBeDisabled();
});

test('Scenario: Stored aspect colours render without a data change', async ({ page, request }) => {
	const colors = Object.keys(ASPECT_COLORS) as AspectColor[];
	await seed(request, { aspects: colors.map((color) => ({ name: ASPECT_COLORS[color].label, color })) });
	await page.goto('/aspects');

	for (const color of colors) {
		const expected = await page.evaluate((c) => {
			const probe = document.createElement('span');
			probe.style.background = `var(--aspect-${c})`;
			document.body.append(probe);
			const value = getComputedStyle(probe).backgroundColor;
			probe.remove();
			return value;
		}, color);
		expect(expected).not.toBe('rgba(0, 0, 0, 0)');
		await expect(aspectRow(page, ASPECT_COLORS[color].label).locator('[data-color]')).toHaveCSS('background-color', expected);
	}
});

test('the colour and icon pickers draw every colour and icon as a 44 px target', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.setViewportSize({ width: 375, height: 800 });
	await page.goto('/aspects');

	const colorCount = Object.keys(ASPECT_COLORS).length;
	const iconCount = Object.keys(ASPECT_ICONS).length;
	expect(colorCount).toBe(8);

	await page.getByRole('button', { name: 'New aspect' }).click();
	const sheet = page.getByRole('dialog', { name: 'New aspect' });
	await expect(sheet.getByRole('radio')).toHaveCount(colorCount + iconCount);
	for (const radio of await sheet.getByRole('radio').all()) {
		const box = (await radio.locator('xpath=..').boundingBox())!;
		expect(box.width).toBeGreaterThanOrEqual(43.5);
		expect(box.height).toBeGreaterThanOrEqual(43.5);
	}
	await expect(sheet.locator('label:has(input[type=radio]) svg path')).toHaveCount(colorCount + iconCount);
});

// Wednesday 7 October 2026 in Berlin; the active sprint runs Monday 5 to Sunday 11 October.
test.describe('aspect page', () => {
	test.beforeEach(async ({ request }) => {
		await setClock(request, '2026-10-07T10:00:00Z');
	});

	test.afterAll(async ({ request }) => {
		await setClock(request, null);
	});

	test('Scenario: Aspect page lists its todos and pre-fills the quick add', async ({ page, request }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		const ids = await seed(request, {
			aspects: [{ name: 'Health' }, { name: 'Uni' }],
			sprint: { state: 'active', weekStart: '2026-10-05' },
			todos: [{ title: 'Stretch for ten minutes', inSprint: true }, { title: 'Buy running shoes' }, { title: 'Submit lab report', aspect: 1 }]
		});
		await page.goto(`/aspects/${ids.aspects[0]}`);

		const sprint = page.getByRole('region', { name: /^This sprint\b/ });
		const backlog = page.getByRole('region', { name: /^Backlog\b/ });
		await expect(todoRow(sprint, 'Stretch for ten minutes')).toBeVisible();
		await expect(todoRow(backlog, 'Buy running shoes')).toBeVisible();
		await expect(page.getByText('Submit lab report')).toHaveCount(0);

		const dialog = await openNewTodo(page);
		await expect(dialog.getByLabel('Aspect')).toHaveValue(String(ids.aspects[0]));
		await expect(dialog.getByLabel('Aspect').locator('option:checked')).toHaveText('Health');
	});

	test('Scenario: Empty aspect page', async ({ page, request }) => {
		const ids = await seed(request, { aspects: [{ name: 'Health' }, { name: 'Garden' }], todos: [{ title: 'Run' }] });
		await page.goto(`/aspects/${ids.aspects[1]}`);

		await expect(page.getByRole('heading', { level: 2, name: 'Nothing in Garden yet' })).toBeVisible();
		await expect(page.getByText('Add a todo to start.', { exact: true })).toBeVisible();
		await page.getByRole('main').getByRole('button', { name: 'Add a todo' }).click();
		await expect(page.getByRole('dialog', { name: 'New todo' })).toBeVisible();
	});

	test('a long list folds per group: ten rows and Show all', async ({ page, request }) => {
		const ids = await seed(request, {
			aspects: [{ name: 'Health' }],
			todos: Array.from({ length: 24 }, (_, i) => ({ title: `Backlog item ${i + 1}` }))
		});
		await page.goto(`/aspects/${ids.aspects[0]}`);

		const backlog = page.getByRole('region', { name: /^Backlog\b/ });
		await expect(todoRows(backlog)).toHaveCount(10);
		await backlog.getByRole('button', { name: 'Show all 24' }).click();
		await expect(todoRows(backlog)).toHaveCount(24);
		await backlog.getByRole('button', { name: 'Show fewer' }).click();
		await expect(todoRows(backlog)).toHaveCount(10);
	});

	test('the Details card is hidden on phones, stacked above the lists at 768 and a right column from 1280', async ({ page, request }) => {
		const ids = await seed(request, { aspects: [{ name: 'Health' }], todos: [{ title: 'Run' }] });
		const details = page.getByRole('region', { name: 'Details' });

		await page.setViewportSize({ width: 375, height: 800 });
		await page.goto(`/aspects/${ids.aspects[0]}`);
		await expect(details).toBeHidden();

		await page.setViewportSize({ width: 768, height: 900 });
		await expect(details).toBeVisible();
		const main = (await page.getByRole('region', { name: /^Backlog\b/ }).boundingBox())!;
		const stacked = (await details.boundingBox())!;
		expect(stacked.y + stacked.height).toBeLessThanOrEqual(main.y + 1);
		expect(stacked.width).toBeLessThan(main.width / 2);

		await page.setViewportSize({ width: 1280, height: 900 });
		const side = (await details.boundingBox())!;
		const left = (await page.getByRole('region', { name: /^Backlog\b/ }).boundingBox())!;
		expect(side.x).toBeGreaterThanOrEqual(left.x + left.width - 1);
	});
});
