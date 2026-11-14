import { beforeAll, describe, expect, it } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

const { getDb } = await import('$lib/server/db');
const { createAspect, listAspects } = await import('$lib/server/aspects');
const aspectsPage = await import('./+page.server');
const layout = await import('../+layout.server');

function post(ids: number[]) {
	const form = new FormData();
	for (const id of ids) form.append('order', String(id));
	return { request: new Request('http://localhost/aspects?/reorder', { method: 'POST', body: form }) };
}

describe('/aspects reorder action', () => {
	const ids: number[] = [];

	beforeAll(() => {
		const db = getDb();
		for (const [name, icon] of [['Health', 'heart'], ['Uni', 'cap'], ['Job', 'briefcase']] as const) {
			const r = createAspect(db, { name, color: 'sage', icon });
			if (!r.ok) throw new Error(r.error);
			ids.push(r.value.id);
		}
	});

	it('Scenario: The reorder action rewrites the order', async () => {
		const [health, uni, job] = ids;
		const result = await aspectsPage.actions.reorder(post([job, health, uni]) as never);
		expect(result).toEqual({ ok: true });

		const page = (await aspectsPage.load({} as never)) as { aspects: { id: number }[] };
		expect(page.aspects.map((a) => a.id)).toEqual([job, health, uni]);
		const root = (await layout.load({ url: new URL('http://localhost/aspects') } as never)) as {
			aspects: { id: number }[];
			nav: { aspects: { id: number }[] };
		};
		expect(root.aspects.map((a) => a.id)).toEqual([job, health, uni]);
		expect(root.nav.aspects.map((a) => a.id)).toEqual([job, health, uni]);
	});

	it('fails with 400 on a list that is not the full set and keeps the order', async () => {
		const before = listAspects(getDb()).map((a) => a.id);
		const result = (await aspectsPage.actions.reorder(post(before.slice(1)) as never)) as {
			status: number;
			data: { error: string; field: string };
		};
		expect(result.status).toBe(400);
		expect(result.data).toMatchObject({ error: 'invalid', field: 'order' });
		expect(listAspects(getDb()).map((a) => a.id)).toEqual(before);
	});
});
