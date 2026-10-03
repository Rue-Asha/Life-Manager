import { expect, test, type Page } from '@playwright/test';
import { ASPECT_ICONS, PRESET_ASPECTS } from '../src/lib/aspect-style';
import { reset, seed, setClock } from './helpers';

function aspectRow(page: Page, name: string) {
	return page.getByTestId('aspect-card').filter({ has: page.getByText(name, { exact: true }) });
}

async function expectStyle(page: Page, name: string, color: string, icon: keyof typeof ASPECT_ICONS) {
	const svg = aspectRow(page, name).locator('svg').first();
	await expect(svg).toHaveAttribute('style', new RegExp(`--aspect-${color}\\)`));
	await expect(svg.locator('path')).toHaveAttribute('d', ASPECT_ICONS[icon]);
}

function sidebarAspects(page: Page) {
	return page.getByRole('navigation', { name: 'Main' }).locator('a[href^="/aspects/"]');
}

async function openEdit(page: Page, name: string) {
	await aspectRow(page, name).getByRole('button', { name: `Actions for ${name}` }).click();
	await page.getByRole('menu').getByRole('menuitem', { name: 'Edit' }).click();
	return page.getByRole('dialog', { name: 'Edit aspect' });
}

test.beforeEach(async ({ request }) => {
	await reset(request);
});

test('Scenario: First run shows onboarding', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveURL(/\/welcome$/);

	for (const preset of PRESET_ASPECTS) {
		const toggle = page.getByRole('checkbox', { name: preset.name, exact: true });
		await expect(toggle).toBeVisible();
		await expect(toggle).not.toBeChecked();
		const icon = page.locator('label', { has: toggle }).locator('svg').first();
		await expect(icon).toHaveAttribute('style', new RegExp(`--aspect-${preset.color}\\)`));
		await expect(icon.locator('path')).toHaveAttribute('d', ASPECT_ICONS[preset.icon]);
	}
	await expect(page.getByRole('button', { name: 'Add your own' })).toBeVisible();
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
	await expect(sidebarAspects(page)).toHaveText(['Health', 'Uni', 'Music']);
});

test('onboarding needs at least one aspect', async ({ page }) => {
	await page.goto('/welcome');
	await expect(page.getByRole('button', { name: /^Continue/ })).toBeDisabled();
});

test('onboarding rejects an empty custom name inline', async ({ page }) => {
	await page.goto('/welcome');
	await page.getByRole('button', { name: 'Add your own' }).click();
	await page.getByRole('textbox', { name: 'Name' }).fill('   ');
	await page.getByRole('button', { name: 'Continue with 1 aspect' }).click();

	await expect(page.getByText('Give the aspect a name.')).toBeVisible();
	await expect(page).toHaveURL(/\/welcome$/);
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
	await expect(page.getByTestId('aspect-card')).toHaveCount(2);
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
	await expect(page.getByTestId('aspect-card')).toHaveCount(1);
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
	await expect(dialog.getByRole('radio')).toHaveCount(2);
	await dialog.getByRole('radio', { name: 'Uni' }).check();
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
	await expect(dialog.getByRole('radio')).toHaveCount(0);
	await dialog.getByRole('button', { name: 'Delete aspect' }).click();

	await expect(dialog).toBeHidden();
	await expect(aspectRow(page, 'Uni')).toHaveCount(0);
	await expect(page.getByTestId('aspect-card')).toHaveCount(1);
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

test('Scenario: Sidebar and Aspects rows open the aspect page', async ({ page, request }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	const ids = await seed(request, { aspects: [{ name: 'Health' }, { name: 'Uni' }] });
	await page.goto('/');

	await sidebarAspects(page).filter({ hasText: 'Uni' }).click();
	await expect(page).toHaveURL(new RegExp(`/aspects/${ids.aspects[1]}$`));
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Uni');

	await page.goto('/aspects');
	await page.getByRole('main').getByRole('link', { name: 'Health', exact: true }).click();
	await expect(page).toHaveURL(new RegExp(`/aspects/${ids.aspects[0]}$`));
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Health');
});

test.describe('aspect cards', () => {
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

	test('Scenario: Aspects page shows cards at 1024 and wider', async ({ page, request }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await seed(request, RUNNING);
		await page.goto('/aspects');

		const expected = [
			{ name: 'Health', icon: 'heart', progress: '1 / 2', backlog: '2 in backlog' },
			{ name: 'Uni', icon: 'cap', progress: '0 / 1', backlog: '0 in backlog' },
			{ name: 'Home', icon: 'house', progress: '1 / 1', backlog: '1 in backlog' }
		] as const;
		for (const card of expected) {
			const el = aspectRow(page, card.name);
			await expect(el).toBeVisible();
			await expect(el.locator('svg path').first()).toHaveAttribute('d', ASPECT_ICONS[card.icon]);
			await expect(el.getByTestId('progress')).toContainText(card.progress);
			await expect(el.getByTestId('backlog-count')).toHaveText(card.backlog);
		}
		const [first, second] = await Promise.all(
			['Health', 'Uni'].map((name) => aspectRow(page, name).boundingBox())
		);
		expect(Math.abs(first!.y - second!.y)).toBeLessThan(1);
		expect(second!.x).toBeGreaterThan(first!.x + first!.width - 1);

		await page.setViewportSize({ width: 1024, height: 900 });
		const [a, b] = await Promise.all(['Health', 'Uni'].map((name) => aspectRow(page, name).boundingBox()));
		expect(Math.abs(a!.y - b!.y)).toBeLessThan(1);
	});

	test('Scenario: Aspects page stays a list on phone', async ({ page, request }) => {
		await page.setViewportSize({ width: 375, height: 800 });
		await seed(request, RUNNING);
		await page.goto('/aspects');

		const boxes = await Promise.all(
			['Health', 'Uni', 'Home'].map((name) => aspectRow(page, name).boundingBox())
		);
		const main = (await page.getByRole('main').boundingBox())!;
		for (const [i, box] of boxes.entries()) {
			expect(box!.width).toBeGreaterThan(main.width - 2 * 16 - 1);
			if (i > 0) expect(box!.y).toBeGreaterThanOrEqual(boxes[i - 1]!.y + boxes[i - 1]!.height - 1);
		}
	});

	test('Scenario: Single aspect is one left-aligned card', async ({ page, request }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await seed(request, { aspects: [{ name: 'Health' }] });
		await page.goto('/aspects');

		const cards = page.getByTestId('aspect-card');
		await expect(cards).toHaveCount(1);
		const card = (await cards.boundingBox())!;
		const title = (await page.getByRole('heading', { level: 1 }).boundingBox())!;
		expect(Math.abs(card.x - title.x)).toBeLessThan(1);
		expect(card.width).toBeLessThan(400);
	});

	test('Scenario: Card menu holds edit and delete', async ({ page, request }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await seed(request, RUNNING);
		await page.goto('/aspects');

		await aspectRow(page, 'Uni').getByRole('button', { name: 'Actions for Uni' }).click();
		const menu = page.getByRole('menu');
		await expect(menu.getByRole('menuitem')).toHaveText(['Edit', 'Delete']);
		await menu.getByRole('menuitem', { name: 'Edit' }).click();

		const sheet = page.getByRole('dialog', { name: 'Edit aspect' });
		await expect(sheet.getByRole('textbox', { name: 'Name' })).toHaveValue('Uni');
		await expect(sheet.getByRole('radio', { name: 'Sky' })).toBeChecked();
	});
});
