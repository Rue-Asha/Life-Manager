import type { Page } from '@playwright/test';
import { ASPECT_ICONS } from '../src/lib/aspect-style';
import { expect, test, reset, seed, setClock } from './helpers';

function aspectRow(page: Page, name: string) {
	return page.getByRole('main').getByRole('listitem', { name, exact: true });
}

// An aspect's icon sits on a round chip in its colour (a fingerprint token); the chip is the one element of the row that carries data-color.
async function expectStyle(page: Page, name: string, color: string, icon: keyof typeof ASPECT_ICONS) {
	const chip = aspectRow(page, name).locator('[data-color]');
	const token = await page.evaluate((c) => {
		const probe = document.createElement('span');
		probe.style.background = `var(--aspect-${c})`;
		document.body.append(probe);
		const value = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return value;
	}, color);
	await expect(chip).toHaveCSS('background-color', token);
	await expect(chip.locator('path')).toHaveAttribute('d', ASPECT_ICONS[icon]);
}

const aspectCards = (page: Page) => page.getByRole('main').getByRole('listitem', { name: /\S/ });

// The aspects sit in the top bar's More menu, one item each.
async function sidebarAspects(page: Page) {
	await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: /^More/ }).click();
	return page.getByRole('menu', { name: 'More' }).getByRole('group', { name: 'Aspects' }).getByRole('menuitem');
}

async function openEdit(page: Page, name: string) {
	await aspectRow(page, name).getByRole('button', { name: `Actions for ${name}` }).click();
	await page.getByRole('menu', { name: `Actions for ${name}` }).getByRole('menuitem', { name: 'Edit' }).click();
	return page.getByRole('dialog', { name: 'Edit aspect' });
}

test.beforeEach(async ({ request }) => {
	await reset(request);
});

test('Scenario: Onboarding creates the chosen aspects', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/welcome');

	await page.getByRole('checkbox', { name: 'Health', exact: true }).check();
	await page.getByRole('checkbox', { name: 'Uni', exact: true }).check();
	await page.getByRole('button', { name: 'Add your own' }).click();
	await page.getByRole('textbox', { name: 'Name' }).fill('Music');
	await page.getByRole('radio', { name: 'Tangerine' }).check();
	await page.getByRole('radio', { name: 'Music' }).check();
	await page.getByRole('button', { name: 'Continue with 3 aspects' }).click();

	await expect(page).toHaveURL(/\/backlog$/);
	await page.goto('/');
	await expect(await sidebarAspects(page)).toHaveText(['Health', 'Uni', 'Music']);
});

test('Scenario: Create an aspect with colour and icon', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/aspects');

	await page.getByRole('button', { name: 'New aspect' }).click();
	const sheet = page.getByRole('dialog', { name: 'New aspect' });
	await sheet.getByRole('textbox', { name: 'Name' }).fill('Sport');
	await sheet.getByRole('radio', { name: 'Tangerine' }).check();
	await sheet.getByRole('radio', { name: 'Dumbbell' }).check();
	await sheet.getByRole('button', { name: 'Create aspect' }).click();

	await expect(sheet).toBeHidden();
	await expect(aspectRow(page, 'Sport')).toBeVisible();
	await expectStyle(page, 'Sport', 'tangerine', 'dumbbell');
});

test('Scenario: Edit an aspect', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }, { name: 'Sport', color: 'tangerine', icon: 'dumbbell' }] });
	await page.goto('/aspects');

	const sheet = await openEdit(page, 'Sport');
	await sheet.getByRole('textbox', { name: 'Name' }).fill('Fitness');
	await sheet.getByRole('radio', { name: 'Lagoon' }).check();
	await sheet.getByRole('radio', { name: 'Leaf' }).check();
	await sheet.getByRole('button', { name: 'Save' }).click();

	await expect(sheet).toBeHidden();
	await expectStyle(page, 'Fitness', 'lagoon', 'leaf');
	await expect(aspectRow(page, 'Sport')).toHaveCount(0);
	await expect(aspectCards(page)).toHaveCount(2);
});

test('Scenario: Empty aspect name is rejected inline', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/aspects');

	await page.getByRole('button', { name: 'New aspect' }).click();
	const sheet = page.getByRole('dialog', { name: 'New aspect' });
	const name = sheet.getByRole('textbox', { name: 'Name' });
	await name.fill('   ');
	await sheet.getByRole('button', { name: 'Create aspect' }).click();

	await expect(sheet).toBeVisible();
	await expect(name).toHaveAttribute('aria-invalid', 'true');
	await expect(name).toHaveAccessibleDescription('Give the aspect a name.');
	await page.reload();
	await expect(aspectCards(page)).toHaveCount(1);
});

test('renaming to an existing name is rejected inline', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }, { name: 'Sport' }] });
	await page.goto('/aspects');

	const sheet = await openEdit(page, 'Sport');
	await sheet.getByRole('textbox', { name: 'Name' }).fill('health');
	await sheet.getByRole('button', { name: 'Save' }).click();

	await expect(sheet.getByText('You already have an aspect with this name.')).toBeVisible();
});

