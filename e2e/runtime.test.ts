import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { expect, test, reset, seed, setClock } from './helpers';

const runtimePort = Number(process.env.PORT ?? 4173) + 1000;
const runtimeUrl = `http://localhost:${runtimePort}`;

interface Server {
	proc: ChildProcess;
	exited: Promise<number | null>;
}

function startBuild(databasePath: string): Server {
	const env = {
		...process.env,
		PORT: String(runtimePort),
		DATABASE_PATH: databasePath,
		PROTOCOL_HEADER: 'x-forwarded-proto'
	};
	delete env.LM_TEST;
	const proc = spawn('node', ['build'], { cwd: process.env.E2E_APP_DIR, env, stdio: 'ignore' });
	const exited = new Promise<number | null>((resolve) => proc.on('exit', (code) => resolve(code)));
	return { proc, exited };
}

async function waitUntilHealthy(server: Server): Promise<void> {
	let exited = false;
	server.exited.then(() => (exited = true));
	for (let i = 0; i < 100 && !exited; i++) {
		const ok = await fetch(`${runtimeUrl}/healthz`).then((r) => r.ok, () => false);
		if (ok) return;
		await new Promise((r) => setTimeout(r, 100));
	}
	throw new Error(exited ? 'node build exited' : 'node build did not become healthy');
}

async function stop(server: Server): Promise<void> {
	server.proc.kill();
	await server.exited;
}

// What the browser sends through nginx: the form's own origin, and the proxy's protocol header.
function createAspect(name: string, proto: string | null = 'http'): Promise<Response> {
	return fetch(`${runtimeUrl}/aspects?/create`, {
		method: 'POST',
		headers: {
			origin: runtimeUrl,
			'x-sveltekit-action': 'true',
			...(proto ? { 'x-forwarded-proto': proto } : {})
		},
		body: new URLSearchParams({ name, color: 'sage', icon: 'heart' })
	});
}

let dir: string;

test.beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'life-manager-runtime-'));
});

test.afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

test('Scenario: Health check returns 200', async ({ request }) => {
	const response = await request.get('/healthz');
	expect(response.status()).toBe(200);
});

test('test hooks reset, seed and set the clock', async ({ request }) => {
	await reset(request);
	const ids = await seed(request, {
		aspects: [{ name: 'Health' }, { name: 'Uni', color: 'sky', icon: 'cap' }],
		sprint: { state: 'active', weekStart: '2026-09-28' },
		rules: [{ title: 'Gym', aspect: 0, weekdays: [1, 3] }],
		todos: [
			{ title: 'Read', aspect: 1, inSprint: true, day: '2026-09-29', checklist: ['ch. 1'] },
			{ title: 'Gym', rule: 0, inSprint: true, status: 'done' }
		]
	});
	expect(ids.aspects).toHaveLength(2);
	expect(ids.sprint).not.toBeNull();
	expect(ids.rules).toHaveLength(1);
	expect(ids.todos).toHaveLength(2);
	await setClock(request, '2026-10-01T10:00:00Z');
	await setClock(request, null);
	await reset(request);
	expect((await seed(request, {})).aspects).toEqual([]);
});

test('Scenario: Port and database path come from the environment', async () => {
	const databasePath = join(dir, 'db.sqlite');
	const server = startBuild(databasePath);
	try {
		await waitUntilHealthy(server);
		expect((await fetch(`${runtimeUrl}/healthz`)).status).toBe(200);
		expect(existsSync(databasePath)).toBe(true);
	} finally {
		await stop(server);
	}
});

test('Scenario: Missing database directory is created', async () => {
	const databaseDir = join(dir, 'missing', 'nested');
	const server = startBuild(join(databaseDir, 'db.sqlite'));
	try {
		await waitUntilHealthy(server);
		expect(existsSync(databaseDir)).toBe(true);
	} finally {
		await stop(server);
	}
});

test('Scenario: Migration failure exits non-zero', async () => {
	const databasePath = join(dir, 'db.sqlite');
	const db = new DatabaseSync(databasePath);
	db.exec('CREATE TABLE aspects (legacy TEXT)');
	db.close();
	const server = startBuild(databasePath);
	const code = await Promise.race([
		server.exited,
		new Promise<'running'>((r) => setTimeout(() => r('running'), 10_000))
	]);
	if (code === 'running') await stop(server);
	expect(code).not.toBe('running');
	expect(code).not.toBe(0);
});

test('test hooks answer 404 without LM_TEST', async () => {
	const server = startBuild(join(dir, 'db.sqlite'));
	try {
		await waitUntilHealthy(server);
		for (const hook of ['reset', 'clock', 'seed']) {
			const response = await fetch(`${runtimeUrl}/__test/${hook}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: '{}'
			});
			expect(response.status).toBe(404);
		}
	} finally {
		await stop(server);
	}
});

test('Scenario: Data survives a restart', async ({ page }) => {
	const databasePath = join(dir, 'db.sqlite');
	let server = startBuild(databasePath);
	try {
		await waitUntilHealthy(server);
		const created = await createAspect('Health');
		expect(created.status).toBe(200);
		expect((await created.json()).type).toBe('success');
	} finally {
		await stop(server);
	}

	server = startBuild(databasePath);
	try {
		await waitUntilHealthy(server);
		await page.goto(`${runtimeUrl}/aspects`);
		await expect(page).toHaveURL(/\/aspects$/);
		await expect(page.getByRole('main')).toContainText('Health');
	} finally {
		await stop(server);
	}
});

test('form posts without the proxy protocol header fail the origin check', async () => {
	const server = startBuild(join(dir, 'db.sqlite'));
	try {
		await waitUntilHealthy(server);
		expect((await createAspect('Health', null)).status).toBe(403);
	} finally {
		await stop(server);
	}
});
