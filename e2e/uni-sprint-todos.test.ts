import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test, reset, seed, setClock, todoRow, todoRows } from './helpers';
import {
	archivedGroup,
	classCards,
	notesRegion,
	semesterSections,
	sprintTodos,
	uniAspect,
	uniAspectLine,
	uniRail,
	uniRailToggle
} from './uni-locators';

const NOW = '2026-10-05T10:00:00Z'; // Monday, today = 2026-10-05

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

const UNI = { name: 'Uni', color: 'lavender', icon: 'book' } as const;

async function seedClassTodos(request: APIRequestContext, todos: { title: string; type?: 'LEC' | 'EXC' | 'OTH'; dueDate?: string }[]) {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II' }],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: todos.map((t) => ({ ...t, aspect: 0, class: 0, inSprint: true }))
	});
}

test('Scenario: Hub shows This week with count and row details', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }, { name: 'WS 25/26', archivedAt: '2026-03-01' }],
		classes: [
			{ semester: 0, name: 'Analysis II' },
			{ semester: 1, name: 'Analysis I' }
		],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [
			{ title: 'Lecture 5', aspect: 0, class: 0, type: 'LEC', dueDate: '2026-10-08', inSprint: true },
			{ title: 'Sheet 4', aspect: 0, class: 0, type: 'EXC', inSprint: true },
			{ title: 'Reading', aspect: 0, class: 0, type: 'OTH', dueDate: '2026-10-06', inSprint: true },
			{ title: 'Finished', aspect: 0, class: 0, type: 'EXC', inSprint: true, status: 'done' },
			{ title: 'In backlog', aspect: 0, class: 0, type: 'EXC' },
			{ title: 'Old semester', aspect: 0, class: 1, type: 'EXC', inSprint: true }
		]
	});
	await page.goto('/uni');

	const section = sprintTodos(page);
	await expect(section.getByRole('heading', { name: 'This week' })).toBeVisible();
	await expect(section.getByRole('heading', { name: 'This week' })).toHaveText(/^This week\s*3$/);
	const rows = todoRows(section);
	await expect(rows).toHaveCount(3);
	await expect(rows.nth(0)).toContainText('Reading');
	await expect(rows.nth(0)).toContainText('Tomorrow');
	await expect(rows.nth(1)).toContainText('Lecture 5');
	await expect(rows.nth(1)).toContainText('Thu 8 Oct');
	await expect(rows.nth(2)).toContainText('Sheet 4');
	await expect(rows.nth(2)).not.toContainText(/\d{1,2} Oct|Today|Tomorrow|Yesterday/);
	await expect(rows.nth(0).getByRole('link', { name: 'Analysis II' })).toContainText('Analysis II · OTH');
	await expect(rows.nth(1).getByRole('link', { name: 'Analysis II' })).toContainText('Analysis II · LEC');
	await expect(rows.nth(2).getByRole('link', { name: 'Analysis II' })).toContainText('Analysis II · EXC');
});

test('Scenario: Hub shows an empty line without sprint todos', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II' }],
		todos: [{ title: 'In backlog', aspect: 0, class: 0, type: 'EXC' }]
	});
	await page.goto('/uni');

	const section = sprintTodos(page);
	await expect(section.getByText("Nothing in this week's sprint", { exact: true })).toBeVisible();
	await expect(todoRows(section)).toHaveCount(0);
	await expect(pager(page)).toHaveCount(0);

	await reset(request);
	await setClock(request, NOW);
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II' }],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [
			{ title: 'Finished', aspect: 0, class: 0, type: 'EXC', inSprint: true, status: 'done' },
			{ title: 'Unlinked', aspect: 0, inSprint: true }
		]
	});
	await page.goto('/uni');

	await expect(section.getByText("Nothing in this week's sprint", { exact: true })).toBeVisible();
	await expect(todoRows(section)).toHaveCount(0);
	await expect(pager(page)).toHaveCount(0);
});

test('Scenario: Class cards come before This week, notes come last', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }, { name: 'WS 25/26', archivedAt: '2026-03-01' }],
		classes: [
			{ semester: 0, name: 'Analysis II' },
			{ semester: 1, name: 'Analysis I' }
		],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [{ title: 'Sheet 4', aspect: 0, class: 0, type: 'EXC', inSprint: true }]
	});
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/uni');

	await expect(uniRail(page)).toBeVisible();
	const boxes = [];
	for (const locator of [
		page.getByRole('heading', { name: 'Uni', level: 1 }),
		page.getByText(/^Overall average/),
		semesterSections(page).first(),
		sprintTodos(page),
		archivedGroup(page),
		notesRegion(page)
	]) {
		boxes.push((await locator.boundingBox())!);
	}
	for (let i = 1; i < boxes.length; i++) expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i - 1].y + boxes[i - 1].height - 1);
});

