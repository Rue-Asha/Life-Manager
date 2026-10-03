import type { DatabaseSync } from 'node:sqlite';
import type { Id, IsoDate, RecurringRule, Result, RuleInput, Sprint, Todo } from '$lib/types';

export function listRules(db: DatabaseSync): RecurringRule[] {
	throw new Error('not implemented');
}

export function createRule(db: DatabaseSync, input: RuleInput, today: IsoDate): Result<RecurringRule> {
	throw new Error('not implemented');
}

export function updateRule(db: DatabaseSync, id: Id, input: RuleInput): Result<RecurringRule> {
	throw new Error('not implemented');
}

export function deleteRule(db: DatabaseSync, id: Id): Result<void> {
	throw new Error('not implemented');
}

export function generateInstances(db: DatabaseSync, sprint: Sprint, fromDay: IsoDate): Todo[] {
	throw new Error('not implemented');
}
