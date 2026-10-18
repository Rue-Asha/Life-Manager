#!/usr/bin/env node
// Fake `proton` CLI (proton-cli v5.1.0 contract, see openspec/changes/proton-calendar-sync/design.md ## Contracts).
// One core, two uses: the executable (run / FAKE_PROTON_DIR) and in-process (createFake(dir).apply(op)).
// Plain JS because CI runs Node 22, which can't run .ts.
import { appendFileSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @typedef {import('../src/lib/server/proton/types').EventSpec} EventSpec */
/** @typedef {import('../src/lib/server/proton/types').ProtonOp} ProtonOp */
/** @typedef {import('../src/lib/server/proton/types').CliResult} CliResult */
/** @typedef {{ kind: ProtonOp['kind'] | '*', code: number, error: string, times?: number, match?: string }} FailureRule */
/** @typedef {{ at: number, end: number, argv: string[] | null, op: ProtonOp | null, code: number, env: Record<string, string | null> }} FakeCall */
/** @typedef {{ calendars: Record<string, { name: string, color: string }>, events: Record<string, { calendarId: string, spec: EventSpec, exdates: string[] }> }} FakeState */
/** @typedef {{ ok: true, action: string, ids: string[], kind: 'calendar' | 'event', name: string } | { ok: false, code: number, error: string }} Performed */

const ACCENTS = [
	'#8080FF', '#DB60D6', '#EC3E7C', '#F78400', '#936D58', '#5252CC', '#A839A4', '#BA1E55', '#C44800', '#54473F',
	'#415DF0', '#179FD9', '#1DA583', '#3CBB3A', '#B4A40E', '#273EB2', '#0A77A6', '#0F735A', '#258723', '#807304'
];
const ENV_FLAGS = ['PROTON_NO_INPUT', 'PROTON_NO_UPDATE_CHECK', 'PROTON_NO_LOG'];
const LOGGED_ENV = [...ENV_FLAGS, 'TZ', 'XDG_CONFIG_HOME'];
const VALUE_FLAGS = new Set([
	'--output', '--profile', '--name', '--color', '--calendar', '--title', '--description', '--location',
	'--zone', '--start', '--end', '--duration', '--rrule'
]);
const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const ZONE = 'Europe/Berlin';
const RRULE = /^FREQ=WEEKLY;BYDAY=(MO|TU|WE|TH|FR|SA|SU)(,(MO|TU|WE|TH|FR|SA|SU))*$/;

/** @param {string} message @returns {{ error: string }} */
const bad = (message) => ({ error: message });

/**
 * Parses what `toArgv` builds. Errors are what the real CLI refuses with exit 1.
 * @param {string[]} argv
 * @returns {{ op: ProtonOp, profile: string | null, output: string | null, yes: boolean, zone: string | null } | { error: string }}
 */
export function parseArgv(argv) {
	/** @type {Record<string, string>} */
	const flags = {};
	/** @type {string[]} */
	const words = [];
	let yes = false;
	/** @type {boolean | null} */
	let allDay = null;
	for (let i = 0; i < argv.length; i++) {
		let a = argv[i];
		if (!a.startsWith('--')) {
			words.push(a);
			continue;
		}
		/** @type {string | undefined} */
		let inline;
		const eq = a.indexOf('=');
		if (eq > 0) {
			inline = a.slice(eq + 1);
			a = a.slice(0, eq);
		}
		if (a === '--yes') yes = inline === undefined || inline === 'true';
		else if (a === '--all-day') allDay = inline === undefined || inline === 'true';
		else if (VALUE_FLAGS.has(a)) {
			const value = inline ?? argv[++i];
			if (value === undefined) return bad(`flag needs an argument: ${a}`);
			flags[a] = value;
		} else return bad(`unknown flag: ${a}`);
	}
	const path = words.slice(0, words[0] === 'calendar' && words[1] === 'settings' ? 4 : 3).join(' ');
	const ref = words[path.split(' ').length];
	const common = { profile: flags['--profile'] ?? null, output: flags['--output'] ?? null, yes, zone: flags['--zone'] ?? null };
	if (path === 'calendar settings calendars create') {
		if (!flags['--name']) return bad('--name is required');
		if (!flags['--color']) return bad('--color is required');
		if (!ACCENTS.includes(flags['--color'].toUpperCase())) return bad(`color ${flags['--color']} is not a Proton accent colour`);
		return { op: { kind: 'calendar.create', name: flags['--name'], color: flags['--color'] }, ...common };
	}
	if (path === 'calendar events create' || path === 'calendar events update') {
		const create = path.endsWith('create');
		if (create && !flags['--calendar']) return bad('--calendar is required');
		if (!create && (!ref || !/^[^/@]+\/[^/@]+$/.test(ref))) return bad(`invalid event reference: ${ref ?? ''}`);
		const spec = parseSpec(flags, allDay, create);
		if ('error' in spec) return spec;
		return {
			op: create
				? { kind: 'event.create', calendarId: /** @type {string} */ (flags['--calendar']), spec }
				: { kind: 'event.update', ref: /** @type {string} */ (ref), spec },
			...common
		};
	}
	if (path === 'calendar events delete') {
		const m = ref && /^([^/@]+\/[^/@]+)(?:@(.+))?$/.exec(ref);
		if (!m) return bad(`invalid event reference: ${ref ?? ''}`);
		if (m[2] === undefined) return { op: { kind: 'event.delete', ref: m[1] }, ...common };
		if (!/^\d{4}-\d\d-\d\d(T\d\d:\d\d)?$/.test(m[2])) return bad(`invalid occurrence: ${m[2]}`);
		return { op: { kind: 'event.deleteOccurrence', ref: m[1], occurrence: m[2] }, ...common };
	}
	return bad(`unknown command: ${words.join(' ')}`);
}

/**
 * @param {Record<string, string>} flags
 * @param {boolean | null} allDay
 * @param {boolean} create
 * @returns {EventSpec | { error: string }}
 */
function parseSpec(flags, allDay, create) {
	const start = flags['--start'];
	if (!start) return bad('--start is required');
	const m = /^(\d{4}-\d\d-\d\d)(?:T(\d\d:\d\d))?$/.exec(start);
	if (!m) return bad(`invalid --start: ${start}`);
	const rrule = flags['--rrule'] ?? null;
	if (rrule !== null && !RRULE.test(rrule)) return bad(`unsupported --rrule: ${rrule}`);
	if (flags['--end'] !== undefined && flags['--duration'] !== undefined) return bad('--end and --duration are mutually exclusive');
	const base = {
		title: flags['--title'] ?? '',
		description: flags['--description'] ?? '',
		location: flags['--location'] ?? '',
		date: m[1],
		rrule,
		exdates: /** @type {string[]} */ ([])
	};
	if (m[2] === undefined) {
		if (allDay !== true) return bad('an all-day --start (no time) needs --all-day');
		if (flags['--end'] !== undefined || flags['--duration'] !== undefined) return bad('an all-day event takes no --end or --duration');
		return { ...base, start: null, end: null, durationMin: null };
	}
	if (allDay === true) return bad('--all-day with a timed --start');
	if (!create && allDay !== false) return bad('updating to a timed event needs --all-day=false');
	const end = flags['--end'];
	const duration = flags['--duration'];
	if (end !== undefined) {
		const e = /^(\d{4}-\d\d-\d\d)T(\d\d:\d\d)$/.exec(end);
		if (!e) return bad(`invalid --end: ${end}`);
		if (e[1] !== m[1]) return bad('events spanning several days are not supported by the fake');
		return { ...base, start: m[2], end: e[2], durationMin: null };
	}
	if (duration !== undefined) {
		const d = /^(\d+)([hm])$/.exec(duration);
		if (!d) return bad(`invalid --duration: ${duration}`);
		return { ...base, start: m[2], end: null, durationMin: Number(d[1]) * (d[2] === 'h' ? 60 : 1) };
	}
	return bad('a timed event needs --end or --duration');
}

/** @param {number} ms @param {string} tz */
function zoneParts(ms, tz) {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
	}).formatToParts(ms);
	/** @type {Record<string, number>} */
	const p = {};
	for (const { type, value } of parts) p[type] = Number(value);
	return p;
}

