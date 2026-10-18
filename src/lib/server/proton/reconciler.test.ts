import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFake } from '../../../../scripts/fake-proton.mjs';
import { ASPECT_COLORS } from '$lib/aspect-style';
import { openDb } from '../db';
import { createAspect } from '../aspects';
import { PROTON_COLORS } from './colors';
import { reconcile } from './reconciler';
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
});
