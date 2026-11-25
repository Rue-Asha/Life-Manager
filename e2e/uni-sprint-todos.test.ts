import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test, reset, seed, setClock, todoRow, todoRows } from './helpers';
import {
	archivedGroup,
	classCards,
	notesRegion,
	semesterSections,
	sprintTodos,
	uniAspect,
	uniPanel
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
	await expect(section.locator('.card-head')).toHaveText(/^This week\s*3$/);
	const rows = todoRows(section);
	await expect(rows).toHaveCount(3);
	await expect(rows.nth(0)).toContainText('Reading');
	await expect(rows.nth(0)).toContainText('Due Tue 6 Oct');
	await expect(rows.nth(1)).toContainText('Lecture 5');
	await expect(rows.nth(1)).toContainText('Due Thu 8 Oct');
	await expect(rows.nth(2)).toContainText('Sheet 4');
	await expect(rows.nth(2)).not.toContainText(/\d{1,2} Oct|Due|Overdue/);
	for (const [i, type] of [[0, 'OTH'], [1, 'LEC'], [2, 'EXC']] as const) {
		await expect(rows.nth(i)).toContainText('Analysis II');
		await expect(rows.nth(i).getByText(type, { exact: true })).toBeVisible();
	}
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

test('Scenario: Classes come before This week, notes sit in the side panel', async ({ page, request }) => {
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
	for (const width of [1600, 375]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/uni');
		await expect(uniPanel(page)).toBeVisible();

		const box = async (l: import('@playwright/test').Locator) => (await l.boundingBox())!;
		const heading = await box(page.getByRole('heading', { name: 'Uni', level: 1 }));
		const facts = await box(page.getByRole('list').filter({ hasText: 'ECTS earned' }));
		const column = [await box(semesterSections(page).first()), await box(sprintTodos(page)), await box(archivedGroup(page))];
		// The grade line is the key-facts card of the head: right of the heading at 1600, below it on a phone.
		expect(column[0].y).toBeGreaterThanOrEqual(heading.y + heading.height - 1);
		expect(column[0].y).toBeGreaterThanOrEqual(facts.y + facts.height - 1);
		for (let i = 1; i < column.length; i++) expect(column[i].y).toBeGreaterThanOrEqual(column[i - 1].y + column[i - 1].height - 1);
		const panel = await box(uniPanel(page));
		if (width === 1600) expect(panel.x).toBeGreaterThanOrEqual(column[0].x + column[0].width);
		else expect(panel.y).toBeGreaterThanOrEqual(column[2].y + column[2].height - 1);
	}
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

test('Scenario: Side panel holds the notes and the aspect line', async ({ page, request }) => {
	await seedClassTodos(request, [{ title: 'Sheet 4', type: 'EXC' }]);
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/uni');

	const panel = uniPanel(page);
	await expect(panel).toBeVisible();
	await expect(notesRegion(panel)).toBeVisible();
	await expect(uniAspect(panel)).toHaveText('Uni');
	await expect(panel.getByRole('button', { name: 'Change Uni aspect' })).toBeVisible();
	await expect(sprintTodos(panel)).toHaveCount(0);
	await expect(todoRows(panel)).toHaveCount(0);
	await expect(todoRows(sprintTodos(page))).toHaveCount(1);
});

const numbered = (n: number) => Array.from({ length: n }, (_, i) => ({ title: `Todo ${i + 1}`, type: 'EXC' as const, dueDate: `2026-10-${String(10 + i).padStart(2, '0')}` }));

test('Scenario: Seven todos make two pages', async ({ page, request }) => {
	await seedClassTodos(request, numbered(7));
	await page.goto('/uni');

	const section = sprintTodos(page);
	const rows = todoRows(section);
	const count = section.locator('.card-note');
	const prev = section.getByRole('button', { name: 'Previous' });
	const next = section.getByRole('button', { name: 'Next' });
	await expect(rows).toHaveCount(6);
	await expect(count).toHaveText('7');
	await expect(section.getByText('Page 1 of 2', { exact: true })).toBeVisible();
	await expect(prev).toBeDisabled();
	await expect(next).toBeEnabled();

	await next.click();
	await expect(rows).toHaveCount(1);
	await expect(rows.first()).toContainText('Todo 7');
	await expect(section.getByText('Page 2 of 2', { exact: true })).toBeVisible();
	await expect(next).toBeDisabled();
	await expect(prev).toBeEnabled();
	await expect(count).toHaveText('7');

	await prev.click();
	await expect(rows).toHaveCount(6);
	await expect(rows.first()).toContainText('Todo 1');
	await expect(section.getByText('Page 1 of 2', { exact: true })).toBeVisible();
	await expect(count).toHaveText('7');
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

const tag = (row: import('@playwright/test').Locator, type: string) => row.getByText(type, { exact: true }).locator('xpath=..');

async function look(el: import('@playwright/test').Locator) {
	return el.evaluate((node) => {
		const style = getComputedStyle(node);
		return { background: style.backgroundColor, color: style.color, glyph: [...(node.querySelector('svg')?.children ?? [])].map((c) => c.outerHTML).join('') };
	});
}

async function token(page: Page, name: string, property: 'background-color' | 'color') {
	return page.evaluate(
		({ name, property }) => {
			const probe = document.createElement('i');
			probe.style.setProperty(property, `var(${name})`);
			document.body.append(probe);
			const value = getComputedStyle(probe).getPropertyValue(property);
			probe.remove();
			return value;
		},
		{ name, property }
	);
}

const TYPES = [
	{ title: 'Lecture', type: 'LEC' as const },
	{ title: 'Exercise', type: 'EXC' as const },
	{ title: 'Other', type: 'OTH' as const },
	{ title: 'Untyped', type: undefined }
];

async function seedTypes(request: APIRequestContext) {
	await seed(request, {
		aspects: [UNI],
		uniAspect: 0,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis II' }],
		sprint: { state: 'active', weekStart: '2026-10-05' },
		todos: TYPES.map((t) => ({ title: t.title, aspect: 0, class: 0, type: t.type, inSprint: true }))
	});
}

test('Scenario: Rows show the type by letters, glyph and fill', async ({ page, request }) => {
	await seedTypes(request);
	await page.goto('/uni');

	const hub = sprintTodos(page);
	await expect(todoRows(hub)).toHaveCount(4);
	const [lec, exc, oth, untyped] = await Promise.all(
		[['Lecture', 'LEC'], ['Exercise', 'EXC'], ['Other', 'OTH'], ['Untyped', 'OTH']].map(([title, type]) => look(tag(todoRow(hub, title), type)))
	);
	expect(lec.background).toBe(await token(page, '--surface-sunken', 'background-color'));
	expect(exc.background).toBe(await token(page, '--surface-raised', 'background-color'));
	expect(oth.background).toBe('rgba(0, 0, 0, 0)');
	expect(untyped).toEqual(oth);
	expect(new Set([lec.glyph, exc.glyph, oth.glyph]).size).toBe(3);
	await expect(tag(todoRow(hub, 'Lecture'), 'LEC').locator('abbr')).toHaveAttribute('title', 'Lecture');
	const rows = await Promise.all(TYPES.map((t) => todoRow(hub, t.title).evaluate((el) => getComputedStyle(el).backgroundColor)));
	expect(new Set(rows).size).toBe(1);
});

test('Scenario: Type tags keep AA contrast', async ({ page, request }) => {
	await seedTypes(request);
	await page.goto('/uni');

	const hub = sprintTodos(page);
	const ground = await hub.evaluate((el) => getComputedStyle(el).backgroundColor);
	for (const [title, type] of [['Lecture', 'LEC'], ['Exercise', 'EXC'], ['Other', 'OTH']]) {
		const { background, color } = await look(tag(todoRow(hub, title), type));
		const behind = background === 'rgba(0, 0, 0, 0)' ? ground : background;
		expect(contrast(rgb(color), rgb(behind)), type).toBeGreaterThanOrEqual(4.5);
	}
});

test('Scenario: Overdue rows keep their marking', async ({ page, request }) => {
	await seedClassTodos(request, [{ title: 'Late sheet', type: 'LEC', dueDate: '2026-10-03' }, { title: 'On time', type: 'LEC' }]);
	await page.goto('/uni');

	const hub = sprintTodos(page);
	const late = todoRow(hub, 'Late sheet');
	await expect(late.getByText(/^Overdue · /)).toHaveCSS('color', await token(page, '--danger', 'color'));
	await expect(late.getByText('Overdue · Sat 3 Oct')).toBeVisible();
	expect(await look(tag(late, 'LEC'))).toEqual(await look(tag(todoRow(hub, 'On time'), 'LEC')));
});

test('Scenario: Class page rows use the same type tags', async ({ page, request }) => {
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
	const [hubLec, hubExc] = [await look(tag(todoRow(hub, 'Lecture'), 'LEC')), await look(tag(todoRow(hub, 'Exercise'), 'EXC'))];

	await classCards(page).click();
	await expect(page.getByRole('heading', { name: 'Analysis II', level: 1 })).toBeVisible();
	const rows = todoRows(page.getByRole('group', { name: 'Open', exact: true }));
	await expect(rows).toHaveCount(2);
	expect(await look(tag(rows.nth(0), 'LEC'))).toEqual(hubLec);
	expect(await look(tag(rows.nth(1), 'EXC'))).toEqual(hubExc);
	const [a, b] = await Promise.all([0, 1].map((i) => rows.nth(i).evaluate((el) => getComputedStyle(el).backgroundColor)));
	expect(a).toBe(b);
});
