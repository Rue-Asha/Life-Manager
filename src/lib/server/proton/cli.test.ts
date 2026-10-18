import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createFake } from '../../../../scripts/fake-proton.mjs';
import { createRunner, toArgv } from './cli';
import type { EventSpec, ProtonOp } from './types';

const FAKE = resolve('scripts/fake-proton.mjs');

let dir: string;
let fake: ReturnType<typeof createFake>;
let saved: Record<string, string | undefined>;
beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'lm-cli-'));
	fake = createFake(dir);
	saved = { FAKE_PROTON_DIR: process.env.FAKE_PROTON_DIR, XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME, TZ: process.env.TZ };
	process.env.FAKE_PROTON_DIR = dir;
});
afterEach(() => {
	for (const [k, v] of Object.entries(saved)) {
		if (v === undefined) delete process.env[k];
		else process.env[k] = v;
	}
	rmSync(dir, { recursive: true, force: true });
});

const spec = (over: Partial<EventSpec> = {}): EventSpec => ({
	title: 'Gym',
	description: '',
	location: '',
	date: '2026-10-21',
	start: '18:00',
	end: '19:00',
	durationMin: null,
	rrule: null,
	exdates: [],
	...over
});

const run = (gapMs = 0) => createRunner({ cli: FAKE, profile: 'default' }, { gapMs });

async function calendar(name = 'Health', color = '#258723') {
	const r = await run()({ kind: 'calendar.create', name, color });
	if (!r.ok) throw new Error(r.error);
	return r.ids[0];
}

