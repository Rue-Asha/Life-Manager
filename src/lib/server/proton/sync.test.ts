import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { createFake } from '../../../../scripts/fake-proton.mjs';
import type { AspectColor } from '$lib/aspect-style';
import type { Id, IsoDate, NewTodo, Slot, Weekday } from '$lib/types';
import { addDays } from '$lib/week';
import { openDb } from '../db';
import { migrations } from '../schema';
import { createAspect, deleteAspect, updateAspect } from '../aspects';
import { closeReview, moveToBacklog, setDay, startSprint, toggleDone } from '../sprints';
import { createTodo, deleteTodo, updateTodo } from '../todos';
import { createRule, deleteRule, updateRule } from '../recurring';
import { archiveSemester, createClass, createSemester, deleteClass, setUniAspectId, updateClass } from '../uni';
import { desiredState } from './desired';
import { runPass } from './pass';
import type { PassOutcome, ProtonOp, Runner } from './types';

// Wednesday. The active sprint started here covers Mon 12 to Sun 18 October.
const TODAY: IsoDate = '2026-10-14';
const SUNDAY: IsoDate = '2026-10-18';

let dir: string;
let fake: ReturnType<typeof createFake>;
let db: DatabaseSync;
const run: Runner = async (op) => fake.apply(op);

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'lm-sync-'));
	fake = createFake(dir);
	db = openDb(':memory:');
});
afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

const mark = () => fake.calls().length;
const ops = (from = 0): ProtonOp[] => fake.calls().slice(from).map((c) => c.op!);
const kinds = (from = 0) => ops(from).map((o) => o.kind);
function byKind<K extends ProtonOp['kind']>(list: ProtonOp[], kind: K): Extract<ProtonOp, { kind: K }>[] {
	return list.filter((o): o is Extract<ProtonOp, { kind: K }> => o.kind === kind);
}

async function pass(today: IsoDate = TODAY, o?: { retryFailed?: boolean }): Promise<PassOutcome> {
	return runPass(db, today, run, o);
}
async function sync(today: IsoDate = TODAY): Promise<void> {
	expect(await pass(today)).toMatchObject({ kind: 'done', failed: 0 });
}

const ref = (key: string): string => {
	const row = db.prepare('SELECT event_ref FROM proton_items WHERE key = ?').get(key) as { event_ref: string } | undefined;
	return row?.event_ref ?? '';
};
const rowCount = (key: string): number => (db.prepare('SELECT count(*) AS n FROM proton_items WHERE key = ?').get(key) as { n: number }).n;
const calendarOf = (aspectId: Id): string =>
	(db.prepare('SELECT calendar_id FROM proton_calendars WHERE aspect_id = ?').get(aspectId) as { calendar_id: string }).calendar_id;
const events = () => fake.state().events;
const count = (sql: string, ...params: (string | number)[]): number => (db.prepare(sql).get(...params) as { n: number }).n;

function ok<T>(r: { ok: true; value: T } | { ok: false; error: string }): T {
	if (!r.ok) throw new Error(r.error);
	return r.value;
}
const aspect = (name: string, color: AspectColor = 'sage'): Id => ok(createAspect(db, { name, color, icon: 'heart' })).id;
function todo(title: string, aspectId: Id, over: Partial<NewTodo> = {}): Id {
	return ok(createTodo(db, { title, aspectId, ...over }, TODAY)).id;
}
function plan(title: string, aspectId: Id, day: IsoDate, slot?: Slot, over: Partial<NewTodo> = {}): Id {
	const id = todo(title, aspectId, over);
	ok(setDay(db, id, day, TODAY, slot));
	return id;
}
const slot = (startTime: string, endTime: string | null): Slot => ({ startTime, endTime }) as Slot;
const startActive = () => ok(startSprint(db, TODAY, []));
const rule = (title: string, aspectId: Id, weekdays: Weekday[], s?: Slot) =>
	ok(createRule(db, { title, aspectId, weekdays, startTime: s?.startTime, endTime: s?.endTime }, TODAY));