test('aspect list shows each todo count', async ({ page, request }) => {
	await seed(request, {
		aspects: [{ name: 'Health' }, { name: 'Uni' }],
		todos: [{ title: 'Run', aspect: 0 }, { title: 'Swim', aspect: 0 }]
	});
	await page.goto('/aspects');

	await expect(aspectRow(page, 'Health')).toContainText('2 todos');
	await expect(aspectRow(page, 'Uni')).toContainText('No todos');
});

async function openDelete(page: Page, name: string) {
	await (await openEdit(page, name)).getByRole('button', { name: 'Delete aspect' }).click();
	return page.getByRole('dialog', { name: `Delete ${name}?` });
}

test('Scenario: Delete confirmation asks for a target aspect', async ({ page, request }) => {
	await seed(request, {
		aspects: [{ name: 'Health' }, { name: 'Uni' }, { name: 'Job' }],
		todos: [{ title: 'Run', aspect: 0 }, { title: 'Swim', aspect: 0 }]
	});
	await page.goto('/aspects');

	const dialog = await openDelete(page, 'Health');
	await expect(dialog.getByLabel('Move them to').getByRole('option')).toHaveText(['Choose an aspect', 'Uni', 'Job']);
	await dialog.getByLabel('Move them to').selectOption({ label: 'Uni' });
	await dialog.getByRole('button', { name: 'Move 2 and delete' }).click();

	await expect(dialog).toBeHidden();
	await expect(aspectRow(page, 'Health')).toHaveCount(0);
	await expect(aspectRow(page, 'Uni')).toContainText('2 todos');
	await expect(aspectRow(page, 'Job')).toContainText('No todos');
});

test('Scenario: Aspect without todos is deleted with a simple confirm', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }, { name: 'Uni' }] });
	await page.goto('/aspects');

	const dialog = await openDelete(page, 'Uni');
	await expect(dialog.getByLabel('Move them to')).toHaveCount(0);
	await dialog.getByRole('button', { name: 'Delete aspect' }).click();

	await expect(dialog).toBeHidden();
	await expect(aspectRow(page, 'Uni')).toHaveCount(0);
	await expect(aspectCards(page)).toHaveCount(1);
});

test('Scenario: Only aspect with todos cannot be deleted', async ({ page, request, baseURL }) => {
	const ids = await seed(request, { aspects: [{ name: 'Health' }], todos: [{ title: 'Run' }] });
	await page.goto('/aspects');

	const sheet = await openEdit(page, 'Health');
	const remove = sheet.getByRole('button', { name: 'Delete aspect' });
	await expect(remove).toBeDisabled();
	await expect(remove).toHaveAccessibleDescription(/only aspect/);

	const response = await request.post('/aspects?/delete', {
		form: { id: String(ids.aspects[0]) },
		headers: { origin: baseURL!, 'x-sveltekit-action': 'true' }
	});
	expect(await response.text()).toContain('only-aspect-in-use');
	await page.reload();
	await expect(aspectRow(page, 'Health')).toHaveCount(1);
});

test('Scenario: Deleting the last aspect returns to first run', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }] });
	await page.goto('/aspects');

	const dialog = await openDelete(page, 'Health');
	await dialog.getByRole('button', { name: 'Delete aspect' }).click();

	await expect(page).toHaveURL(/\/welcome$/);
	await expect(page.getByRole('checkbox', { name: 'Health', exact: true })).toBeVisible();
});

test('Scenario: Menu and Aspects rows open the aspect page', async ({ page, request }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	const ids = await seed(request, { aspects: [{ name: 'Health' }, { name: 'Uni' }] });
	await page.goto('/');

	await (await sidebarAspects(page)).filter({ hasText: 'Uni' }).click();
	await expect(page).toHaveURL(new RegExp(`/aspects/${ids.aspects[1]}$`));
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Uni');

	await page.setViewportSize({ width: 375, height: 800 });
	await page.goto('/menu');
	await page.getByRole('main').getByRole('list', { name: 'Aspects' }).getByRole('link', { name: /^\s*Health/ }).click();
	await expect(page).toHaveURL(new RegExp(`/aspects/${ids.aspects[0]}$`));
	await page.setViewportSize({ width: 1280, height: 900 });

	await page.goto('/aspects');
	await aspectRow(page, 'Health').getByRole('link').click();
	await expect(page).toHaveURL(new RegExp(`/aspects/${ids.aspects[0]}$`));
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Health');
});

