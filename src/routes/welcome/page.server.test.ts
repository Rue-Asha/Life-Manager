import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openDb } from '$lib/server/db';
import { createAspect, listAspects } from '$lib/server/aspects';

const db = openDb(':memory:');
vi.mock('$lib/server/db', async (orig) => ({ ...(await orig<object>()), getDb: () => db }));

const { load, actions } = await import('./+page.server');

function seed(name: string) {
	const r = createAspect(db, { name, color: 'sage', icon: 'heart' });
	if (!r.ok) throw new Error(r.error);
}

function create(fields: [string, string][]) {
	const body = new URLSearchParams(fields);
	const request = new Request('http://x/welcome?/create', { method: 'POST', body });
	return (actions.create as (e: unknown) => Promise<unknown>)({ request });
}

const names = () => listAspects(db).map((a) => a.name);

beforeEach(() => {
	db.exec('DELETE FROM aspects');
});

describe('welcome presets', () => {
	it('Scenario: Existing presets are reported as existing', async () => {
		seed('Health');
		seed('uni');
		const data = (await (load as (e: unknown) => unknown)({})) as { existingPresets: string[] };
		expect(data.existingPresets).toEqual(['Health', 'Uni']);
	});
});

describe('welcome create', () => {
	it('Scenario: Submitting an existing preset creates nothing and does not fail', async () => {
		seed('Health');
		await expect(
			create([
				['preset', 'Health'],
				['preset', 'Job']
			])
		).rejects.toMatchObject({ status: 303, location: '/backlog' });
		expect(names()).toEqual(['Health', 'Job']);
	});

	it('Scenario: Only existing presets selected is not a duplicate error', async () => {
		seed('Health');
		const result = await create([['preset', 'Health']]);
		expect(result).toMatchObject({ status: 400, data: { error: 'required', field: 'preset' } });
		expect(names()).toEqual(['Health']);
	});

	it('Scenario: A custom name equal to an existing aspect is still a duplicate', async () => {
		seed('Health');
		const result = await create([
			['name', 'health'],
			['color', 'sky'],
			['icon', 'cap']
		]);
		expect(result).toMatchObject({ status: 400, data: { error: 'duplicate', field: 'name' } });
		expect(names()).toEqual(['Health']);
	});
});