function uni(name = 'Uni', color: AspectColor = 'lavender'): { uni: Id; semester: Id } {
	const id = aspect(name, color);
	ok(setUniAspectId(db, id));
	return { uni: id, semester: ok(createSemester(db, 'WS 26')).id };
}
const classInput = (name: string, over: { examAt?: string; examRoom?: string } = {}) => ({ name, color: 'sky', icon: 'book', ...over });
const klass = (semester: Id, name: string, over: { examAt?: string; examRoom?: string } = {}) =>
	ok(createClass(db, semester, classInput(name, over))).id;

describe('todo journeys', () => {
	it('Scenario: Planning a todo creates its event', async () => {
		const health = aspect('Health');
		const id = plan('Run', health, '2026-10-16', slot('18:00', '19:30'));
		await sync();
		expect(kinds()).toEqual(['calendar.create', 'event.create']);
		const [calendar] = byKind(ops(), 'calendar.create');
		const [create] = byKind(ops(), 'event.create');
		expect(calendar.name).toBe('Health');
		expect(create.calendarId).toBe(calendarOf(health));
		expect(create.spec).toMatchObject({ title: 'Run', date: '2026-10-16', start: '18:00', end: '19:30' });
		expect(Object.keys(events())).toEqual([ref(`todo:${id}`)]);
	});

	it('Scenario: Editing a planned todo updates its event', async () => {
		const health = aspect('Health');
		const id = plan('Run', health, '2026-10-16', slot('18:00', '19:30'));
		await sync();
		const before = ref(`todo:${id}`);
		const m = mark();
		ok(updateTodo(db, id, { title: 'Long run', notes: '10k along the river' }));
		ok(setDay(db, id, '2026-10-16', TODAY, slot('07:00', '08:30')));
		await sync();
		expect(kinds(m)).toEqual(['event.update']);
		const [update] = byKind(ops(m), 'event.update');
		expect(update.ref).toBe(before);
		expect(update.spec).toMatchObject({ title: 'Long run', description: '10k along the river', start: '07:00', end: '08:30' });
	});

	it('Scenario: Ticking a todo done and reopening it', async () => {
		const id = plan('Run', aspect('Health'), '2026-10-16', slot('18:00', '19:30'));
		await sync();
		const m = mark();
		ok(toggleDone(db, id));
		await sync();
		ok(toggleDone(db, id));
		await sync();
		const updates = byKind(ops(m), 'event.update');
		expect(kinds(m)).toEqual(['event.update', 'event.update']);
		expect(updates.map((u) => u.ref)).toEqual([ref(`todo:${id}`), ref(`todo:${id}`)]);
		expect(updates.map((u) => u.spec.title)).toEqual(['✓ Run', 'Run']);
	});

	it('Scenario: Ticking a past synced todo done updates its event', async () => {
		const id = plan('Run', aspect('Health'), '2026-10-15');
		await sync();
		const later: IsoDate = '2026-10-16';
		const m = mark();
		await sync(later);
		expect(mark()).toBe(m);
		ok(toggleDone(db, id));
		await sync(later);
		expect(kinds(m)).toEqual(['event.update']);
		expect(byKind(ops(m), 'event.update')[0]).toMatchObject({ ref: ref(`todo:${id}`), spec: { title: '✓ Run', date: '2026-10-15' } });
	});

	it('Scenario: Archiving a semester updates each done todo', async () => {
		const { uni: uniId, semester } = uni();
		const analysis = klass(semester, 'Analysis I');
		const classTodos = ['Sheet 1', 'Sheet 2', 'Sheet 3'].map((t, i) =>
			plan(t, uniId, `2026-10-${15 + i}`, undefined, { classId: analysis })
		);
		const unplanned = todo('Read chapter', uniId, { classId: analysis });
		plan('Dentist', uniId, '2026-10-16');
		await sync();
		const synced = classTodos.filter((id) => ref(`todo:${id}`) !== '');
		const m = mark();
		const { completed } = ok(archiveSemester(db, semester));
		await sync();
		const expected = synced.filter((id) => count("SELECT count(*) AS n FROM todos WHERE id = ? AND status = 'done'", id) === 1);
		expect(expected).toHaveLength(synced.length);
		expect(completed).toBe(expected.length + 1);
		expect(count('SELECT count(*) AS n FROM todos WHERE id = ? AND day IS NULL', unplanned)).toBe(1);
		expect(kinds(m)).toEqual(expected.map(() => 'event.update'));
		for (const u of byKind(ops(m), 'event.update')) expect(u.spec.title).toMatch(/^✓ Sheet/);
	});

	it('Scenario: Moving a todo to the backlog deletes its event', async () => {
		const health = aspect('Health');
		startActive();
		const id = plan('Run', health, '2026-10-16');
		await sync();
		const eventRef = ref(`todo:${id}`);
		const m = mark();
		ok(moveToBacklog(db, id));
		await sync();
		expect(ops(m)).toEqual([{ kind: 'event.delete', ref: eventRef }]);
		expect(rowCount(`todo:${id}`)).toBe(0);
	});

	it('Scenario: Carry-over by review or sprint start deletes the event', async () => {
		const health = aspect('Health');
		startActive();
		const carried = plan('Carried', health, '2026-10-16');
		await sync();
		const carriedRef = ref(`todo:${carried}`);
		const m = mark();
		ok(closeReview(db, SUNDAY, {}));
		const missed = plan('Missed', health, SUNDAY);
		// Syncing here is what lets the sprint start carry the second todo; the first one's delete is in this pass.
		await sync(SUNDAY);
		const missedRef = ref(`todo:${missed}`);
		ok(startSprint(db, '2026-10-19', []));
		await sync('2026-10-19');
		const deletes = byKind(ops(m), 'event.delete');
		expect(deletes.map((d) => d.ref)).toEqual([carriedRef, missedRef]);
		expect(rowCount(`todo:${carried}`) + rowCount(`todo:${missed}`)).toBe(0);
		expect(count('SELECT count(*) AS n FROM todos WHERE day IS NOT NULL')).toBe(0);
	});

	it('Scenario: Clearing the day deletes the event', async () => {
		const id = plan('Run', aspect('Health'), '2026-10-16');
		await sync();
		const eventRef = ref(`todo:${id}`);
		const m = mark();
		ok(setDay(db, id, null, TODAY));
		await sync();
		expect(ops(m)).toEqual([{ kind: 'event.delete', ref: eventRef }]);
		expect(rowCount(`todo:${id}`)).toBe(0);
	});

	it('Scenario: Deleting a todo or its class deletes the events', async () => {
		const { uni: uniId, semester } = uni();
		const analysis = klass(semester, 'Analysis I');
		const single = plan('Dentist', uniId, '2026-10-16');
		const inClass = [plan('Sheet 1', uniId, '2026-10-15', undefined, { classId: analysis }), plan('Sheet 2', uniId, '2026-10-17', undefined, { classId: analysis })];
		await sync();
		const refs = [single, ...inClass].map((id) => ref(`todo:${id}`));
		expect(refs.every(Boolean)).toBe(true);
		const m = mark();
		ok(deleteTodo(db, single));
		ok(deleteClass(db, analysis));
		await sync();
		expect(kinds(m)).toEqual(['event.delete', 'event.delete', 'event.delete']);
		expect(byKind(ops(m), 'event.delete').map((d) => d.ref).sort()).toEqual([...refs].sort());
		expect([single, ...inClass].map((id) => rowCount(`todo:${id}`))).toEqual([0, 0, 0]);
	});
});

