import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFake } from '../../../../scripts/fake-proton.mjs';
import { ASPECT_COLORS } from '$lib/aspect-style';
import { openDb } from '../db';
import { createAspect } from '../aspects';
import { PROTON_COLORS } from './colors';
import { failedItems, forgetHashes, pendingCount, reconcile } from './reconciler';
import { specHash } from './hash';
import type { DesiredItem, EventSpec, ItemKey, Runner } from './types';
import type { AspectInput, Id } from '$lib/types';

let dir: string;
let fake: ReturnType<typeof createFake>;
let db: ReturnType<typeof openDb>;
let run: Runner;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'lm-reconcile-'));
	fake = createFake(dir);
	db = openDb(':memory:');
	run = async (op) => fake.apply(op);
});
afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

function aspect(input: AspectInput): Id {
	const r = createAspect(db, input);
	if (!r.ok) throw new Error(r.error);
	return r.value.id;
}
const health = (): Id => aspect({ name: 'Health', color: 'sage', icon: 'heart' });
const uni = (): Id => aspect({ name: 'Uni', color: 'lavender', icon: 'cap' });

const spec = (over: Partial<EventSpec> = {}): EventSpec => ({
	title: 'Run',
	description: '',
	location: '',
	date: '2026-10-20',
	start: '09:00',
	end: '10:00',
	durationMin: null,
	rrule: null,
	exdates: [],
	...over
});
const item = (n: number, aspectId: Id, over: Partial<EventSpec> = {}, kind: 'todo' | 'rule' | 'exam' = 'todo'): DesiredItem => ({
	key: `${kind}:${n}` as ItemKey,
	aspectId,
	label: over.title ?? `Run ${n}`,
	spec: spec({ title: `Run ${n}`, ...over })
});

interface Row {
	key: string;
	label: string;
	calendar_id: string | null;
	event_ref: string | null;
	hash: string | null;
	error: string | null;
	error_hash: string | null;
}
const rows = () => db.prepare('SELECT key, label, calendar_id, event_ref, hash, error, error_hash FROM proton_items ORDER BY key').all() as unknown as Row[];
const row = (key: string) => rows().find((r) => r.key === key);
const ops = () => fake.calls().map((c) => c.op!);
const kinds = () => ops().map((o) => o.kind);