test('Scenario: Due next and exams are gone from the hub', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II', examAt: '2026-10-09T10:00' }],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [{ title: 'Sheet 4', aspect: 0, class: 0, type: 'EXC', dueDate: '2026-10-08', inSprint: true }]
	});
	for (const width of [1600, 375]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/uni');

		await expect(sprintTodos(page)).toBeVisible();
		await expect(page.getByText('Due next')).toHaveCount(0);
		await expect(page.getByText(/deadline/i)).toHaveCount(0);
		await expect(page.getByRole('heading', { name: /deadline/i })).toHaveCount(0);
		await expect(page.getByRole('region', { name: /deadline/i })).toHaveCount(0);
		await expect(page.getByRole('list', { name: /deadline/i })).toHaveCount(0);
		await expect(classCards(page).getByText(/^Exam /)).toHaveText('Exam in 4 d');
	}
});

test('Scenario: Rail holds only the aspect line at 1600', async ({ page, request }) => {
	await seedClassTodos(request, [{ title: 'Sheet 4', type: 'EXC' }]);
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/uni');

	const rail = uniRail(page);
	await expect(rail).toBeVisible();
	await expect(uniAspect(rail)).toHaveText('Uni');
	await expect(rail.getByRole('button', { name: 'Change Uni aspect' })).toBeVisible();
	await expect(sprintTodos(rail)).toHaveCount(0);
	await expect(todoRows(rail)).toHaveCount(0);
	await expect(todoRows(sprintTodos(page))).toHaveCount(1);
});

test('Scenario: Uni aspect line sits in the rail at 1600 and below the notes at 1100', async ({ page, request }) => {
	await seedClassTodos(request, [{ title: 'Sheet 4', type: 'EXC' }]);
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/uni');
	await expect(uniAspect(uniRail(page))).toBeVisible();

	await page.setViewportSize({ width: 1100, height: 900 });
	await expect(uniRail(page)).toHaveCount(0);
	await expect(uniRailToggle(page)).toHaveCount(0);
	const aspect = (await uniAspectLine(page).boundingBox())!;
	const notes = (await notesRegion(page).boundingBox())!;
	expect(aspect.y).toBeGreaterThanOrEqual(notes.y + notes.height - 1);
});

const numbered = (n: number) => Array.from({ length: n }, (_, i) => ({ title: `Todo ${i + 1}`, type: 'EXC' as const, dueDate: `2026-10-${String(10 + i).padStart(2, '0')}` }));

test('Scenario: Seven todos make two pages', async ({ page, request }) => {
	await seedClassTodos(request, numbered(7));
	await page.goto('/uni');

	const section = sprintTodos(page);
	const rows = todoRows(section);
	const count = section.getByRole('heading', { name: /^This week/ });
	const prev = section.getByRole('button', { name: 'Previous' });
	const next = section.getByRole('button', { name: 'Next' });
	await expect(rows).toHaveCount(6);
	await expect(count).toHaveText(/^This week\s*7$/);
	await expect(section.getByText('Page 1 of 2', { exact: true })).toBeVisible();
	await expect(prev).toBeDisabled();
	await expect(next).toBeEnabled();

	await next.click();
	await expect(rows).toHaveCount(1);
	await expect(rows.first()).toContainText('Todo 7');
	await expect(section.getByText('Page 2 of 2', { exact: true })).toBeVisible();
	await expect(next).toBeDisabled();
	await expect(prev).toBeEnabled();
	await expect(count).toHaveText(/^This week\s*7$/);

	await prev.click();
	await expect(rows).toHaveCount(6);
	await expect(rows.first()).toContainText('Todo 1');
	await expect(section.getByText('Page 1 of 2', { exact: true })).toBeVisible();
	await expect(count).toHaveText(/^This week\s*7$/);
});

test('Scenario: Exactly six todos show no pager', async ({ page, request }) => {
	await seedClassTodos(request, numbered(6));
	await page.goto('/uni');

	await expect(todoRows(sprintTodos(page))).toHaveCount(6);
	await expect(pager(page)).toHaveCount(0);
});

const pager = (page: Page) => page.getByRole('group', { name: 'Pages', exact: true });

type Rgb = [number, number, number];

