import type { Locator, Page } from '@playwright/test';
import { expect, test, reset, seed, setClock, openNewTodo, todoRow, type SeedInput } from './helpers';

const NOW = '2026-10-07T10:00:00Z';
const WEEK = '2026-10-05';

const WIDTHS = [
	{ name: 'phone', width: 375, height: 812 },
	{ name: 'desktop', width: 1280, height: 900 }
] as const;

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const FOCUSABLE = 'button, a[href], input, select, textarea, summary, [tabindex]';

// Where focus sits: on one of the modal's controls (its index), on the body (a native modal hands focus to the browser's own chrome past its last control), or behind it.
const focusAt = (dialog: Locator) =>
	dialog.evaluate((d, selector) => {
		const controls = [...d.querySelectorAll<HTMLElement>(selector)].filter((el) => !el.matches(':disabled') && el.tabIndex >= 0 && el.checkVisibility());
		const active = document.activeElement;
		if (!active || active === document.body) return { where: 'chrome', count: controls.length, index: -1 };
		return { where: d.contains(active) ? 'inside' : 'behind', count: controls.length, index: controls.indexOf(active as HTMLElement) };
	}, FOCUSABLE);

// Tab and Shift+Tab around an open modal: focus starts inside it, never lands behind it, and keeps moving between its controls (radios of one group count once).
async function staysInside(page: Page, dialog: Locator) {
	const start = await focusAt(dialog);
	expect(start.where).toBe('inside');
	const reached = new Set<number>([start.index]);
	for (let i = 0; i < start.count * 2 + 4; i++) {
		await page.keyboard.press(i < start.count + 2 ? 'Tab' : 'Shift+Tab');
		const at = await focusAt(dialog);
		expect(at.where).not.toBe('behind');
		if (at.where === 'inside') reached.add(at.index);
	}
	reached.delete(-1);
	expect(reached.size).toBeGreaterThanOrEqual(Math.min(start.count, 2));
}

// Tab around a modal and prove focus never leaves it; Escape closes it and focus returns to its trigger.
async function trapsAndReturns(page: Page, trigger: Locator, dialog: Locator, close = () => page.keyboard.press('Escape')) {
	await trigger.focus();
	await trigger.press('Enter');
	await expect(dialog).toBeVisible();
	await staysInside(page, dialog);
	await close();
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();
}

for (const size of WIDTHS) {
	test(`Scenario: Every dialog traps focus and returns it (${size.name})`, async ({ page, request }) => {
		await seed(request, {
			aspects: [{ name: 'Health', color: 'sage', icon: 'heart' }],
			sprint: { state: 'active', weekStart: WEEK },
			todos: [
				{ title: 'Book physio', aspect: 0 },
				{ title: 'Stretch', aspect: 0, inSprint: true }
			]
		});
		await page.setViewportSize({ width: size.width, height: size.height });

		await page.goto('/backlog');
		const open = todoRow(page, 'Book physio').getByRole('button', { name: 'Book physio', exact: true });
		await trapsAndReturns(page, open, page.getByRole('dialog', { name: 'Edit todo' }));

		await open.press('Enter');
		const editor = page.getByRole('dialog', { name: 'Edit todo' });
		await expect(editor).toBeVisible();
		const del = editor.getByRole('button', { name: 'Delete todo' });
		await trapsAndReturns(page, del, page.getByRole('dialog', { name: 'Delete this todo?' }));
		await expect(editor).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(editor).toBeHidden();

		// The phone's "+" belongs to the pill bar of the shell unit; the check runs wherever the shell offers the button.
		const add = page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'New todo' });
		if (await add.count()) await trapsAndReturns(page, add, page.getByRole('dialog', { name: 'New todo' }));

		await page.goto('/sprint');
		const manage = page.getByRole('button', { name: 'Manage' });
		if (await manage.isVisible()) await trapsAndReturns(page, manage, page.getByRole('dialog').first());
	});
}

test('Scenario: Dialogs are bottom sheets on the phone and cards from 768 px', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Health' }], todos: [{ title: 'Book physio' }] });
	const editor = page.getByRole('dialog', { name: 'Edit todo' });
	const open = async (width: number, height: number) => {
		await page.setViewportSize({ width, height });
		await page.goto('/backlog');
		await todoRow(page, 'Book physio').getByRole('button', { name: 'Book physio', exact: true }).click();
		await expect(editor).toBeVisible();
		await page.waitForTimeout(500);
		return (await editor.boundingBox())!;
	};

	const phone = await open(375, 812);
	expect(phone.y + phone.height).toBeCloseTo(812, 0);
	expect(phone.width).toBeCloseTo(375, 0);

	const wide = await open(1280, 900);
	expect(wide.x + wide.width / 2).toBeCloseTo(640, 0);
	expect(wide.y + wide.height / 2).toBeCloseTo(450, 0);
	expect(wide.y + wide.height).toBeLessThan(900);
	expect(wide.width).toBeLessThan(1000);

	const parent = await editor.evaluate((d) => d.parentElement?.tagName);
	expect(parent).toBe('BODY');
});

