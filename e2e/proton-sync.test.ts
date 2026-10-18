import type { Page } from '@playwright/test';
import type { ProtonOp } from '../src/lib/server/proton/types';
import { expect, test, reset, seed, setClock, fake, protonOn, protonPass } from './helpers';

// Wednesday 14 October 2026, midday in Berlin.
const WEDNESDAY = '2026-10-14T10:00:00Z';
const WEEK = '2026-10-12';
const HEALTH = { name: 'Health', color: 'sage', icon: 'heart' } as const;
const UNI = { name: 'Uni', color: 'lavender', icon: 'cap' } as const;

test.beforeEach(async ({ request, page }) => {
	await reset(request);
	await setClock(request, WEDNESDAY);
	await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

const editor = (page: Page) => page.getByRole('form', { name: 'Edit todo' });
const row = (page: Page, title: string) => page.getByTestId('todo-row').filter({ hasText: title });
const mark = () => fake().calls().length;
const delta = (from: number) => fake().calls().slice(from);
const ops = (from: number): ProtonOp[] => delta(from).map((c) => c.op!);
function byKind<K extends ProtonOp['kind']>(list: ProtonOp[], kind: K): Extract<ProtonOp, { kind: K }>[] {
	return list.filter((o): o is Extract<ProtonOp, { kind: K }> => o.kind === kind);
}
const onlyRef = () => Object.keys(fake().state().events)[0];

async function openTodo(page: Page, title: string) {
	await page.getByRole('button', { name: title, exact: true }).click();
	await expect(editor(page)).toBeVisible();
}

test('Scenario: Planning a todo in the app creates its event', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', aspect: 0 }] });
	await protonOn(request);
	const m = mark();

	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();
	await openTodo(page, 'Dentist');
	await editor(page).getByLabel('Planned', { exact: true }).fill('2026-10-16');
	await editor(page).getByLabel('From', { exact: true }).fill('18:00');
	await editor(page).getByLabel('To', { exact: true }).fill('19:30');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);

	await protonPass(request);
	expect(ops(m).map((o) => o.kind)).toEqual(['calendar.create', 'event.create']);
	expect(byKind(ops(m), 'calendar.create')[0].name).toBe('Health');
	const [create] = byKind(ops(m), 'event.create');
	expect(create.spec).toMatchObject({ title: 'Dentist', date: '2026-10-16', start: '18:00', end: '19:30' });
	const argv = delta(m).at(-1)!.argv!;
	expect(argv).toContain('Dentist');
	expect(argv).toContain('2026-10-16T18:00');
	expect(argv).toContain('2026-10-16T19:30');
	expect(argv[argv.indexOf('--zone') + 1]).toBe('Europe/Berlin');
});

test('Scenario: Editing, ticking done and unplanning a todo follow in Proton', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH],
		sprint: { state: 'active', weekStart: WEEK },
		todos: [{ title: 'Dentist', aspect: 0, inSprint: true, day: '2026-10-16', startTime: '18:00', endTime: '19:30' }]
	});
	await protonOn(request);
	await protonPass(request);
	const eventRef = onlyRef();
	const m = mark();

	await page.goto('/sprint');
	await expect(page.getByTestId('sprint-list').getByTestId('todo-row')).toHaveCount(1);
	await openTodo(page, 'Dentist');
	await editor(page).getByLabel('Title').fill('Dentist check-up');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);
	await expect(row(page, 'Dentist check-up')).toBeVisible();
	await protonPass(request);

	await page.getByRole('checkbox', { name: 'Done: Dentist check-up' }).click();
	await expect(row(page, 'Dentist check-up')).toHaveAttribute('data-status', 'done');
	await protonPass(request);

	await openTodo(page, 'Dentist check-up');
	await editor(page).getByLabel('Planned', { exact: true }).fill('');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(editor(page)).toHaveCount(0);
	await protonPass(request);

	const list = ops(m);
	expect(list.map((o) => o.kind)).toEqual(['event.update', 'event.update', 'event.delete']);
	const [first, second] = byKind(list, 'event.update');
	expect(first).toMatchObject({ ref: eventRef, spec: { title: 'Dentist check-up' } });
	expect(second).toMatchObject({ ref: eventRef, spec: { title: '✓ Dentist check-up' } });
	expect(byKind(list, 'event.delete')[0].ref).toBe(eventRef);
});