/** @param {string} date @param {string} time @param {string} tz  wall time in `tz` as an instant (ms) */
function wallToInstant(date, time, tz) {
	const [y, mo, d] = date.split('-').map(Number);
	const [h, mi] = time.split(':').map(Number);
	const asUtc = Date.UTC(y, mo - 1, d, h, mi);
	const offset = (/** @type {number} */ t) => {
		const p = zoneParts(t, tz);
		return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(t / 60000) * 60000;
	};
	return asUtc - offset(asUtc - offset(asUtc));
}

/** @param {number} ms @param {string} tz @returns {{ date: string, time: string }} */
function instantToWall(ms, tz) {
	const p = zoneParts(ms, tz);
	const two = (/** @type {number} */ n) => String(n).padStart(2, '0');
	return { date: `${p.year}-${two(p.month)}-${two(p.day)}`, time: `${two(p.hour)}:${two(p.minute)}` };
}

/** @param {string} date */
const weekday = (date) => DAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];

/** @param {string} line */
const errorLine = (line) => (line.startsWith('Error:') ? line : `Error: ${line}`);

/** @param {string} dir */
export function createFake(dir) {
	mkdirSync(dir, { recursive: true });
	const stateFile = join(dir, 'state.json');
	const callsFile = join(dir, 'calls.jsonl');
	const failuresFile = join(dir, 'failures.json');

	/** @returns {FakeState & { next: { cal: number, evt: number } }} */
	function load() {
		if (!existsSync(stateFile)) return { calendars: {}, events: {}, next: { cal: 1, evt: 1 } };
		return JSON.parse(readFileSync(stateFile, 'utf8'));
	}
	/** @param {ReturnType<typeof load>} s */
	const save = (s) => writeFileSync(stateFile, JSON.stringify(s));
	/** @returns {FailureRule[]} */
	const loadFailures = () => (existsSync(failuresFile) ? JSON.parse(readFileSync(failuresFile, 'utf8')) : []);

	/** @param {ProtonOp} op @returns {{ code: number, error: string } | null} */
	function injected(op) {
		const rules = loadFailures();
		const text = JSON.stringify(op);
		const hit = rules.findIndex((r) => (r.kind === '*' || r.kind === op.kind) && (r.match === undefined || text.includes(r.match)));
		if (hit < 0) return null;
		const rule = rules[hit];
		if (rule.times !== undefined && --rule.times <= 0) rules.splice(hit, 1);
		writeFileSync(failuresFile, JSON.stringify(rules));
		return { code: rule.code, error: errorLine(rule.error) };
	}

	/** @param {ProtonOp} op @param {string} tz @returns {Performed} */
	function perform(op, tz) {
		const fail = (/** @type {number} */ code, /** @type {string} */ message) => ({ ok: /** @type {const} */ (false), code, error: errorLine(message) });
		const failure = injected(op);
		if (failure) return { ok: false, ...failure };
		const s = load();
		if (op.kind === 'calendar.create') {
			if (!ACCENTS.includes(op.color.toUpperCase())) return fail(1, `color ${op.color} is not a Proton accent colour`);
			const id = `cal-${s.next.cal++}`;
			s.calendars[id] = { name: op.name, color: op.color };
			save(s);
			return { ok: true, action: 'created', ids: [id], kind: 'calendar', name: op.name };
		}
		if (op.kind === 'event.create' || op.kind === 'event.update') {
			if (op.spec.end !== null && op.spec.durationMin !== null) return fail(1, '--end and --duration are mutually exclusive');
			if (op.spec.start === null && (op.spec.end !== null || op.spec.durationMin !== null)) return fail(1, 'an all-day event takes no --end or --duration');
			if (op.spec.rrule !== null && !RRULE.test(op.spec.rrule)) return fail(1, `unsupported --rrule: ${op.spec.rrule}`);
		}
		if (op.kind === 'event.create') {
			if (!s.calendars[op.calendarId]) return fail(3, `calendar not found: ${op.calendarId}`);
			const ref = `${op.calendarId}/evt-${s.next.evt++}`;
			s.events[ref] = { calendarId: op.calendarId, spec: op.spec, exdates: [] };
			save(s);
			return { ok: true, action: 'created', ids: [ref], kind: 'event', name: op.spec.title };
		}
		const event = s.events[op.ref];
		if (!event) return fail(3, `event not found: ${op.ref}`);
		if (op.kind === 'event.update') {
			s.events[op.ref] = { calendarId: event.calendarId, spec: op.spec, exdates: [] };
			save(s);
			return { ok: true, action: 'updated', ids: [op.ref], kind: 'event', name: op.spec.title };
		}
		if (op.kind === 'event.delete') {
			delete s.events[op.ref];
			save(s);
			return { ok: true, action: 'deleted', ids: [op.ref], kind: 'event', name: event.spec.title };
		}
		const { spec } = event;
		if (spec.rrule === null) return fail(1, `event ${op.ref} is not recurring`);
		const timed = op.occurrence.includes('T');
		/** @type {string} */
		let day;
		/** @type {string | null} */
		let time = null;
		if (timed) {
			({ date: day, time } = instantToWall(wallToInstant(op.occurrence.slice(0, 10), op.occurrence.slice(11), tz), ZONE));
		} else day = op.occurrence;
		const byday = /BYDAY=([^;]+)/.exec(spec.rrule)?.[1].split(',') ?? [];
		const isOccurrence = timed === (spec.start !== null) && day >= spec.date && byday.includes(weekday(day)) && time === spec.start;
		if (!isOccurrence || event.exdates.includes(day)) return fail(3, `no occurrence ${op.occurrence} in ${op.ref}`);
		event.exdates = [...event.exdates, day].sort();
		save(s);
		return { ok: true, action: 'deleted', ids: [op.ref], kind: 'event', name: spec.title };
	}

	/** @param {ProtonOp | null} op @param {string[] | null} argv @param {number} code @param {Record<string, string | undefined>} env @param {number} at */
	function log(op, argv, code, env, at) {
		/** @type {Record<string, string | null>} */
		const logged = {};
		for (const k of LOGGED_ENV) logged[k] = env[k] ?? null;
		/** @type {FakeCall} */
		const entry = { at, end: Date.now(), argv, op, code, env: logged };
		appendFileSync(callsFile, `${JSON.stringify(entry)}\n`);
	}

	/**
	 * What the executable does.
	 * @param {string[]} argv
	 * @param {Record<string, string | undefined>} env
	 * @returns {{ code: number, stdout: string, stderr: string }}
	 */
	function run(argv, env) {
		const at = Date.now();
		/** @param {ProtonOp | null} op @param {number} code @param {string} message */
		const refuse = (op, code, message) => {
			log(op, argv, code, env, at);
			return { code, stdout: '', stderr: `${errorLine(message)}\n` };
		};
		for (const flag of ENV_FLAGS) if (env[flag] !== '1') return refuse(null, 1, `${flag}=1 is required (the fake never prompts)`);
		const parsed = parseArgv(argv);
		if ('error' in parsed) return refuse(null, 1, parsed.error);
		const { op } = parsed;
		if (parsed.output !== 'json') return refuse(op, 1, '--output json is required');
		if (!parsed.profile) return refuse(op, 1, '--profile is required');
		if ((op.kind === 'event.delete' || op.kind === 'event.deleteOccurrence') && !parsed.yes) return refuse(op, 1, 'refusing to delete without --yes');
		if ((op.kind === 'event.create' || op.kind === 'event.update') && op.spec.start !== null && parsed.zone !== ZONE) {
			return refuse(op, 1, `--zone ${ZONE} is required for a timed event`);
		}
		const done = perform(op, env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone);
		log(op, argv, done.ok ? 0 : done.code, env, at);
		if (!done.ok) return { code: done.code, stdout: '', stderr: `${done.error}\n` };
		const envelope = { action: done.action, count: 1, dry_run: false, ids: done.ids, kind: done.kind, name: done.name };
		return { code: 0, stdout: `${JSON.stringify(envelope)}\n`, stderr: '' };
	}

	return {
		/** In-process, same state machine, logs the call. @param {ProtonOp} op @param {string} [tz] @returns {CliResult} */
		apply(op, tz = ZONE) {
			const at = Date.now();
			const done = perform(op, tz);
			log(op, null, done.ok ? 0 : done.code, process.env, at);
			return done.ok ? { ok: true, ids: done.ids } : { ok: false, code: done.code, error: done.error };
		},
		run,
		/** @returns {FakeCall[]} */
		calls() {
			if (!existsSync(callsFile)) return [];
			return readFileSync(callsFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
		},
		/** @returns {FakeState} */
		state() {
			const { calendars, events } = load();
			return { calendars, events };
		},
		/** @param {FailureRule} rule */
		fail(rule) {
			writeFileSync(failuresFile, JSON.stringify([...loadFailures(), rule]));
		},
		clearFailures() {
			rmSync(failuresFile, { force: true });
		},
		/** "Deleted by hand in Proton". @param {string} ref */
		dropEvent(ref) {
			const s = load();
			delete s.events[ref];
			save(s);
		},
		/** @param {string} id */
		dropCalendar(id) {
			const s = load();
			delete s.calendars[id];
			for (const [ref, e] of Object.entries(s.events)) if (e.calendarId === id) delete s.events[ref];
			save(s);
		},
		reset() {
			for (const f of [stateFile, callsFile, failuresFile]) rmSync(f, { force: true });
		}
	};
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
	const dir = process.env.FAKE_PROTON_DIR;
	if (!dir) {
		process.stderr.write('Error: FAKE_PROTON_DIR is not set\n');
		process.exit(1);
	}
	const { code, stdout, stderr } = createFake(dir).run(process.argv.slice(2), process.env);
	process.stdout.write(stdout);
	process.stderr.write(stderr);
	process.exitCode = code;
}