const CONFIRMS: SeedInput = {
	aspects: [
		{ name: 'IT', color: 'sky', icon: 'code' },
		{ name: 'Uni', color: 'lavender', icon: 'cap' },
		{ name: 'Health', color: 'sage', icon: 'heart' },
		{ name: 'Garden', color: 'sage', icon: 'leaf' }
	],
	itAspect: 0,
	uniAspect: 1,
	projects: [{ name: 'Life Manager', status: 'active' }],
	semesters: [{ name: 'WS 26/27' }],
	classes: [{ semester: 0, name: 'Analysis II' }],
	sprint: { state: 'active', weekStart: WEEK },
	rules: [{ title: 'Run', aspect: 2, weekdays: [1] }],
	todos: [
		{ title: 'Book physio', aspect: 2 },
		{ title: 'Ship it', aspect: 0, project: 0 },
		{ title: 'Exercise sheet', aspect: 1, class: 0 }
	]
};

type Confirm = { title: string | RegExp; confirm: string | RegExp };

async function expectConfirm(page: Page, c: Confirm) {
	const dialog = page.getByRole('dialog', { name: c.title });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole('button', { name: c.confirm, exact: typeof c.confirm === 'string' })).toBeVisible();
	await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
	await staysInside(page, dialog);
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
}

test('Scenario: Confirmation dialogs keep their copy', async ({ page, request }) => {
	const ids = await seed(request, CONFIRMS);

	await page.goto('/backlog');
	await todoRow(page, 'Book physio').getByRole('button', { name: 'Book physio', exact: true }).click();
	await page.getByRole('dialog', { name: 'Edit todo' }).getByRole('button', { name: 'Delete todo' }).click();
	await expectConfirm(page, { title: 'Delete this todo?', confirm: 'Delete todo' });

	await page.goto('/recurring');
	await page.getByRole('listitem', { name: 'Run' }).getByRole('button', { name: /Run/ }).click();
	await page.getByRole('dialog', { name: 'Edit rule' }).getByRole('button', { name: 'Delete rule' }).click();
	await expectConfirm(page, { title: 'Delete “Run”?', confirm: 'Delete rule' });

	await page.goto(`/projects/${ids.projects[0]}`);
	await page.getByRole('button', { name: 'Project actions' }).click();
	await page.getByRole('menuitem', { name: 'Delete project' }).click();
	await expectConfirm(page, { title: 'Delete project?', confirm: 'Delete project' });
	await page.getByRole('button', { name: /\. Set status$/ }).click();
	await page.getByRole('menuitemradio').filter({ hasText: 'Implemented' }).click();
	await expectConfirm(page, { title: 'Mark as implemented?', confirm: 'Mark as implemented' });

	await page.goto(`/uni/classes/${ids.classes[0]}`);
	await page.getByRole('button', { name: 'Class actions' }).click();
	await page.getByRole('menuitem', { name: 'Delete class' }).click();
	await expectConfirm(page, { title: 'Delete Analysis II?', confirm: 'Delete class' });

	await page.goto('/uni');
	const semester = async (action: string) => {
		await page.getByRole('region', { name: 'Semester WS 26/27', exact: true }).getByRole('button', { name: 'Semester actions' }).click();
		await page.getByRole('menuitem', { name: action }).click();
	};
	await semester('Archive');
	await expectConfirm(page, { title: 'Archive WS 26/27?', confirm: 'Mark 1 done and archive' });
	await semester('Delete');
	await expectConfirm(page, { title: 'Delete WS 26/27?', confirm: 'Delete semester' });

	await page.getByRole('button', { name: 'Change Uni aspect' }).click();
	const uniPrompt = page.getByRole('dialog', { name: 'Change the Uni aspect' });
	await uniPrompt.getByRole('radio', { name: 'Health' }).check();
	await uniPrompt.getByRole('button', { name: 'Use Health for classes' }).click();
	await expectConfirm(page, { title: 'Use Health for classes?', confirm: /^Remove \d+ links? and change$/ });

	await page.goto('/projects');
	await page.getByRole('button', { name: 'Change IT aspect' }).click();
	const itPrompt = page.getByRole('region', { name: /aspect/i });
	await itPrompt.getByRole('radio', { name: 'Health' }).check();
	await page.getByRole('button', { name: 'Use Health for projects' }).click();
	await expectConfirm(page, { title: 'Change the IT aspect?', confirm: 'Change aspect' });

	await page.goto('/aspects');
	await page.getByRole('main').getByRole('listitem', { name: 'Garden', exact: true }).getByRole('button', { name: 'Actions for Garden' }).click();
	await page.getByRole('menu').getByRole('menuitem', { name: 'Edit' }).click();
	await page.getByRole('dialog', { name: 'Edit aspect' }).getByRole('button', { name: 'Delete aspect' }).click();
	await expectConfirm(page, { title: 'Delete Garden?', confirm: 'Delete aspect' });
});