test('Scenario: Deleting a todo in the app deletes its event', async ({ page, request }) => {
	await seed(request, { aspects: [HEALTH], todos: [{ title: 'Dentist', aspect: 0, day: '2026-10-16' }] });
	await protonOn(request);
	await protonPass(request);
	const eventRef = onlyRef();
	const m = mark();

	await page.goto('/backlog');
	await expect(page.getByRole('heading', { level: 1, name: 'Backlog' })).toBeVisible();
	await openTodo(page, 'Dentist');
	await page.getByRole('button', { name: 'Delete', exact: true }).click();
	await page.getByRole('dialog', { name: 'Delete this todo?' }).getByRole('button', { name: 'Delete todo' }).click();
	await expect(row(page, 'Dentist')).toHaveCount(0);
	await protonPass(request);

	expect(ops(m)).toEqual([{ kind: 'event.delete', ref: eventRef }]);
	expect(delta(m)[0].argv).toContain('--yes');
});

test('Scenario: Editing a rule in the app updates its series', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH],
		rules: [{ title: 'Gym', aspect: 0, weekdays: [1, 4], startTime: '18:00', endTime: '19:30' }]
	});
	await protonOn(request);
	await protonPass(request);
	const seriesRef = onlyRef();
	const m = mark();

	await page.goto('/recurring');
	await page.getByRole('button', { name: /Gym/ }).click();
	const form = page.getByRole('dialog', { name: 'Edit rule' });
	await form.getByLabel('From').fill('07:00');
	await form.getByLabel('To').fill('08:00');
	await form.getByRole('button', { name: 'Save rule' }).click();
	await expect(form).toBeHidden();
	await expect(page.getByTestId('rule-row').getByTestId('rule-slot')).toHaveText('07:00–08:00');
	await protonPass(request);

	expect(ops(m).map((o) => o.kind)).toEqual(['event.update']);
	expect(byKind(ops(m), 'event.update')[0]).toMatchObject({
		ref: seriesRef,
		spec: { title: 'Gym', start: '07:00', end: '08:00', rrule: 'FREQ=WEEKLY;BYDAY=MO,TH' }
	});
});

test('Scenario: Starting a sprint in the app moves the series', async ({ page, request }) => {
	await seed(request, {
		aspects: [HEALTH],
		rules: [{ title: 'Yoga', aspect: 0, weekdays: [4, 6], startTime: '07:00', endTime: '08:00' }]
	});
	await protonOn(request);
	await protonPass(request);
	const seriesRef = onlyRef();
	expect(Object.values(fake().state().events)[0].spec.date).toBe('2026-10-15');
	const m = mark();

	await page.goto('/sprint/plan');
	await page.getByRole('button', { name: /^Start sprint/ }).click();
	await expect(page).toHaveURL(/\/sprint$/);
	const planned = page.getByTestId('sprint-list').locator('[data-testid="todo-row"]:not([data-day=""])');
	await expect(planned.first()).toBeVisible();
	const instances = await planned.count();
	await protonPass(request);

	const list = ops(m);
	expect(byKind(list, 'event.update')).toHaveLength(1);
	expect(byKind(list, 'event.create')).toHaveLength(instances);
	expect(list).toHaveLength(1 + instances);
	expect(byKind(list, 'event.update')[0]).toMatchObject({ ref: seriesRef, spec: { date: '2026-10-22' } });
});

test('Scenario: Setting an exam in the app creates its event', async ({ page, request }) => {
	const { classes } = await seed(request, {
		aspects: [HEALTH, UNI],
		uniAspect: 1,
		semesters: [{ name: 'WS 26/27' }],
		classes: [{ semester: 0, name: 'Analysis I' }]
	});
	await protonOn(request);
	await protonPass(request);
	const m = mark();

	await page.goto(`/uni/classes/${classes[0]}`);
	await page.getByRole('button', { name: 'Edit details' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByLabel('Exam date').fill('2026-11-03');
	await dialog.getByLabel('Exam time').fill('09:00');
	await dialog.getByRole('button', { name: 'Save' }).click();
	await expect(dialog).toBeHidden();
	await protonPass(request);

	expect(ops(m).map((o) => o.kind)).toEqual(['calendar.create', 'event.create']);
	expect(byKind(ops(m), 'calendar.create')[0].name).toBe('Uni');
	expect(byKind(ops(m), 'event.create')[0].spec).toMatchObject({
		title: 'Exam · Analysis I',
		date: '2026-11-03',
		start: '09:00',
		durationMin: 120
	});
});
