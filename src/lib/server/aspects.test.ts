import { describe, expect, it } from 'vitest';
import { openDb } from './db';
import {
	aspectUsage,
	countAspects,
	createAspect,
	deleteAspect,
	listAspects,
	updateAspect
} from './aspects';
import type { AspectInput, Id } from '$lib/types';

const health: AspectInput = { name: 'Health', color: 'sage', icon: 'heart' };
const uni: AspectInput = { name: 'Uni', color: 'lavender', icon: 'cap' };

function create(db: ReturnType<typeof openDb>, input: AspectInput): Id {
	const r = createAspect(db, input);
	if (!r.ok) throw new Error(r.error);
	return r.value.id;
}

describe('aspects', () => {
	it('Scenario: Duplicate aspect name is rejected', () => {
		const db = openDb(':memory:');
		create(db, health);
		const uniId = create(db, uni);

		expect(createAspect(db, { ...uni, name: 'health' })).toEqual({
			ok: false,
			error: 'duplicate',
			field: 'name'
		});
		expect(updateAspect(db, uniId, { ...uni, name: 'health' })).toEqual({
			ok: false,
			error: 'duplicate',
			field: 'name'
		});
		expect(listAspects(db).map((a) => a.name)).toEqual(['Health', 'Uni']);
	});

	it('creates aspects in order with trimmed names', () => {
		const db = openDb(':memory:');
		const r = createAspect(db, { ...health, name: '  Health ' });
		expect(r).toEqual({ ok: true, value: { id: expect.any(Number), ...health, position: 0 } });
		create(db, uni);
		expect(listAspects(db).map((a) => [a.name, a.position])).toEqual([
			['Health', 0],
			['Uni', 1]
		]);
		expect(countAspects(db)).toBe(2);
	});

	it('rejects empty names and unknown colours or icons', () => {
		const db = openDb(':memory:');
		expect(createAspect(db, { ...health, name: '   ' })).toEqual({ ok: false, error: 'required', field: 'name' });
		expect(createAspect(db, { ...health, color: 'neon' as never })).toEqual({
			ok: false,
			error: 'required',
			field: 'color'
		});
		expect(createAspect(db, { ...health, icon: 'rocket' as never })).toEqual({
			ok: false,
			error: 'required',
			field: 'icon'
		});
		expect(countAspects(db)).toBe(0);
	});

	it('updates name, colour and icon; keeping its own name is not a duplicate', () => {
		const db = openDb(':memory:');
		const id = create(db, health);
		expect(updateAspect(db, id, { name: 'HEALTH', color: 'sky', icon: 'leaf' })).toEqual({
			ok: true,
			value: { id, name: 'HEALTH', color: 'sky', icon: 'leaf', position: 0 }
		});
		expect(updateAspect(db, id + 99, health)).toEqual({ ok: false, error: 'not-found' });
	});

	it('counts todos and rules using an aspect', () => {
		const db = openDb(':memory:');
		const id = create(db, health);
		const now = new Date().toISOString();
		db.prepare('INSERT INTO todos (title, aspect_id, created_at) VALUES (?, ?, ?)').run('Run', id, now);
		db.prepare('INSERT INTO todos (title, aspect_id, created_at) VALUES (?, ?, ?)').run('Stretch', id, now);
		db.prepare(
			'INSERT INTO recurring_rules (title, aspect_id, weekdays, created_at) VALUES (?, ?, ?, ?)'
		).run('Gym', id, '1,3', now);
		expect(aspectUsage(db, id)).toEqual({ todos: 2, rules: 1 });
	});
});