describe('proton cli runner', () => {
	it('Scenario: Timed events are sent in Europe/Berlin', async () => {
		const cal = await calendar();
		const created = await run()({ kind: 'event.create', calendarId: cal, spec: spec() });
		expect(created).toEqual({ ok: true, ids: [`${cal}/evt-1`] });
		const [, call] = fake.calls();
		expect(call.argv).toContain('Europe/Berlin');
		expect(call.argv?.slice(call.argv.indexOf('--zone'), call.argv.indexOf('--zone') + 2)).toEqual(['--zone', 'Europe/Berlin']);
		expect(fake.state().events[`${cal}/evt-1`].spec).toMatchObject({ date: '2026-10-21', start: '18:00', end: '19:00' });

		const updated = await run()({ kind: 'event.update', ref: `${cal}/evt-1`, spec: spec({ end: null, durationMin: 90 }) });
		expect(updated.ok).toBe(true);
		expect(fake.calls()[2].argv).toEqual(expect.arrayContaining(['--all-day=false', '--duration', '90m']));
		expect(fake.state().events[`${cal}/evt-1`].spec).toMatchObject({ start: '18:00', end: null, durationMin: 90 });

		const zoneOf = (argv: string[] | null | undefined) => argv?.slice(argv.indexOf('--zone'), argv.indexOf('--zone') + 2);
		expect(zoneOf(fake.calls()[1].argv)).toEqual(['--zone', 'Europe/Berlin']);
		expect(fake.calls()[1].argv).toEqual(expect.arrayContaining(['--start', '2026-10-21T18:00', '--end', '2026-10-21T19:00']));

		const startOnly = await run()({ kind: 'event.create', calendarId: cal, spec: spec({ end: null, durationMin: 30 }) });
		expect(startOnly.ok).toBe(true);
		const startOnlyCall = fake.calls().at(-1);
		expect(zoneOf(startOnlyCall?.argv)).toEqual(['--zone', 'Europe/Berlin']);
		expect(startOnlyCall?.argv).toEqual(expect.arrayContaining(['--start', '2026-10-21T18:00', '--duration', '30m']));
		expect(startOnlyCall?.argv).not.toContain('--end');

		const allDayCreate = await run()({ kind: 'event.create', calendarId: cal, spec: spec({ start: null, end: null }) });
		expect(allDayCreate.ok).toBe(true);
		const allDayCall = fake.calls().at(-1);
		expect(zoneOf(allDayCall?.argv)).toEqual(['--zone', 'Europe/Berlin']);
		expect(allDayCall?.argv).toEqual(expect.arrayContaining(['--start', '2026-10-21', '--all-day']));
		expect(allDayCall?.argv).not.toContain('--end');

		const allDay = spec({ start: null, end: null });
		expect(toArgv({ kind: 'event.create', calendarId: cal, spec: allDay }, 'p')).toEqual(
			expect.arrayContaining(['--start', '2026-10-21', '--all-day'])
		);
		expect(toArgv({ kind: 'event.create', calendarId: cal, spec: allDay }, 'p').join(' ')).not.toContain('--end');
		expect(toArgv({ kind: 'event.create', calendarId: cal, spec: spec({ end: null, durationMin: 120 }) }, 'p')).toEqual(
			expect.arrayContaining(['--duration', '2h'])
		);
		expect(toArgv({ kind: 'event.create', calendarId: cal, spec: spec({ rrule: 'FREQ=WEEKLY;BYDAY=TU', exdates: ['2026-10-27'] }) }, 'p')).toEqual(
			expect.arrayContaining(['--rrule', 'FREQ=WEEKLY;BYDAY=TU'])
		);
		expect(toArgv({ kind: 'event.create', calendarId: cal, spec: spec({ rrule: 'FREQ=WEEKLY;BYDAY=TU', exdates: ['2026-10-27'] }) }, 'p').join(' ')).not.toContain('2026-10-27');
	});

	it('Scenario: Calls run non-interactively', async () => {
		const result = await run()({ kind: 'calendar.create', name: 'Health', color: '#258723' });
		expect(result).toEqual({ ok: true, ids: ['cal-1'] });
		const { argv, env } = fake.calls()[0];
		expect(argv?.slice(0, 4)).toEqual(['--output', 'json', '--profile', 'default']);
		expect(env).toMatchObject({ PROTON_NO_INPUT: '1', PROTON_NO_UPDATE_CHECK: '1', PROTON_NO_LOG: '1', TZ: 'Europe/Berlin' });
	});

	it('Scenario: Deletes are confirmed with --yes', async () => {
		const cal = await calendar();
		const created = await run()({ kind: 'event.create', calendarId: cal, spec: spec() });
		const ref = created.ok ? created.ids[0] : '';
		expect(await run()({ kind: 'event.delete', ref })).toEqual({ ok: true, ids: [ref] });
		const last = fake.calls().at(-1);
		expect(last?.argv).toContain('--yes');
		expect(last?.code).toBe(0);
		expect(fake.state().events).toEqual({});
	});

	it('Scenario: Failure carries the exit code and the Error line', async () => {
		const cal = await calendar();
		const create = () => run()({ kind: 'event.create', calendarId: cal, spec: spec() });
		fake.fail({ kind: 'event.create', code: 1, error: 'bad title', times: 1 });
		fake.fail({ kind: 'event.create', code: 2, error: 'session expired', times: 1 });
		fake.fail({ kind: 'event.create', code: 5, error: 'network down', times: 1 });
		expect(await create()).toEqual({ ok: false, code: 1, error: 'Error: bad title' });
		expect(await create()).toEqual({ ok: false, code: 2, error: 'Error: session expired' });
		expect(await create()).toEqual({ ok: false, code: 5, error: 'Error: network down' });
		expect(await run()({ kind: 'event.delete', ref: `${cal}/evt-99` })).toEqual({
			ok: false,
			code: 3,
			error: `Error: event not found: ${cal}/evt-99`
		});
	});

	it('Scenario: Missing binary is reported, not thrown', async () => {
		const op: ProtonOp = { kind: 'calendar.create', name: 'x', color: '#258723' };
		const missing = await createRunner({ cli: join(dir, 'nope'), profile: 'p' }, { gapMs: 0 })(op);
		expect(missing).toMatchObject({ ok: false, code: 'spawn', error: expect.stringContaining('ENOENT') });
		const plain = join(dir, 'plain');
		writeFileSync(plain, '#!/bin/sh\n');
		chmodSync(plain, 0o644);
		expect(await createRunner({ cli: plain, profile: 'p' }, { gapMs: 0 })(op)).toMatchObject({
			ok: false,
			code: 'spawn',
			error: expect.stringContaining('EACCES')
		});
	});

	it('Scenario: Non-JSON output ends the pass in state error', async () => {
		const quiet = join(dir, 'quiet');
		writeFileSync(quiet, '#!/bin/sh\n');
		chmodSync(quiet, 0o755);
		const op: ProtonOp = { kind: 'event.delete', ref: 'cal-1/evt-1' };
		const res = await createRunner({ cli: quiet, profile: 'p' }, { gapMs: 0 })(op);
		expect(res).toMatchObject({ ok: false, code: 'spawn', error: expect.stringContaining('JSON') });

		const notice = join(dir, 'notice');
		writeFileSync(notice, '#!/bin/sh\necho "update available"\n');
		chmodSync(notice, 0o755);
		const runner = createRunner({ cli: notice, profile: 'p' }, { gapMs: 0 });
		expect(await runner(op)).toMatchObject({ ok: false, code: 'spawn' });
		expect(await createRunner({ cli: FAKE, profile: 'p' }, { gapMs: 0 })({ kind: 'calendar.create', name: 'A', color: '#258723' })).toMatchObject({ ok: true });
	});

	it('Scenario: A hung proton call times out and backs off', async () => {
		const hung = join(dir, 'hung');
		writeFileSync(hung, '#!/bin/sh\nexec sleep 30\n');
		chmodSync(hung, 0o755);
		const runner = createRunner({ cli: hung, profile: 'p' }, { gapMs: 0, timeoutMs: 200 });
		const started = Date.now();
		const res = await runner({ kind: 'event.delete', ref: 'cal-1/evt-1' });
		expect(res).toEqual({ ok: false, code: 5, error: 'Error: proton timed out after 0.2 s' });
		expect(Date.now() - started).toBeLessThan(5000);
		const next = await runner({ kind: 'event.delete', ref: 'cal-1/evt-1' });
		expect(next).toMatchObject({ ok: false, code: 5 });
	});

	it('Scenario: Child process inherits XDG_CONFIG_HOME', async () => {
		process.env.XDG_CONFIG_HOME = '/srv/lm-config';
		await calendar();
		expect(fake.calls()[0].env.XDG_CONFIG_HOME).toBe('/srv/lm-config');
	});

	it('Scenario: Occurrence deletes name the occurrence in Europe/Berlin', async () => {
		process.env.TZ = 'America/New_York';
		const cal = await calendar();
		const series = async (over: Partial<EventSpec>) => {
			const created = await run()({ kind: 'event.create', calendarId: cal, spec: spec({ rrule: 'FREQ=WEEKLY;BYDAY=TU,TH', date: '2026-10-20', ...over }) });
			return created.ok ? created.ids[0] : '';
		};
		const timed = await series({});
		expect(await run()({ kind: 'event.deleteOccurrence', ref: timed, occurrence: '2026-10-22T18:00' })).toEqual({ ok: true, ids: [timed] });
		expect(fake.calls().at(-1)?.argv).toEqual(expect.arrayContaining([`${timed}@2026-10-22T18:00`, '--yes']));
		expect(fake.calls().at(-1)?.env.TZ).toBe('Europe/Berlin');
		expect(fake.state().events[timed].exdates).toEqual(['2026-10-22']);

		const allDay = await series({ start: null, end: null });
		expect(await run()({ kind: 'event.deleteOccurrence', ref: allDay, occurrence: '2026-10-22' })).toEqual({ ok: true, ids: [allDay] });
		expect(fake.calls().at(-1)?.argv).toEqual(expect.arrayContaining([`${allDay}@2026-10-22`, '--yes']));
		expect(fake.calls().at(-1)?.env.TZ).toBe('Europe/Berlin');
		expect(fake.state().events[allDay].exdates).toEqual(['2026-10-22']);
	});

	it('Scenario: Mutations are at least one second apart', async () => {
		const runner = createRunner({ cli: FAKE, profile: 'default' });
		const ops: ProtonOp[] = ['A', 'B', 'C'].map((name) => ({ kind: 'calendar.create', name, color: '#258723' }));
		const results = await Promise.all(ops.map((op) => runner(op)));
		expect(results.map((r) => r.ok)).toEqual([true, true, true]);
		const calls = fake.calls();
		expect(calls).toHaveLength(3);
		expect(calls[1].at - calls[0].end).toBeGreaterThanOrEqual(1000);
		expect(calls[2].at - calls[1].end).toBeGreaterThanOrEqual(1000);
	}, 10_000);
});