function rgb(css: string): Rgb {
	const m = css.match(/^rgba?\((\d+), (\d+), (\d+)/);
	if (!m) throw new Error(`not an rgb colour: ${css}`);
	return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function luminance([r, g, b]: Rgb): number {
	const [lr, lg, lb] = [r, g, b].map((v) => {
		const c = v / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrast(a: Rgb, b: Rgb): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

async function colours(row: import('@playwright/test').Locator) {
	return row.evaluate((el) => {
		const style = getComputedStyle(el);
		return { background: style.backgroundColor, border: style.borderTopColor };
	});
}

test('Scenario: Cards are tinted by type', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II' }],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [
			{ title: 'Lecture', aspect: 0, class: 0, type: 'LEC', inSprint: true },
			{ title: 'Exercise', aspect: 0, class: 0, type: 'EXC', inSprint: true },
			{ title: 'Other', aspect: 0, class: 0, type: 'OTH', inSprint: true },
			{ title: 'Untyped', aspect: 0, class: 0, inSprint: true }
		]
	});
	await page.goto('/uni');

	const row = (title: string) => todoRow(sprintTodos(page), title);
	await expect(todoRows(sprintTodos(page))).toHaveCount(4);
	const [lec, exc, oth, untyped] = await Promise.all(['Lecture', 'Exercise', 'Other', 'Untyped'].map((t) => colours(row(t))));

	expect(new Set([lec.background, exc.background, oth.background]).size).toBe(3);
	expect(new Set([lec.border, exc.border, oth.border]).size).toBe(3);
	const [lr, , lb] = rgb(lec.background);
	expect(lr).toBeGreaterThan(lb);
	const [er, eg, eb] = rgb(exc.background);
	expect(er).toBeLessThan(eg);
	expect(er).toBeLessThan(eb);
	const grey = rgb(oth.background);
	expect(Math.max(...grey) - Math.min(...grey)).toBeLessThanOrEqual(10);
	expect(untyped).toEqual(oth);
});

test('Scenario: Ink keeps AA contrast on every tint', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II' }],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [
			{ title: 'Lecture', aspect: 0, class: 0, type: 'LEC', inSprint: true },
			{ title: 'Exercise', aspect: 0, class: 0, type: 'EXC', inSprint: true },
			{ title: 'Other', aspect: 0, class: 0, type: 'OTH', inSprint: true }
		]
	});
	await page.goto('/uni');

	for (const title of ['Lecture', 'Exercise', 'Other']) {
		const row = todoRow(sprintTodos(page), title);
		const { background } = await colours(row);
		const ink = await row.getByText(title, { exact: true }).evaluate((el) => getComputedStyle(el).color);
		expect(contrast(rgb(ink), rgb(background)), title).toBeGreaterThanOrEqual(4.5);
	}
});

test('Scenario: Overdue rows keep their marking on the tint', async ({ page, request }) => {
	await seedClassTodos(request, [{ title: 'Late sheet', type: 'LEC', dueDate: '2026-10-03' }, { title: 'On time', type: 'LEC' }]);
	await page.goto('/uni');

	const late = todoRow(sprintTodos(page), 'Late sheet');
	await expect(late.getByText('Overdue')).toHaveCSS('color', 'rgb(196, 47, 37)');
	const onTime = todoRow(sprintTodos(page), 'On time');
	expect((await colours(late)).background).toBe((await colours(onTime)).background);
	expect((await colours(late)).background).not.toBe('rgb(255, 255, 255)');
});

test('Scenario: Class page rows are not tinted', async ({ page, request }) => {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II' }],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: [
			{ title: 'Lecture', aspect: 0, class: 0, type: 'LEC', inSprint: true },
			{ title: 'Exercise', aspect: 0, class: 0, type: 'EXC', inSprint: true },
			{ title: 'Backlog lecture', aspect: 0, class: 0, type: 'LEC' },
			{ title: 'Backlog exercise', aspect: 0, class: 0, type: 'EXC' }
		]
	});
	await page.goto('/uni');
	const hub = sprintTodos(page);
	const [hubLec, hubExc] = [await colours(todoRow(hub, 'Lecture')), await colours(todoRow(hub, 'Exercise'))];

	await classCards(page).click();
	await expect(page.getByRole('heading', { name: 'Analysis II', level: 1 })).toBeVisible();
	const rows = todoRows(page.getByRole('group', { name: 'Open', exact: true }));
	await expect(rows).toHaveCount(2);
	const [a, b] = [await colours(rows.nth(0)), await colours(rows.nth(1))];
	expect(a).toEqual(b);
	for (const tint of [hubLec, hubExc]) {
		expect(a.background).not.toBe(tint.background);
		expect(a.border).not.toBe(tint.border);
	}
});