describe('rule, exam and aspect journeys', () => {
	it('Scenario: Editing a rule updates its series', async () => {
		const health = aspect('Health');
		const r = rule('Yoga', health, [2, 4], slot('07:00', '08:00'));
		await sync();
		const seriesRef = ref(`rule:${r.id}`);
		const m = mark();
		ok(updateRule(db, r.id, { title: 'Pilates', aspectId: health, weekdays: [2, 4, 6], startTime: '09:00', endTime: '10:30' }));
		await sync();
		expect(kinds(m)).toEqual(['event.update']);
		const [update] = byKind(ops(m), 'event.update');
		expect(update.ref).toBe(seriesRef);
		expect(update.spec).toMatchObject({ title: 'Pilates', start: '09:00', end: '10:30', rrule: 'FREQ=WEEKLY;BYDAY=TU,TH,SA' });
	});

	it('Scenario: Rule aspect change moves its series', async () => {
		const health = aspect('Health');
		const work = aspect('Work', 'sky');
		const r = rule('Yoga', health, [2], slot('07:00', '08:00'));
		await sync();
		const oldRef = ref(`rule:${r.id}`);
		const m = mark();
		ok(updateRule(db, r.id, { title: 'Yoga', aspectId: work, weekdays: [2], startTime: '07:00', endTime: '08:00' }));
		await sync();
		expect(kinds(m).filter((k) => k !== 'calendar.create')).toEqual(['event.delete', 'event.create']);
		expect(byKind(ops(m), 'event.delete')[0].ref).toBe(oldRef);
		const [create] = byKind(ops(m), 'event.create');
		expect(create.calendarId).toBe(calendarOf(work));
		expect(create.calendarId).not.toBe(calendarOf(health));
		expect(create.spec.rrule).toBe('FREQ=WEEKLY;BYDAY=TU');
	});

	it('Scenario: Deleting a rule deletes its series and keeps instance events', async () => {
		const health = aspect('Health');
		startActive();
		const r = rule('Yoga', health, [4, 6], slot('07:00', '08:00'));
		const instances = (db.prepare('SELECT id FROM todos WHERE rule_id = ? AND day IS NOT NULL').all(r.id) as { id: number }[]).map((i) => i.id);
		expect(instances.length).toBeGreaterThan(0);
		await sync();
		const seriesRef = ref(`rule:${r.id}`);
		const instanceRefs = instances.map((id) => ref(`todo:${id}`));
		const m = mark();
		ok(deleteRule(db, r.id));
		await sync();
		expect(ops(m)).toEqual([{ kind: 'event.delete', ref: seriesRef }]);
		expect(rowCount(`rule:${r.id}`)).toBe(0);
		expect(instances.map((id) => ref(`todo:${id}`))).toEqual(instanceRefs);
		for (const instanceRef of instanceRefs) expect(events()[instanceRef]).toBeDefined();
	});

	it('Scenario: Starting a sprint moves the series and adds the week\'s instances', async () => {
		const health = aspect('Health');
		const r = rule('Yoga', health, [1, 3], slot('07:00', '08:00'));
		await sync(SUNDAY);
		const seriesRef = ref(`rule:${r.id}`);
		const m = mark();
		const sprint = ok(startSprint(db, SUNDAY, []));
		const placed = count('SELECT count(*) AS n FROM todos WHERE rule_id = ? AND day IS NOT NULL', r.id);
		expect(placed).toBeGreaterThan(0);
		await sync(SUNDAY);
		const list = ops(m);
		expect(byKind(list, 'event.update')).toHaveLength(1);
		expect(byKind(list, 'event.create')).toHaveLength(placed);
		expect(list).toHaveLength(1 + placed);
		const [update] = byKind(list, 'event.update');
		expect(update.ref).toBe(seriesRef);
		expect(update.spec.date).toBe(addDays(sprint.weekStart!, 7));
		expect(update.spec.exdates).toEqual([]);
	});

	it('Scenario: Series start follows today between sprints', async () => {
		const r = rule('Yoga', aspect('Health'), [3, 5]);
		await sync('2026-10-21');
		expect(byKind(ops(), 'event.create')[0].spec.date).toBe('2026-10-21');
		const m = mark();
		await sync('2026-10-21');
		expect(mark()).toBe(m);
		await sync('2026-10-22');
		expect(kinds(m)).toEqual(['event.update']);
		expect(byKind(ops(m), 'event.update')[0]).toMatchObject({ ref: ref(`rule:${r.id}`), spec: { date: '2026-10-23' } });
	});

	it('Scenario: Setting an exam creates its event', async () => {
		const { uni: uniId, semester } = uni();
		const analysis = klass(semester, 'Analysis I');
		await sync();
		const m = mark();
		ok(updateClass(db, analysis, classInput('Analysis I', { examAt: '2026-11-03T09:00', examRoom: 'Audimax' })));
		await sync();
		expect(kinds(m)).toEqual(['calendar.create', 'event.create']);
		const [create] = byKind(ops(m), 'event.create');
		expect(create.calendarId).toBe(calendarOf(uniId));
		expect(create.spec).toMatchObject({ title: 'Exam · Analysis I', date: '2026-11-03', start: '09:00', durationMin: 120, location: 'Audimax' });
	});

	it('Scenario: Clearing an exam or deleting its class deletes its event', async () => {
		const { semester } = uni();
		const first = klass(semester, 'Analysis I', { examAt: '2026-11-03T09:00' });
		const second = klass(semester, 'Algebra', { examAt: '2026-11-05' });
		await sync();
		const refs = [ref(`exam:${first}`), ref(`exam:${second}`)];
		expect(refs.every(Boolean)).toBe(true);
		const m = mark();
		ok(updateClass(db, first, classInput('Analysis I')));
		ok(deleteClass(db, second));
		await sync();
		expect(kinds(m)).toEqual(['event.delete', 'event.delete']);
		expect(byKind(ops(m), 'event.delete').map((d) => d.ref).sort()).toEqual([...refs].sort());
	});

	it('Scenario: Changing the Uni aspect moves exam events', async () => {
		const { semester } = uni();
		const exam = klass(semester, 'Analysis I', { examAt: '2026-11-03T09:00' });
		await sync();
		const oldRef = ref(`exam:${exam}`);
		const study = aspect('Study', 'sky');
		const m = mark();
		ok(setUniAspectId(db, study));
		await sync();
		expect(kinds(m).filter((k) => k !== 'calendar.create')).toEqual(['event.delete', 'event.create']);
		expect(byKind(ops(m), 'event.delete')[0].ref).toBe(oldRef);
		expect(byKind(ops(m), 'event.create')[0]).toMatchObject({ calendarId: calendarOf(study), spec: { title: 'Exam · Analysis I' } });
	});

	it('Scenario: Closing the review keeps instance days out of the series', async () => {
		const health = aspect('Health');
		startActive();
		const r = rule('Yoga', health, [3, 7], slot('07:00', '08:00'));
		const instances = (db.prepare('SELECT id, day FROM todos WHERE rule_id = ?').all(r.id) as { id: number; day: IsoDate }[]);
		expect(instances.map((i) => i.day).sort()).toEqual(['2026-10-14', SUNDAY]);
		await sync();
		for (const i of instances) ok(toggleDone(db, i.id));
		await sync();
		const seriesRef = ref(`rule:${r.id}`);
		const m = mark();
		ok(closeReview(db, SUNDAY, {}));
		await sync(SUNDAY);
		expect(kinds(m)).toEqual(['event.update', 'event.deleteOccurrence']);
		const [update] = byKind(ops(m), 'event.update');
		const [occurrence] = byKind(ops(m), 'event.deleteOccurrence');
		expect(update).toMatchObject({ ref: seriesRef, spec: { date: SUNDAY } });
		expect(occurrence).toEqual({ kind: 'event.deleteOccurrence', ref: seriesRef, occurrence: `${SUNDAY}T07:00` });
		expect(events()[seriesRef].exdates).toEqual([SUNDAY]);
	});

	it('Scenario: Renaming or recolouring an aspect makes no calls', async () => {
		const health = aspect('Health');
		const { semester } = uni();
		plan('Run', health, '2026-10-16', slot('18:00', '19:00'));
		rule('Yoga', health, [2]);
		klass(semester, 'Analysis I', { examAt: '2026-11-03T09:00' });
		await sync();
		const m = mark();
		ok(updateAspect(db, health, { name: 'Wellbeing', color: 'tangerine', icon: 'heart' }));
		await sync();
		expect(mark()).toBe(m);
	});

	it('Scenario: Deleting an aspect moves its events to the target\'s calendar', async () => {
		const health = aspect('Health');
		const work = aspect('Work', 'sky');
		const moved = [plan('Run', health, '2026-10-15'), plan('Swim', health, '2026-10-16')];
		plan('Report', work, '2026-10-17');
		await sync();
		const oldRefs = moved.map((id) => ref(`todo:${id}`));
		const m = mark();
		ok(deleteAspect(db, health, work));
		await sync();
		expect(kinds(m).sort()).toEqual(['event.create', 'event.create', 'event.delete', 'event.delete']);
		expect(byKind(ops(m), 'event.delete').map((d) => d.ref).sort()).toEqual([...oldRefs].sort());
		for (const create of byKind(ops(m), 'event.create')) expect(create.calendarId).toBe(calendarOf(work));
	});
});

