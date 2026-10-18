import { execFile } from 'node:child_process';
import type { CliResult, EventSpec, ProtonConfig, ProtonOp, Runner } from './types';

const ZONE = 'Europe/Berlin';

function specFlags(spec: EventSpec, update: boolean): string[] {
	const flags = ['--title', spec.title, '--description', spec.description, '--location', spec.location, '--zone', ZONE];
	if (spec.start === null) flags.push('--start', spec.date, '--all-day');
	else {
		flags.push('--start', `${spec.date}T${spec.start}`);
		if (spec.end !== null) flags.push('--end', `${spec.date}T${spec.end}`);
		else if (spec.durationMin !== null) {
			flags.push('--duration', spec.durationMin % 60 === 0 ? `${spec.durationMin / 60}h` : `${spec.durationMin}m`);
		}
		if (update) flags.push('--all-day=false');
	}
	if (spec.rrule !== null) flags.push('--rrule', spec.rrule);
	return flags;
}

export function toArgv(op: ProtonOp, profile: string): string[] {
	const head = ['--output', 'json', '--profile', profile];
	switch (op.kind) {
		case 'calendar.create':
			return [...head, 'calendar', 'settings', 'calendars', 'create', '--name', op.name, '--color', op.color];
		case 'event.create':
			return [...head, 'calendar', 'events', 'create', '--calendar', op.calendarId, ...specFlags(op.spec, false)];
		case 'event.update':
			return [...head, 'calendar', 'events', 'update', op.ref, ...specFlags(op.spec, true)];
		case 'event.delete':
			return [...head, 'calendar', 'events', 'delete', op.ref, '--yes'];
		case 'event.deleteOccurrence':
			return [...head, 'calendar', 'events', 'delete', `${op.ref}@${op.occurrence}`, '--yes'];
	}
}

// TZ is set because proton-cli reads a timed occurrence reference in the process's local zone, not in --zone.
const CHILD_ENV = { PROTON_NO_INPUT: '1', PROTON_NO_UPDATE_CHECK: '1', PROTON_NO_LOG: '1', TZ: ZONE };

function errorLine(stderr: string): string {
	const lines = stderr.split('\n').map((l) => l.trim()).filter(Boolean);
	return lines.find((l) => l.startsWith('Error:')) ?? lines.at(-1) ?? 'proton exited without a message';
}

function exec(cfg: ProtonConfig, op: ProtonOp): Promise<CliResult> {
	return new Promise((done) => {
		execFile(cfg.cli, toArgv(op, cfg.profile), { env: { ...process.env, ...CHILD_ENV } }, (err, stdout, stderr) => {
			if (!err) {
				try {
					const { ids } = JSON.parse(stdout) as { ids: string[] };
					return done({ ok: true, ids });
				} catch {
					return done({ ok: false, code: 'spawn', error: 'proton printed no JSON result' });
				}
			}
			if (err.code === 'ENOENT' || err.code === 'EACCES') return done({ ok: false, code: 'spawn', error: err.message });
			done({ ok: false, code: typeof err.code === 'number' ? err.code : 1, error: errorLine(stderr) });
		});
	});
}

export function createRunner(cfg: ProtonConfig, o?: { gapMs?: number }): Runner {
	const gapMs = o?.gapMs ?? 1000;
	let chain: Promise<unknown> = Promise.resolve();
	let lastEnd = 0;
	return (op) => {
		const result = chain.then(async () => {
			const wait = lastEnd + gapMs - Date.now();
			if (wait > 0) await new Promise((r) => setTimeout(r, wait));
			try {
				return await exec(cfg, op);
			} finally {
				lastEnd = Date.now();
			}
		});
		chain = result;
		return result;
	};
}
