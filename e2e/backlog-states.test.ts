import { expect, test, reset, seed, setClock, aspectGroup, todoRow, todoRows } from './helpers';

// Wednesday 7 October 2026 in Berlin; its sprint week starts Monday 5 October.
const NOW = '2026-10-07T10:00:00Z';
const SPRINT = { state: 'active', weekStart: '2026-10-05' } as const;

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await setClock(request, NOW);
	await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const moreOf = (row: ReturnType<typeof todoRow>, title: string) => row.getByRole('button', { name: `More actions: ${title}` });

test('Scenario: Aspect filter narrows the backlog', async ({ page, request }) => {
	const { aspects } = await seed(request, {
		aspects: [{ name: 'Health' }, { name: 'Home' }],
		todos: [
			{ title: 'Book a physio appointment', aspect: 0 },
			{ title: 'Fix the shelf', aspect: 1 },
			{ title: 'Paint the hallway', aspect: 1 }
		]
	});
	await page.goto('/backlog');
	const filter = page.getByRole('navigation', { name: 'Filter by aspect' });

	await filter.getByRole('link', { name: /^Home/ }).click();
	await expect(page).toHaveURL(new RegExp(`aspect=${aspects[1]}$`));
	await expect(filter.getByRole('link', { name: /^Home/ })).toHaveAttribute('aria-current', 'true');
	await expect(filter.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current', 'true');
	await expect(todoRows(page.getByRole('main'))).toHaveCount(2);
	await expect(todoRow(page, 'Book a physio appointment')).toHaveCount(0);
});

test('Scenario: Aspect groups collapse', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }, { name: 'Home' }], todos: [{ title: 'Book a physio appointment', aspect: 0 }, { title: 'Fix the shelf', aspect: 1 }] });
	await page.goto('/backlog');

	const health = aspectGroup(page, 'Health');
	const toggle = health.getByRole('button', { name: /^Health/ });
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await expect(todoRow(health, 'Book a physio appointment')).toBeVisible();

	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(todoRow(health, 'Book a physio appointment')).toBeHidden();
	await expect(todoRow(page, 'Fix the shelf')).toBeVisible();

	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await expect(todoRow(health, 'Book a physio appointment')).toBeVisible();
});

test('Scenario: Planning a day inside the week pulls into the sprint', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }], sprint: SPRINT, todos: [{ title: 'Clean the fridge' }, { title: 'Water the plants' }] });
	await page.goto('/backlog');

	const row = todoRow(page, 'Clean the fridge');
	await moreOf(row, 'Clean the fridge').click();
	await page.getByRole('menuitem', { name: 'Plan a day' }).click();
	const panel = page.getByRole('form', { name: 'Plan a day: Clean the fridge' });
	await expect(panel.getByLabel('Planned day')).toBeFocused();
	await panel.getByLabel('Planned day').selectOption({ label: 'Fri 9' });
	await panel.getByRole('button', { name: 'Save' }).click();

	await expect(todoRow(page, 'Clean the fridge')).toHaveCount(0);
	await expect(todoRow(page, 'Water the plants')).toBeVisible();
	await page.goto('/sprint?view=aspect');
	await expect(todoRow(page, 'Clean the fridge')).toHaveAttribute('data-day', '2026-10-09');
});

test('Scenario: Backlog empty and filtered-empty copy', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }, { name: 'Home' }] });
	await page.goto('/backlog');
	await expect(page.getByRole('heading', { name: 'Your backlog is empty' })).toBeVisible();
	await expect(page.getByRole('main').getByRole('button', { name: 'Add a todo' })).toBeVisible();

	await reset(request);
	const { aspects } = await seed(request, { aspects: [{ name: 'Health' }, { name: 'Home' }], todos: [{ title: 'Fix the shelf', aspect: 1 }] });
	await page.goto(`/backlog?aspect=${aspects[0]}`);
	await expect(page.getByRole('heading', { name: 'Nothing for Health in the backlog' })).toBeVisible();
	await expect(page.getByText('Add a todo to it.')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Your backlog is empty' })).toHaveCount(0);
});

test('Scenario: Many aspects and long titles stay in the backlog layout', async ({ page, request }) => {
	const names = Array.from({ length: 12 }, (_, i) => `Aspect number ${i + 1} with a longer name`);
	const long = `A very long todo title ${'that keeps going and going '.repeat(8)}`.slice(0, 200);
	await seed(request, {
		aspects: names.map((name) => ({ name })),
		sprint: SPRINT,
		todos: names.map((_, i) => ({ title: i === 0 ? long : `Todo ${i + 1}`, aspect: i }))
	});
	for (const width of [375, 1280]) {
		await page.setViewportSize({ width, height: 800 });
		await page.goto('/backlog');
		await expect(page.getByRole('region', { name: /^Aspect number 12/ })).toBeVisible();
		for (const name of names) await expect(aspectGroup(page, name.replace(/ with.*$/, ''))).toHaveCount(1);
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
		expect(overflow).toBeLessThanOrEqual(0);
		const strip = page.getByRole('navigation', { name: 'Filter by aspect' });
		const box = await strip.boundingBox();
		expect(box!.x + box!.width).toBeLessThanOrEqual(width);
	}
});

test('Scenario: Add to sprint stays on the row, Plan a day is in its menu', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }], sprint: SPRINT, todos: [{ title: 'Clean the fridge' }, { title: 'Water the plants' }] });
	for (const width of [375, 1280]) {
		await page.setViewportSize({ width, height: 800 });
		await page.goto('/backlog');
		for (const title of ['Clean the fridge', 'Water the plants']) {
			const row = todoRow(page, title);
			await expect(row.getByRole('button', { name: `Add to sprint: ${title}` })).toBeVisible();
			await expect(moreOf(row, title)).toBeVisible();
		}
		await expect(page.getByRole('button', { name: 'Plan a day' })).toHaveCount(0);

		await moreOf(todoRow(page, 'Clean the fridge'), 'Clean the fridge').click();
		await expect(page.getByRole('menuitem', { name: 'Plan a day' })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: 'Edit todo' })).toBeVisible();
		await page.getByRole('menuitem', { name: 'Edit todo' }).click();
		await expect(page.getByRole('form', { name: 'Edit todo' })).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('form', { name: 'Edit todo' })).toBeHidden();
	}
});