describe('diff and sequences', () => {
	function world(): { health: Id; semester: Id } {
		const health = aspect('Health');
		const { semester } = uni();
		plan('Run', health, '2026-10-16', slot('18:00', '19:30'));
		plan('Read', health, '2026-10-17');
		rule('Yoga', health, [2, 4], slot('07:00', '08:00'));
		klass(semester, 'Analysis I', { examAt: '2026-11-03T09:00' });
		return { health, semester };
	}

	it('Scenario: Unchanged database makes no calls', async () => {
		world();
		const desired = count('SELECT (SELECT count(*) FROM todos WHERE day IS NOT NULL) + (SELECT count(*) FROM recurring_rules) + (SELECT count(*) FROM classes WHERE exam_at IS NOT NULL) AS n');
		expect(desired).toBe(4);
		await sync();
		expect(byKind(ops(), 'event.create')).toHaveLength(desired);
		const m = mark();
		await sync();
		expect(mark()).toBe(m);
	});

	it('Scenario: First pass backfills from today', async () => {
		const { health, semester } = world();
		const past = plan('Past run', health, '2026-10-16');
		const today = plan('Today run', health, TODAY);
		db.prepare('UPDATE todos SET day = ? WHERE id = ?').run('2026-10-10', past);
		rule('Pilates', health, [5]);
		const oldExam = klass(semester, 'Old class', { examAt: '2026-10-01' });
		await sync();
		const expected =
			count('SELECT count(*) AS n FROM todos WHERE day >= ?', TODAY) +
			count('SELECT count(*) AS n FROM recurring_rules') +
			count('SELECT count(*) AS n FROM classes WHERE exam_at IS NOT NULL AND substr(exam_at, 1, 10) >= ?', TODAY);
		const creates = byKind(ops(), 'event.create');
		expect(creates).toHaveLength(expected);
		const titles = creates.map((c) => c.spec.title);
		expect(titles).toContain('Today run');
		expect(titles).not.toContain('Past run');
		expect(titles).not.toContain('Exam · Old class');
		expect([rowCount(`todo:${past}`), rowCount(`exam:${oldExam}`)]).toEqual([0, 0]);
		expect(rowCount(`todo:${today}`)).toBe(1);
	});

	it('Scenario: Plan, done and back to backlog between two passes', async () => {
		const health = aspect('Health');
		startActive();
		const synced = plan('Run', health, '2026-10-16');
		await sync();
		const syncedRef = ref(`todo:${synced}`);
		const m = mark();
		ok(toggleDone(db, synced));
		ok(moveToBacklog(db, synced));
		const never = plan('Swim', health, '2026-10-17');
		ok(moveToBacklog(db, never));
		await sync();
		expect(ops(m)).toEqual([{ kind: 'event.delete', ref: syncedRef }]);
	});

	it('Scenario: Aspect change and edit in the same pass', async () => {
		const health = aspect('Health');
		const work = aspect('Work', 'sky');
		const id = plan('Run', health, '2026-10-16', slot('18:00', '19:00'));
		await sync();
		const oldRef = ref(`todo:${id}`);
		const m = mark();
		ok(updateTodo(db, id, { title: 'Sprint review', aspectId: work }));
		await sync();
		expect(kinds(m).filter((k) => k !== 'calendar.create')).toEqual(['event.delete', 'event.create']);
		expect(byKind(ops(m), 'event.delete')[0].ref).toBe(oldRef);
		expect(byKind(ops(m), 'event.create')[0]).toMatchObject({ calendarId: calendarOf(work), spec: { title: 'Sprint review' } });
	});

	it('Scenario: Auth failure mid-pass then Sync now finishes without duplicates', async () => {
		const health = aspect('Health');
		['Alpha', 'Beta', 'Gamma', 'Delta'].forEach((t, i) => plan(t, health, `2026-10-${15 + i}`));
		fake.fail({ kind: 'event.create', code: 2, error: 'Error: session expired', match: 'Gamma' });
		const first = await pass();
		expect(first.kind).toBe('relogin');
		expect(byKind(ops(), 'event.create').map((c) => c.spec.title)).toEqual(['Alpha', 'Beta', 'Gamma']);
		fake.clearFailures();
		const m = mark();
		expect(await pass(TODAY, { retryFailed: true })).toMatchObject({ kind: 'done', failed: 0 });
		expect(byKind(ops(m), 'event.create').map((c) => c.spec.title)).toEqual(['Gamma', 'Delta']);
		expect(Object.keys(events())).toHaveLength(4);
	});
});

