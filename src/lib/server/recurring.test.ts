import type { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Id, Priority, RuleInput, Weekday } from '$lib/types';
import { openDb } from './db';
import { createRule, deleteRule, listRules, updateRule } from './recurring';
import { closeReview, getActiveSprint, listSprintTodos, setStatus, startSprint } from './sprints';

let db: DatabaseSync;
let aspect: Id;

beforeEach(() => {
	db = openDb(':memory:');
	aspect = Number(
		db
			.prepare(
				"INSERT INTO aspects (name, color, icon, position, created_at) VALUES ('Health', 'sage', 'heart', 0, '')"
			)
			.run().lastInsertRowid
	);
});

function gym(input: Partial<RuleInput> = {}): RuleInput {
	return { title: 'Gym', aspectId: aspect, weekdays: [1, 4], ...input };
}

function activeTodos() {
	return listSprintTodos(db, getActiveSprint(db)!.id);
}

describe('recurring rules', () => {
	it('Scenario: Rule without weekdays is rejected', () => {
		expect(createRule(db, gym({ weekdays: [] }), '2026-10-07')).toEqual({
			ok: false,
			error: 'weekdays-required',
			field: 'weekdays'
		});
		expect(listRules(db)).toEqual([]);
		const rule = createRule(db, gym(), '2026-10-07');
		const id = rule.ok ? rule.value.id : 0;
		expect(updateRule(db, id, gym({ weekdays: [] }))).toEqual({
			ok: false,
			error: 'weekdays-required',
			field: 'weekdays'
		});
		expect(listRules(db)[0].weekdays).toEqual([1, 4]);
	});

	it('Scenario: Starting a sprint adds one instance per weekday', () => {
		createRule(db, gym({ weekdays: [4, 1], checklist: ['Warm up', 'Stretch'], priority: 2 }), '2026-10-07');
		startSprint(db, '2026-10-07', []);
		const instances = activeTodos();
		expect(instances).toHaveLength(2);
		expect(instances.map((t) => t.day).sort()).toEqual(['2026-10-05', '2026-10-08']);
		for (const t of instances) {
			expect(t).toMatchObject({ title: 'Gym', status: 'todo', recurring: true, priority: 2, aspectId: aspect });
			expect(t.checklist.map((i) => [i.text, i.done])).toEqual([
				['Warm up', false],
				['Stretch', false]
			]);
		}
		expect(instances[0].checklist[0].id).not.toBe(instances[1].checklist[0].id);
	});

	it('Scenario: Rule created mid-sprint fills the remaining days', () => {
		startSprint(db, '2026-10-05', []);
		createRule(db, gym({ weekdays: [1, 3, 5] }), '2026-10-07');
		expect(activeTodos().map((t) => t.day).sort()).toEqual(['2026-10-07', '2026-10-09']);
	});

	it('Scenario: Editing a rule affects only future sprints', () => {
		startSprint(db, '2026-10-05', []);
		const rule = createRule(db, gym(), '2026-10-05');
		const id = rule.ok ? rule.value.id : 0;
		const updated = updateRule(db, id, gym({ title: 'Swim', weekdays: [2] }));
		expect(updated).toMatchObject({ ok: true, value: { title: 'Swim', weekdays: [2] } });
		const current = activeTodos();
		expect(current.map((t) => [t.title, t.day])).toEqual([
			['Gym', '2026-10-05'],
			['Gym', '2026-10-08']
		]);

		closeReview(db, '2026-10-11', Object.fromEntries(current.map((t) => [t.id, 'drop'])));
		startSprint(db, '2026-10-11', []);
		expect(activeTodos().map((t) => [t.title, t.day])).toEqual([['Swim', '2026-10-13']]);
	});

	it('Scenario: Deleting a rule keeps existing instances', () => {
		const rule = createRule(db, gym(), '2026-10-07');
		const id = rule.ok ? rule.value.id : 0;
		startSprint(db, '2026-10-07', []);
		expect(deleteRule(db, id)).toEqual({ ok: true, value: undefined });
		expect(listRules(db)).toEqual([]);
		const instances = activeTodos();
		expect(instances).toHaveLength(2);
		for (const t of instances) expect(t).toMatchObject({ recurring: true, ruleId: null });
		expect(deleteRule(db, id)).toEqual({ ok: false, error: 'not-found' });
	});

	it('a missing aspect or unknown priority is refused, not thrown', () => {
		expect(createRule(db, gym({ aspectId: aspect + 99 }), '2026-10-07')).toEqual({
			ok: false,
			error: 'no-aspect',
			field: 'aspectId'
		});
		expect(createRule(db, gym({ priority: NaN as Priority }), '2026-10-07')).toEqual({
			ok: false,
			error: 'required',
			field: 'priority'
		});
		const rule = createRule(db, gym(), '2026-10-07');
		const id = rule.ok ? rule.value.id : 0;
		expect(updateRule(db, id, gym({ aspectId: aspect + 99 }))).toEqual({
			ok: false,
			error: 'no-aspect',
			field: 'aspectId'
		});
		expect(updateRule(db, id, gym({ priority: 7 as Priority }))).toEqual({
			ok: false,
			error: 'required',
			field: 'priority'
		});
		expect(listRules(db)).toMatchObject([{ aspectId: aspect, priority: 0 }]);
	});

	it('weekdays outside Monday to Sunday are refused', () => {
		for (const weekdays of [[8], [0], [1, NaN]] as Weekday[][]) {
			expect(createRule(db, gym({ weekdays }), '2026-10-07')).toEqual({
				ok: false,
				error: 'weekdays-required',
				field: 'weekdays'
			});
		}
		expect(listRules(db)).toEqual([]);
		const rule = createRule(db, gym(), '2026-10-07');
		const id = rule.ok ? rule.value.id : 0;
		expect(updateRule(db, id, gym({ weekdays: [1, 8] as Weekday[] }))).toEqual({
			ok: false,
			error: 'weekdays-required',
			field: 'weekdays'
		});
		expect(listRules(db)).toMatchObject([{ weekdays: [1, 4] }]);
	});

	it('rule title is required and fields are stored', () => {
		expect(createRule(db, gym({ title: '  ' }), '2026-10-07')).toEqual({
			ok: false,
			error: 'required',
			field: 'title'
		});
		const rule = createRule(db, gym({ title: ' Gym ', weekdays: [4, 1, 4], notes: 'Legs', checklist: ['Warm up'] }), '2026-10-07');
		expect(rule).toEqual({
			ok: true,
			value: { id: expect.any(Number), title: 'Gym', aspectId: aspect, weekdays: [1, 4], notes: 'Legs', priority: 0, checklist: ['Warm up'] }
		});
		expect(listRules(db)).toEqual([rule.ok && rule.value]);
		expect(updateRule(db, 999, gym())).toEqual({ ok: false, error: 'not-found' });
	});
});

