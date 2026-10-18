import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createFake } from '../../../../scripts/fake-proton.mjs';
import type { EventSpec, ProtonOp } from './types';

const FAKE = resolve('scripts/fake-proton.mjs');
const FLAGS = { PROTON_NO_INPUT: '1', PROTON_NO_UPDATE_CHECK: '1', PROTON_NO_LOG: '1', TZ: 'Europe/Berlin' };

let dir: string;
beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'lm-fake-'));
});
afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

function proton(args: string[], env: Record<string, string> = FLAGS) {
	return new Promise<{ code: number; stdout: string; stderr: string }>((done) => {
		execFile(
			FAKE,
			['--output', 'json', '--profile', 'default', ...args],
			{ env: { PATH: process.env.PATH, FAKE_PROTON_DIR: dir, ...env } },
			(err, stdout, stderr) => done({ code: err ? (typeof err.code === 'number' ? err.code : -1) : 0, stdout, stderr })
		);
	});
}

const timed = (date: string, start: string, end: string) => [
	'--title', 'T', '--description', '', '--location', '', '--zone', 'Europe/Berlin', '--start', `${date}T${start}`, '--end', `${date}T${end}`
];
const series = ['--rrule', 'FREQ=WEEKLY;BYDAY=TU,TH'];

describe('fake proton cli', () => {
	it('Scenario: Fake CLI follows the proton-cli contract', async () => {
		const cal = await proton(['calendar', 'settings', 'calendars', 'create', '--name', 'IT', '--color', '#258723']);
		expect(cal).toMatchObject({ code: 0, stderr: '' });
		expect(JSON.parse(cal.stdout)).toEqual({ action: 'created', count: 1, dry_run: false, ids: ['cal-1'], kind: 'calendar', name: 'IT' });

		const evt = await proton(['calendar', 'events', 'create', '--calendar', 'cal-1', ...timed('2026-10-20', '09:00', '10:00')]);
		expect(JSON.parse(evt.stdout)).toMatchObject({ action: 'created', ids: ['cal-1/evt-1'], kind: 'event', name: 'T' });
		const allDay = await proton(['calendar', 'events', 'create', '--calendar', 'cal-1', '--title', 'Day', '--zone', 'Europe/Berlin', '--start', '2026-10-21', '--all-day']);
		expect(JSON.parse(allDay.stdout).ids).toEqual(['cal-1/evt-2']);
		const startOnly = await proton(['calendar', 'events', 'create', '--calendar', 'cal-1', '--title', 'S', '--zone', 'Europe/Berlin', '--start', '2026-10-21T08:00', '--duration', '30m']);
		expect(JSON.parse(startOnly.stdout).ids).toEqual(['cal-1/evt-3']);

		const fake = createFake(dir);
		expect(fake.state().events['cal-1/evt-1'].spec).toMatchObject({ date: '2026-10-20', start: '09:00', end: '10:00', durationMin: null });
		expect(fake.state().events['cal-1/evt-2'].spec).toMatchObject({ date: '2026-10-21', start: null, end: null });
		expect(fake.state().events['cal-1/evt-3'].spec).toMatchObject({ start: '08:00', end: null, durationMin: 30 });

		const ser = await proton(['calendar', 'events', 'create', '--calendar', 'cal-1', ...timed('2026-10-20', '09:00', '10:00'), ...series]);
		expect(JSON.parse(ser.stdout).ids).toEqual(['cal-1/evt-4']);
		const occ = await proton(['calendar', 'events', 'delete', 'cal-1/evt-4@2026-10-22T09:00', '--yes']);
		expect(occ.code).toBe(0);
		expect(JSON.parse(occ.stdout)).toMatchObject({ action: 'deleted', ids: ['cal-1/evt-4'], kind: 'event' });
		expect(fake.state().events['cal-1/evt-4'].exdates).toEqual(['2026-10-22']);

		const upd = await proton(['calendar', 'events', 'update', 'cal-1/evt-4', ...timed('2026-10-20', '09:00', '11:00'), '--all-day=false', ...series]);
		expect(JSON.parse(upd.stdout)).toMatchObject({ action: 'updated', ids: ['cal-1/evt-4'] });
		expect(fake.state().events['cal-1/evt-4'].exdates).toEqual([]);

		const upd1 = await proton(['calendar', 'events', 'update', 'cal-1/evt-1', ...timed('2026-10-20', '09:30', '10:30'), '--all-day=false']);
		expect(upd1.code).toBe(0);
		const del = await proton(['calendar', 'events', 'delete', 'cal-1/evt-1', '--yes']);
		expect(JSON.parse(del.stdout)).toMatchObject({ action: 'deleted', ids: ['cal-1/evt-1'] });

		const results = {
			updateGone: await proton(['calendar', 'events', 'update', 'cal-1/evt-1', ...timed('2026-10-20', '09:00', '10:00'), '--all-day=false']),
			unknownCalendar: await proton(['calendar', 'events', 'create', '--calendar', 'cal-9', ...timed('2026-10-20', '09:00', '10:00')]),
			notOccurrence: await proton(['calendar', 'events', 'delete', 'cal-1/evt-4@2026-10-21T09:00', '--yes']),
			noYes: await proton(['calendar', 'events', 'delete', 'cal-1/evt-2']),
			noInput: await proton(['calendar', 'events', 'delete', 'cal-1/evt-2', '--yes'], { ...FLAGS, PROTON_NO_INPUT: '' })
		};
		expect(Object.values(results).map((r) => r.code)).toEqual([3, 3, 3, 1, 1]);
		for (const r of Object.values(results)) {
			expect(r.stdout).toBe('');
			expect(r.stderr.split('\n')[0]).toMatch(/^Error: ./);
		}
		expect(fake.state().events['cal-1/evt-4'].exdates).toEqual([]);
		expect(fake.state().events['cal-1/evt-2']).toBeDefined();
	});

	it('Scenario: Fake CLI follows the proton-cli contract (refusals and time zones)', async () => {
		await proton(['calendar', 'settings', 'calendars', 'create', '--name', 'IT', '--color', '#258723']);
		const create = (...a: string[]) => proton(['calendar', 'events', 'create', '--calendar', 'cal-1', ...a]);
		await create(...timed('2026-10-20', '09:00', '10:00'), ...series);
		await create('--title', 'Day', '--start', '2026-10-21', '--all-day');

		const codes = {
			badColor: await proton(['calendar', 'settings', 'calendars', 'create', '--name', 'X', '--color', '#123456']),
			endAndDuration: await create('--title', 'T', '--zone', 'Europe/Berlin', '--start', '2026-10-20T09:00', '--end', '2026-10-20T10:00', '--duration', '1h'),
			allDayWithTime: await create('--title', 'T', '--start', '2026-10-20T09:00', '--all-day'),
			occurrenceOnSingle: await proton(['calendar', 'events', 'delete', 'cal-1/evt-2@2026-10-21', '--yes']),
			noZone: await create('--title', 'T', '--start', '2026-10-20T09:00', '--duration', '30m'),
			noJson: await new Promise<{ code: number }>((done) =>
				execFile(FAKE, ['--profile', 'default', 'calendar', 'events', 'delete', 'cal-1/evt-2', '--yes'], { env: { PATH: process.env.PATH, FAKE_PROTON_DIR: dir, ...FLAGS } }, (err) => done({ code: Number(err?.code ?? 0) }))
			)
		};
		expect(Object.values(codes).map((r) => r.code)).toEqual([1, 1, 1, 1, 1, 1]);

		// Occurrence times are read in the child's TZ, not in --zone: 09:00 UTC is 10:00 in Berlin, no occurrence.
		const utc = await proton(['calendar', 'events', 'delete', 'cal-1/evt-1@2026-10-22T09:00', '--yes'], { ...FLAGS, TZ: 'UTC' });
		expect(utc.code).toBe(3);
		const utcOk = await proton(['calendar', 'events', 'delete', 'cal-1/evt-1@2026-10-22T07:00', '--yes'], { ...FLAGS, TZ: 'UTC' });
		expect(utcOk.code).toBe(0);
		expect(createFake(dir).state().events['cal-1/evt-1'].exdates).toEqual(['2026-10-22']);
		const twice = await proton(['calendar', 'events', 'delete', 'cal-1/evt-1@2026-10-22T09:00', '--yes']);
		expect(twice.code).toBe(3);
	});

	it('Scenario: Fake CLI records calls and injected failures', async () => {
		const fake = createFake(dir);
		const cal = fake.apply({ kind: 'calendar.create', name: 'IT', color: '#258723' });
		expect(cal).toEqual({ ok: true, ids: ['cal-1'] });
		const spec: EventSpec = { title: 'A', description: '', location: '', date: '2026-10-20', start: '09:00', end: '10:00', durationMin: null, rrule: null, exdates: [] };
		const create: ProtonOp = { kind: 'event.create', calendarId: 'cal-1', spec };

		fake.fail({ kind: 'event.create', code: 5, error: 'network down', times: 1 });
		const first = fake.apply(create);
		expect(first).toEqual({ ok: false, code: 5, error: 'Error: network down' });
		const second = fake.apply(create);
		expect(second).toEqual({ ok: true, ids: ['cal-1/evt-1'] });

		const calls = fake.calls();
		expect(calls.map((c) => [c.op?.kind, c.code])).toEqual([
			['calendar.create', 0],
			['event.create', 5],
			['event.create', 0]
		]);
		expect(calls[1].op).toEqual(create);
		expect(calls[1].argv).toBeNull();
		expect(calls[1].end).toBeGreaterThanOrEqual(calls[1].at);

		fake.fail({ kind: '*', code: 2, error: 'Error: not logged in', match: 'cal-1/evt-1' });
		expect(fake.apply({ kind: 'event.delete', ref: 'cal-1/evt-1' })).toEqual({ ok: false, code: 2, error: 'Error: not logged in' });
		fake.clearFailures();
		fake.dropEvent('cal-1/evt-1');
		expect(fake.apply({ kind: 'event.delete', ref: 'cal-1/evt-1' })).toMatchObject({ ok: false, code: 3 });
		fake.dropCalendar('cal-1');
		expect(fake.apply(create)).toMatchObject({ ok: false, code: 3 });
		fake.reset();
		expect(fake.calls()).toEqual([]);
		expect(fake.state()).toEqual({ calendars: {}, events: {} });
	});

	it('Fake CLI logs the child env it saw', async () => {
		await proton(['calendar', 'settings', 'calendars', 'create', '--name', 'IT', '--color', '#258723'], { ...FLAGS, XDG_CONFIG_HOME: '/var/lib/life-manager/config' });
		const [call] = createFake(dir).calls();
		expect(call.env).toEqual({ ...FLAGS, XDG_CONFIG_HOME: '/var/lib/life-manager/config' });
	});
});