test.describe('aspect list', () => {
	// Wednesday 7 October 2026 in Berlin; the active sprint runs Monday 5 to Sunday 11 October.
	test.beforeEach(async ({ request }) => {
		await setClock(request, '2026-10-07T10:00:00Z');
	});

	test.afterAll(async ({ request }) => {
		await setClock(request, null);
	});

	const RUNNING = {
		aspects: [
			{ name: 'Health', color: 'sage' as const, icon: 'heart' as const },
			{ name: 'Uni', color: 'sky' as const, icon: 'cap' as const },
			{ name: 'Home', color: 'ochre' as const, icon: 'house' as const }
		],
		sprint: { state: 'active' as const, weekStart: '2026-10-05' },
		todos: [
			{ title: 'Book a physio appointment', aspect: 0, inSprint: true, status: 'done' as const },
			{ title: 'Stretch for ten minutes', aspect: 0, inSprint: true },
			{ title: 'Buy running shoes', aspect: 0 },
			{ title: 'Buy a yoga mat', aspect: 0 },
			{ title: 'Submit lab report', aspect: 1, inSprint: true },
			{ title: 'Clean the fridge', aspect: 2, inSprint: true, status: 'done' as const },
			{ title: 'Water the plants', aspect: 2 }
		]
	};

	test('Scenario: Aspects page is one list with counts from 768', async ({ page, request }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await seed(request, RUNNING);
		await page.goto('/aspects');

		const expected = [
			{ name: 'Health', icon: 'heart', count: '4 todos', line: '2 in backlog · 1 / 2 this sprint' },
			{ name: 'Uni', icon: 'cap', count: '1 todo', line: '0 in backlog · 0 / 1 this sprint' },
			{ name: 'Home', icon: 'house', count: '2 todos', line: '1 in backlog · 1 / 1 this sprint' }
		] as const;
		for (const row of expected) {
			const el = aspectRow(page, row.name);
			await expect(el).toBeVisible();
			await expect(el.locator('[data-color] path')).toHaveAttribute('d', ASPECT_ICONS[row.icon]);
			await expect(el.getByText(row.count, { exact: true })).toBeVisible();
			await expect(el.getByText(row.line, { exact: true })).toBeVisible();
		}
		const boxes = await Promise.all(['Health', 'Uni', 'Home'].map((name) => aspectRow(page, name).boundingBox()));
		for (const [i, box] of boxes.entries()) {
			expect(Math.abs(box!.x - boxes[0]!.x)).toBeLessThan(1);
			if (i > 0) expect(box!.y).toBeGreaterThanOrEqual(boxes[i - 1]!.y + boxes[i - 1]!.height - 1);
		}

		await page.setViewportSize({ width: 768, height: 900 });
		await expect(aspectRow(page, 'Uni').getByText('0 in backlog · 0 / 1 this sprint', { exact: true })).toBeVisible();
	});

	test('Scenario: Aspects page stays a list on phone', async ({ page, request }) => {
		await page.setViewportSize({ width: 375, height: 800 });
		await seed(request, RUNNING);
		await page.goto('/aspects');

		const boxes = await Promise.all(['Health', 'Uni', 'Home'].map((name) => aspectRow(page, name).boundingBox()));
		const list = (await page.getByRole('main').getByRole('listitem', { name: 'Health', exact: true }).locator('xpath=..').boundingBox())!;
		for (const [i, box] of boxes.entries()) {
			expect(box!.width).toBeGreaterThan(list.width - 2 * 16 - 1);
			if (i > 0) expect(box!.y).toBeGreaterThanOrEqual(boxes[i - 1]!.y + boxes[i - 1]!.height - 1);
		}
		await expect(aspectRow(page, 'Health')).toContainText('4 todos');
		await expect(aspectRow(page, 'Health').getByText('2 in backlog · 1 / 2 this sprint', { exact: true })).toBeVisible();
	});

	test('Scenario: Single aspect is one row', async ({ page, request }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await seed(request, { aspects: [{ name: 'Health' }] });
		await page.goto('/aspects');

		const rows = aspectCards(page);
		await expect(rows).toHaveCount(1);
		const row = (await rows.boundingBox())!;
		const list = (await rows.locator('xpath=..').boundingBox())!;
		expect(Math.abs(row.x - list.x)).toBeLessThan(list.width * 0.05);
		expect(row.width).toBeGreaterThan(list.width * 0.9);
	});

	test('Scenario: Row menu holds the moves, edit and delete', async ({ page, request }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await seed(request, RUNNING);
		await page.goto('/aspects');

		await aspectRow(page, 'Uni').getByRole('button', { name: 'Actions for Uni' }).click();
		const menu = page.getByRole('menu', { name: 'Actions for Uni' });
		await expect(menu.getByRole('menuitem')).toHaveText(['Move up', 'Move down', 'Edit', 'Delete']);
		await menu.getByRole('menuitem', { name: 'Edit' }).click();

		const sheet = page.getByRole('dialog', { name: 'Edit aspect' });
		await expect(sheet.getByRole('textbox', { name: 'Name' })).toHaveValue('Uni');
		await expect(sheet.getByRole('radio', { name: 'Sky' })).toBeChecked();
	});

	test('Key facts show the real counts', async ({ page, request }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await seed(request, RUNNING);
		await page.goto('/aspects');

		const facts = page.getByRole('list', { name: 'Your aspects' });
		await expect(facts.getByRole('listitem')).toHaveText([/Your aspects/, /^3\s*aspects$/, /^7\s*todos$/, /^4\s*in this sprint$/]);
	});
});