describe('reconciler', () => {
	it('Scenario: Aspect colours map to fixed Proton colours', () => {
		expect(PROTON_COLORS).toEqual({
			sage: '#258723',
			sky: '#0A77A6',
			lavender: '#A839A4',
			ochre: '#807304',
			berry: '#BA1E55',
			lagoon: '#0F735A',
			tangerine: '#C44800',
			slate: '#936D58'
		});
		expect(Object.keys(PROTON_COLORS).sort()).toEqual(Object.keys(ASPECT_COLORS).sort());
		expect(new Set(Object.values(PROTON_COLORS)).size).toBe(Object.keys(ASPECT_COLORS).length);
	});

	it('Scenario: First item of an aspect creates its calendar', async () => {
		const a = health();
		const out = await reconcile(db, [item(1, a), item(2, a, { date: '2026-10-21' })], run);
		expect(out).toEqual({ kind: 'done', calls: 3, failed: 0 });
		const calls = ops();
		expect(calls.map((o) => o.kind)).toEqual(['calendar.create', 'event.create', 'event.create']);
		expect(calls[0]).toEqual({ kind: 'calendar.create', name: 'Health', color: PROTON_COLORS.sage });
		expect(calls[1]).toMatchObject({ kind: 'event.create', calendarId: 'cal-1' });
		expect(calls[2]).toMatchObject({ kind: 'event.create', calendarId: 'cal-1' });
		expect(db.prepare('SELECT aspect_id, calendar_id FROM proton_calendars').all()).toEqual([{ aspect_id: a, calendar_id: 'cal-1' }]);
		expect(row('todo:1')).toMatchObject({
			label: 'Run 1',
			calendar_id: 'cal-1',
			event_ref: 'cal-1/evt-1',
			hash: specHash(item(1, a).spec),
			error: null
		});
		expect(row('todo:2')?.event_ref).toBe('cal-1/evt-2');
	});

	it('Scenario: Changed item updates its event in place', async () => {
		const a = health();
		await reconcile(db, [item(1, a)], run);
		const before = fake.calls().length;
		const changed = item(1, a, { title: 'Run later', start: '11:00', end: '12:00' });
		const out = await reconcile(db, [changed], run);
		expect(out).toEqual({ kind: 'done', calls: 1, failed: 0 });
		expect(ops().slice(before)).toEqual([{ kind: 'event.update', ref: 'cal-1/evt-1', spec: changed.spec }]);
		expect(row('todo:1')).toMatchObject({ event_ref: 'cal-1/evt-1', hash: specHash(changed.spec) });
		expect(fake.state().events['cal-1/evt-1'].spec).toEqual(changed.spec);
	});

	it('Scenario: Aspect change moves the event to the other calendar', async () => {
		const a = health();
		const b = uni();
		await reconcile(db, [item(1, a), item(2, b)], run);
		const before = fake.calls().length;
		const moved = { ...item(1, b), aspectId: b };
		await reconcile(db, [moved, item(2, b)], run);
		expect(ops().slice(before)).toEqual([
			{ kind: 'event.delete', ref: 'cal-1/evt-1' },
			{ kind: 'event.create', calendarId: 'cal-2', spec: moved.spec }
		]);
		expect(row('todo:1')).toMatchObject({ calendar_id: 'cal-2', event_ref: 'cal-2/evt-3' });
		expect(fake.state().events['cal-1/evt-1']).toBeUndefined();
	});

	it('Scenario: Event deleted in Proton is created again', async () => {
		const a = health();
		await reconcile(db, [item(1, a)], run);
		fake.dropEvent('cal-1/evt-1');
		const before = fake.calls().length;
		const changed = item(1, a, { title: 'Run again' });
		await reconcile(db, [changed], run);
		const calls = fake.calls().slice(before);
		expect(calls.map((c) => [c.op!.kind, c.code])).toEqual([
			['event.update', 3],
			['event.create', 0]
		]);
		expect(calls[1].op).toMatchObject({ calendarId: 'cal-1' });
		expect(row('todo:1')).toMatchObject({ event_ref: 'cal-1/evt-2', hash: specHash(changed.spec), error: null });
	});

	it('Scenario: Item no longer desired has its event deleted', async () => {
		const a = health();
		await reconcile(db, [item(1, a), item(2, a)], run);
		const before = fake.calls().length;
		const out = await reconcile(db, [item(2, a)], run);
		expect(out).toEqual({ kind: 'done', calls: 1, failed: 0 });
		expect(ops().slice(before)).toEqual([{ kind: 'event.delete', ref: 'cal-1/evt-1' }]);
		expect(rows().map((r) => r.key)).toEqual(['todo:2']);
		expect(Object.keys(fake.state().events)).toEqual(['cal-1/evt-2']);
	});

	it('Scenario: Event already gone counts as deleted', async () => {
		const a = health();
		await reconcile(db, [item(1, a)], run);
		fake.dropEvent('cal-1/evt-1');
		const before = fake.calls().length;
		const out = await reconcile(db, [], run);
		expect(out).toEqual({ kind: 'done', calls: 1, failed: 0 });
		expect(fake.calls().slice(before).map((c) => [c.op!.kind, c.code])).toEqual([['event.delete', 3]]);
		expect(rows()).toEqual([]);
	});

	it('Scenario: Missing calendar is created again', async () => {
		const a = health();
		await reconcile(db, [item(1, a)], run);
		fake.dropCalendar('cal-1');
		const before = fake.calls().length;
		await reconcile(db, [item(1, a), item(2, a)], run);
		expect(fake.calls().slice(before).map((c) => [c.op!.kind, c.code])).toEqual([
			['event.create', 3],
			['calendar.create', 0],
			['event.create', 0]
		]);
		expect(db.prepare('SELECT aspect_id, calendar_id FROM proton_calendars').all()).toEqual([{ aspect_id: a, calendar_id: 'cal-2' }]);
		expect(row('todo:2')).toMatchObject({ calendar_id: 'cal-2', event_ref: 'cal-2/evt-2' });
	});

	it('Scenario: Series exclusions are deleted as occurrences after each push', async () => {
		const a = health();
		const series = (title: string) =>
			item(7, a, {
				title,
				date: '2026-10-20',
				start: '07:00',
				end: '08:00',
				rrule: 'FREQ=WEEKLY;BYDAY=TU,TH',
				exdates: ['2026-10-22', '2026-10-27']
			}, 'rule');
		const hashesSeen: (string | null | undefined)[] = [];
		run = async (op) => {
			if (op.kind === 'event.deleteOccurrence') hashesSeen.push(row('rule:7')?.hash);
			return fake.apply(op);
		};
		await reconcile(db, [series('Gym')], run);
		expect(ops().map((o) => o.kind)).toEqual(['calendar.create', 'event.create', 'event.deleteOccurrence', 'event.deleteOccurrence']);
		expect(ops().slice(2)).toEqual([
			{ kind: 'event.deleteOccurrence', ref: 'cal-1/evt-1', occurrence: '2026-10-22T07:00' },
			{ kind: 'event.deleteOccurrence', ref: 'cal-1/evt-1', occurrence: '2026-10-27T07:00' }
		]);
		expect(fake.state().events['cal-1/evt-1'].exdates).toEqual(['2026-10-22', '2026-10-27']);
		expect(hashesSeen).toEqual([null, null]);
		expect(row('rule:7')?.hash).toBe(specHash(series('Gym').spec));

		const before = fake.calls().length;
		await reconcile(db, [series('Gym B')], run);
		expect(ops().slice(before).map((o) => o.kind)).toEqual(['event.update', 'event.deleteOccurrence', 'event.deleteOccurrence']);
		expect(ops()[before + 2]).toMatchObject({ occurrence: '2026-10-27T07:00' });
		expect(fake.state().events['cal-1/evt-1'].exdates).toEqual(['2026-10-22', '2026-10-27']);
		expect(hashesSeen).toEqual([null, null, null, null]);
		expect(row('rule:7')?.hash).toBe(specHash(series('Gym B').spec));
	});

	it('Scenario: Failing item does not stop the pass', async () => {
		const a = health();
		fake.fail({ kind: 'event.create', code: 1, error: 'Error: ambiguous local time', match: '2026-10-25' });
		const ambiguous = item(1, a, { date: '2026-10-25', start: '02:30', end: '03:30' });
		const out = await reconcile(db, [ambiguous, item(2, a)], run);
		expect(out).toEqual({ kind: 'done', calls: 3, failed: 1 });
		expect(row('todo:2')).toMatchObject({ event_ref: 'cal-1/evt-1', error: null });
		expect(row('todo:1')).toMatchObject({ event_ref: null, hash: null, error: 'Error: ambiguous local time' });
		expect(Object.keys(fake.state().events)).toEqual(['cal-1/evt-1']);
	});

	it('Scenario: Exit 5 or exit 2 aborts the pass', async () => {
		const a = health();
		const four = [1, 2, 3, 4].map((n) => item(n, a));
		fake.fail({ kind: 'event.create', code: 5, error: 'Error: network unreachable', match: 'Run 2' });
		expect(await reconcile(db, four, run)).toEqual({ kind: 'retry', error: 'Error: network unreachable' });
		expect(ops().map((o) => o.kind)).toEqual(['calendar.create', 'event.create', 'event.create']);
		expect(rows().filter((r) => r.error)).toEqual([]);

		fake.reset();
		db.exec('DELETE FROM proton_items; DELETE FROM proton_calendars');
		fake.fail({ kind: 'event.create', code: 2, error: 'Error: session expired', match: 'Run 2' });
		expect(await reconcile(db, four, run)).toEqual({ kind: 'relogin', error: 'Error: session expired' });
		expect(ops().map((o) => o.kind)).toEqual(['calendar.create', 'event.create', 'event.create']);
		expect(rows().filter((r) => r.error)).toEqual([]);
	});

	it('Spawn failure aborts the pass with outcome error', async () => {
		const a = health();
		run = async () => ({ ok: false, code: 'spawn', error: 'spawn ENOENT' });
		expect(await reconcile(db, [item(1, a), item(2, a)], run)).toEqual({ kind: 'error', error: 'spawn ENOENT' });
		expect(rows()).toEqual([]);
	});

	it('Scenario: Failed item waits for a change or Sync now', async () => {
		const a = health();
		fake.fail({ kind: 'event.create', code: 1, error: 'Error: bad title', match: 'Run 1' });
		const first = item(1, a);
		await reconcile(db, [first, item(2, a)], run);
		const callsAfter = () => fake.calls().length;

		let before = callsAfter();
		expect(await reconcile(db, [first, item(2, a)], run)).toEqual({ kind: 'done', calls: 0, failed: 0 });
		expect(callsAfter()).toBe(before);

		expect(await reconcile(db, [first, item(2, a)], run, { retryFailed: true })).toEqual({ kind: 'done', calls: 1, failed: 1 });
		expect(callsAfter()).toBe(before + 1);

		before = callsAfter();
		const changed = item(1, a, { title: 'Run 1 renamed' });
		expect(await reconcile(db, [changed, item(2, a)], run)).toEqual({ kind: 'done', calls: 1, failed: 1 });
		expect(ops()[before]).toMatchObject({ kind: 'event.create', spec: { title: 'Run 1 renamed' } });
	});

	it('Failed update keeps the previous ref and hash, failed delete keeps its row', async () => {
		const a = health();
		const old = item(1, a);
		await reconcile(db, [old, item(2, a)], run);
		fake.fail({ kind: 'event.update', code: 1, error: 'Error: rejected', match: 'Run 1 b' });
		fake.fail({ kind: 'event.delete', code: 1, error: 'Error: cannot delete' });
		const changed = item(1, a, { title: 'Run 1 b' });
		expect(await reconcile(db, [changed], run)).toEqual({ kind: 'done', calls: 2, failed: 2 });
		expect(row('todo:1')).toMatchObject({
			event_ref: 'cal-1/evt-1',
			hash: specHash(old.spec),
			error: 'Error: rejected',
			error_hash: specHash(changed.spec)
		});
		expect(row('todo:2')).toMatchObject({ event_ref: 'cal-1/evt-2', error: 'Error: cannot delete', error_hash: 'delete' });
		const before = fake.calls().length;
		expect(await reconcile(db, [changed], run)).toEqual({ kind: 'done', calls: 0, failed: 0 });
		expect(fake.calls().length).toBe(before);
	});

	it('Scenario: Failed update clears when the item matches Proton again', async () => {
		const a = health();
		const original = item(1, a);
		await reconcile(db, [original, item(2, a)], run);
		fake.fail({ kind: 'event.update', code: 1, error: 'Error: rejected', match: 'Run 1 b' });
		expect(await reconcile(db, [item(1, a, { title: 'Run 1 b' }), item(2, a)], run)).toMatchObject({ failed: 1 });
		expect(failedItems(db)).toEqual([{ key: 'todo:1', label: 'Run 1 b', error: 'Error: rejected' }]);

		const before = fake.calls().length;
		expect(await reconcile(db, [original, item(2, a)], run)).toEqual({ kind: 'done', calls: 0, failed: 0 });
		expect(fake.calls().length).toBe(before);
		expect(failedItems(db)).toEqual([]);
		expect(row('todo:1')).toMatchObject({ label: 'Run 1', hash: specHash(original.spec), error: null, error_hash: null });
	});

	it('Scenario: Failed delete clears when the item is desired again', async () => {
		const a = health();
		await reconcile(db, [item(1, a), item(2, a)], run);
		fake.fail({ kind: 'event.delete', code: 1, error: 'Error: cannot delete' });
		await reconcile(db, [item(1, a)], run);
		expect(failedItems(db)).toEqual([{ key: 'todo:2', label: 'Run 2', error: 'Error: cannot delete' }]);

		const before = fake.calls().length;
		expect(await reconcile(db, [item(1, a), item(2, a)], run)).toEqual({ kind: 'done', calls: 0, failed: 0 });
		expect(fake.calls().length).toBe(before);
		expect(failedItems(db)).toEqual([]);
		expect(row('todo:2')).toMatchObject({ error: null, error_hash: null });
	});

	it('Scenario: Aspect deleted during its calendar create skips the item', async () => {
		const a = health();
		const other = uni();
		run = async (op) => {
			const res = fake.apply(op);
			if (op.kind === 'calendar.create' && op.name === 'Health') db.prepare('DELETE FROM aspects WHERE id = ?').run(a);
			return res;
		};
		const out = await reconcile(db, [item(1, a), item(2, other)], run);
		expect(out).toMatchObject({ kind: 'done', failed: 0 });
		expect(db.prepare('SELECT aspect_id FROM proton_calendars').all()).toEqual([{ aspect_id: other }]);
		expect(row('todo:1')).toBeUndefined();
		expect(failedItems(db)).toEqual([]);
		expect(row('todo:2')?.event_ref).toBeTruthy();
	});

	it('Scenario: Restart resumes from stored state', async () => {
		const a = health();
		const five = [1, 2, 3, 4, 5].map((n) => item(n, a));
		fake.fail({ kind: 'event.create', code: 5, error: 'Error: network unreachable', match: 'Run 3', times: 1 });
		expect((await reconcile(db, five, run)).kind).toBe('retry');
		expect(Object.keys(fake.state().events)).toHaveLength(2);

		const before = fake.calls().length;
		expect(await reconcile(db, five, run)).toEqual({ kind: 'done', calls: 3, failed: 0 });
		expect(ops().slice(before).map((o) => o.kind)).toEqual(['event.create', 'event.create', 'event.create']);
		const titles = Object.values(fake.state().events).map((e) => e.spec.title).sort();
		expect(titles).toEqual(['Run 1', 'Run 2', 'Run 3', 'Run 4', 'Run 5']);
		expect(rows().every((r) => r.event_ref && r.error === null)).toBe(true);
	});

	it('Scenario: Pending count matches the calls a pass would make', async () => {
		const a = health();
		const b = uni();
		const series = (title: string) =>
			item(9, a, { title, rrule: 'FREQ=WEEKLY;BYDAY=TU', exdates: ['2026-10-27', '2026-11-03'] }, 'rule');
		fake.fail({ kind: 'event.create', code: 1, error: 'Error: bad', match: 'Run 5', times: 1 });
		const initial = [item(1, a), item(2, a), item(3, a), item(4, b), item(5, a), series('Gym'), item(8, a)];
		await reconcile(db, initial, run);
		expect(pendingCount(db, initial)).toBe(0);

		const desired = [
			item(1, a, { title: 'Run 1 changed' }),
			item(2, a),
			{ ...item(3, b), aspectId: b },
			item(4, b),
			item(5, a),
			series('Gym B'),
			item(6, a),
			item(7, b)
		];
		const planned = pendingCount(db, desired);
		const before = fake.calls().length;
		await reconcile(db, desired, run);
		expect(planned).toBe(fake.calls().length - before);
		expect(planned).toBe(1 + 2 + 3 + 1 + 1 + 1); // update, move, series update + 2 occurrences, 2 creates, 1 delete
		expect(fake.calls().slice(before).filter((c) => c.op!.kind === 'calendar.create')).toEqual([]);
		expect(pendingCount(db, desired)).toBe(0);
	});

	it('Pending count includes deletes and ignores rows that never had an event', async () => {
		const a = health();
		fake.fail({ kind: 'event.create', code: 1, error: 'Error: bad', match: 'Run 2' });
		await reconcile(db, [item(1, a), item(2, a)], run);
		expect(pendingCount(db, [])).toBe(1);
		const before = fake.calls().length;
		await reconcile(db, [], run);
		expect(fake.calls().length - before).toBe(1);
		expect(rows()).toEqual([]);
	});

	it('Failed items are listed and Resync all forgets the hashes', async () => {
		const a = health();
		fake.fail({ kind: 'event.create', code: 1, error: 'Error: bad title', match: 'Run 2' });
		await reconcile(db, [item(1, a), item(2, a), item(3, a)], run);
		expect(failedItems(db)).toEqual([{ key: 'todo:2', label: 'Run 2', error: 'Error: bad title' }]);

		fake.clearFailures();
		forgetHashes(db);
		expect(rows().map((r) => [r.hash, r.error, r.error_hash])).toEqual([[null, null, null], [null, null, null], [null, null, null]]);
		expect(failedItems(db)).toEqual([]);
		expect(rows().filter((r) => r.event_ref).map((r) => r.key)).toEqual(['todo:1', 'todo:3']);
		const all = [item(1, a), item(2, a), item(3, a)];
		expect(pendingCount(db, all)).toBe(3);
		const before = fake.calls().length;
		expect(await reconcile(db, all, run)).toEqual({ kind: 'done', calls: 3, failed: 0 });
		expect(ops().slice(before).map((o) => o.kind)).toEqual(['event.update', 'event.create', 'event.update']);
	});
});
