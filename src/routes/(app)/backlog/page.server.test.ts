import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDb } from '$lib/server/db';
import { createAspect } from '$lib/server/aspects';
import { createTodo } from '$lib/server/todos';

let db: DatabaseSync;
vi.mock('$lib/server/db', async (orig) => ({ ...(await orig<typeof import('$lib/server/db')>()), getDb: () => db }));

const { load } = await import('./+page.server');

function run(query: string) {
	const url = new URL(`http://localhost/backlog${query}`);
	return load({ url } as Parameters<typeof load>[0]) as { todos: { title: string }[]; aspectId: number | null };
}

let health: number;
beforeEach(() => {
	db = openDb(':memory:');
	const a = createAspect(db, { name: 'Health', color: 'sage', icon: 'heart' });
	const b = createAspect(db, { name: 'Work', color: 'sage', icon: 'briefcase' });
	if (!a.ok || !b.ok) throw new Error('setup');
	health = a.value.id;
	createTodo(db, { title: 'Run', aspectId: a.value.id });
	createTodo(db, { title: 'Report', aspectId: b.value.id });
});

describe('backlog load', () => {
	it('Scenario: Non-numeric aspect parameter shows an empty list', () => {
		const data = run('?aspect=abc');
		expect(data.todos).toEqual([]);
		expect(data.aspectId).toBeNull();
	});

	it('Scenario: Unknown aspect id shows an empty list', () => {
		const data = run('?aspect=999');
		expect(data.todos).toEqual([]);
		expect(data.aspectId).toBeNull();
	});

	it('Scenario: Missing or empty aspect parameter shows everything', () => {
		for (const q of ['', '?aspect=']) {
			const data = run(q);
			expect(data.todos).toHaveLength(2);
			expect(data.aspectId).toBeNull();
		}
	});

	it('Scenario: Valid aspect parameter filters', () => {
		const data = run(`?aspect=${health}`);
		expect(data.todos.map((t) => t.title)).toEqual(['Run']);
		expect(data.aspectId).toBe(health);
	});
});