describe('carried recurring instances', () => {
	function carryInto(next: (ids: Id[]) => void = () => {}) {
		const instances = activeTodos();
		closeReview(db, '2026-10-11', {});
		next(instances.map((t) => t.id));
		startSprint(db, '2026-10-11', []);
	}

	it('Scenario: Carried recurring instance is not duplicated', () => {
		const rule = createRule(db, gym(), '2026-10-01');
		const id = rule.ok ? rule.value.id : 0;
		startSprint(db, '2026-10-05', []);
		const [monday, thursday] = activeTodos();
		setStatus(db, monday.id, 'done');
		setStatus(db, thursday.id, 'doing');
		carryInto();
		const instances = activeTodos().filter((t) => t.ruleId === id);
		expect(instances.map((t) => [t.id === thursday.id, t.day, t.status])).toEqual([
			[true, '2026-10-12', 'doing'],
			[false, '2026-10-15', 'todo']
		]);
	});

	it('Scenario: Carried instance of a deleted rule keeps no day', () => {
		const rule = createRule(db, gym({ weekdays: [4] }), '2026-10-01');
		startSprint(db, '2026-10-05', []);
		const [carried] = activeTodos();
		carryInto(() => deleteRule(db, rule.ok ? rule.value.id : 0));
		expect(activeTodos().map((t) => [t.id, t.day, t.ruleId])).toEqual([[carried.id, null, null]]);
	});

	it('Scenario: More carried instances than weekdays', () => {
		const rule = createRule(db, gym(), '2026-10-01');
		const id = rule.ok ? rule.value.id : 0;
		startSprint(db, '2026-10-05', []);
		const [first, second] = activeTodos();
		carryInto(() => updateRule(db, id, gym({ weekdays: [1] })));
		expect(activeTodos().map((t) => [t.id, t.day])).toEqual([
			[first.id, '2026-10-12'],
			[second.id, null]
		]);
	});
});