describe('due bundle journeys', () => {
	const DUE: IsoDate = '2026-10-16';
	const dueKey = (aspectId: Id, date: IsoDate = DUE) => `due:${aspectId}:${date}`;

	it("Scenario: Bundle is created in the aspect's calendar and stored under its key", async () => {
		const health = aspect('Health');
		todo('Taxes', health, { dueDate: DUE });
		todo('Late', health, { dueDate: '2026-10-13' });
		await sync();
		expect(kinds()).toEqual(['calendar.create', 'event.create']);
		const [create] = byKind(ops(), 'event.create');
		expect(create.calendarId).toBe(calendarOf(health));
		expect(create.spec).toMatchObject({ title: 'Due: Taxes', date: DUE, start: null, end: null });
		expect(Object.keys(events())).toEqual([ref(dueKey(health))]);
		expect(rowCount(dueKey(health, '2026-10-13'))).toBe(0);
		expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: migrations.length });
	});

	it('Scenario: Second deadline joins the existing event', async () => {
		const health = aspect('Health');
		const work = aspect('Work', 'sky');
		todo('Taxes', health, { dueDate: DUE });
		todo('Report', work, { dueDate: DUE });
		await sync();
		const before = ref(dueKey(health));
		expect(Object.keys(events())).toHaveLength(2);
		const m = mark();
		todo('Rent', health, { dueDate: DUE });
		await sync();
		expect(kinds(m)).toEqual(['event.update']);
		expect(byKind(ops(m), 'event.update')[0]).toMatchObject({ ref: before, spec: { title: 'Due: Rent · Taxes' } });
		expect(Object.keys(events())).toHaveLength(2);
	});

	it('Scenario: Done todo leaves the bundle, the last one deletes it', async () => {
		const health = aspect('Health');
		const a = todo('Taxes', health, { dueDate: DUE });
		const b = todo('Rent', health, { dueDate: DUE });
		await sync();
		const eventRef = ref(dueKey(health));
		let m = mark();
		ok(toggleDone(db, a));
		await sync();
		expect(byKind(ops(m), 'event.update')[0]).toMatchObject({ ref: eventRef, spec: { title: 'Due: Rent' } });
		m = mark();
		ok(toggleDone(db, a));
		await sync();
		expect(byKind(ops(m), 'event.update')[0].spec.title).toBe('Due: Rent · Taxes');
		ok(toggleDone(db, a));
		await sync();
		m = mark();
		ok(updateTodo(db, b, { dueDate: null }));
		await sync();
		expect(ops(m)).toEqual([{ kind: 'event.delete', ref: eventRef }]);
		expect(rowCount(dueKey(health))).toBe(0);
		const c = todo('Gym', health, { dueDate: DUE });
		await sync();
		const ref2 = ref(dueKey(health));
		m = mark();
		ok(deleteTodo(db, c));
		await sync();
		expect(ops(m)).toEqual([{ kind: 'event.delete', ref: ref2 }]);
		m = mark();
		ok(toggleDone(db, a));
		await sync();
		expect(kinds(m)).toEqual(['event.create']);
		expect(byKind(ops(m), 'event.create')[0]).toMatchObject({ calendarId: calendarOf(health), spec: { title: 'Due: Taxes', date: DUE } });
		expect(rowCount(dueKey(health))).toBe(1);
		expect(ref(dueKey(health))).not.toBe(ref2);
	});

	it('Scenario: Unchanged bundle makes no call in a second pass', async () => {
		const health = aspect('Health');
		const a = todo('Taxes', health, { dueDate: DUE });
		todo('Rent', health, { dueDate: DUE });
		await sync();
		let m = mark();
		const row = () => db.prepare('SELECT event_ref, hash FROM proton_items WHERE key = ?').get(dueKey(health));
		const synced = row();
		await sync();
		expect(mark()).toBe(m);
		expect(row()).toEqual(synced);
		ok(toggleDone(db, a));
		await sync();
		expect(kinds(m)).toEqual(['event.update']);
		m = mark();
		await sync();
		expect(mark()).toBe(m);
	});

	it('Scenario: Moved due date and aspect change update both bundles', async () => {
		const health = aspect('Health');
		const work = aspect('Work', 'sky');
		const home = aspect('Home', 'tangerine');
		const NEXT: IsoDate = '2026-10-17';
		const id = todo('Taxes', health, { dueDate: DUE });
		const keep = todo('Rent', health, { dueDate: NEXT });
		todo('Report', work, { dueDate: NEXT });
		await sync();
		const oldRef = ref(dueKey(health));
		const nextRef = ref(dueKey(health, NEXT));
		const workRef = ref(dueKey(work, NEXT));
		let m = mark();
		ok(updateTodo(db, id, { dueDate: NEXT }));
		await sync();
		expect(kinds(m).sort()).toEqual(['event.delete', 'event.update']);
		expect(byKind(ops(m), 'event.delete')[0].ref).toBe(oldRef);
		expect(byKind(ops(m), 'event.update')[0]).toMatchObject({ ref: nextRef, spec: { title: 'Due: Rent · Taxes' } });
		expect(rowCount(dueKey(health))).toBe(0);
		m = mark();
		ok(updateTodo(db, id, { aspectId: work }));
		await sync();
		expect(kinds(m)).toEqual(['event.update', 'event.update']);
		const updates = byKind(ops(m), 'event.update');
		expect(updates.find((u) => u.ref === nextRef)!.spec.title).toBe('Due: Rent');
		expect(updates.find((u) => u.ref === workRef)!.spec.title).toBe('Due: Report · Taxes');
		m = mark();
		ok(deleteAspect(db, health, home));
		await sync();
		expect(kinds(m).sort()).toEqual(['calendar.create', 'event.create', 'event.delete']);
		expect(byKind(ops(m), 'event.delete')[0].ref).toBe(nextRef);
		expect(byKind(ops(m), 'event.create')[0]).toMatchObject({ calendarId: calendarOf(home), spec: { title: 'Due: Rent', date: NEXT } });
		expect(rowCount(dueKey(health, NEXT))).toBe(0);
		expect(rowCount(dueKey(home, NEXT))).toBe(1);
		expect(count('SELECT aspect_id AS n FROM todos WHERE id = ?', keep)).toBe(home);
		expect(Object.values(events())).toHaveLength(2);
	});

	it('Scenario: Passed bundle is frozen', async () => {
		const health = aspect('Health');
		const id = todo('Taxes', health, { dueDate: '2026-10-15' });
		await sync();
		const eventRef = ref(dueKey(health, '2026-10-15'));
		const later: IsoDate = '2026-10-16';
		const m = mark();
		await sync(later);
		ok(toggleDone(db, id));
		await sync(later);
		ok(deleteTodo(db, id));
		await sync(later);
		expect(mark()).toBe(m);
		expect(ref(dueKey(health, '2026-10-15'))).toBe(eventRef);
		expect(Object.keys(events())).toEqual([eventRef]);
	});
});
