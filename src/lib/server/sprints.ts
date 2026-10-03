import type { DatabaseSync } from 'node:sqlite';
import type {
	Id,
	IsoDate,
	Result,
	ReviewDecision,
	Sprint,
	SprintPhase,
	Status,
	Todo
} from '$lib/types';

export function sprintPhase(db: DatabaseSync, today: IsoDate): { phase: SprintPhase; sprint: Sprint | null } {
	throw new Error('not implemented');
}

export function getActiveSprint(db: DatabaseSync): Sprint | null {
	throw new Error('not implemented');
}

export function openPlanning(
	db: DatabaseSync,
	today: IsoDate
): Result<{ sprint: Sprint; weekStart: IsoDate }> {
	throw new Error('not implemented');
}

export function suggestedTodos(db: DatabaseSync, today: IsoDate): Todo[] {
	throw new Error('not implemented');
}

export function pullTodo(db: DatabaseSync, todoId: Id): Result<Todo> {
	throw new Error('not implemented');
}

export function unpullTodo(db: DatabaseSync, todoId: Id): Result<Todo> {
	throw new Error('not implemented');
}

export function startSprint(db: DatabaseSync, today: IsoDate, suggestedIds: Id[]): Result<Sprint> {
	throw new Error('not implemented');
}

export function listSprintTodos(db: DatabaseSync, sprintId: Id): Todo[] {
	throw new Error('not implemented');
}

export function listToday(db: DatabaseSync, today: IsoDate): Todo[] {
	throw new Error('not implemented');
}

export function addToActiveSprint(db: DatabaseSync, todoId: Id): Result<Todo> {
	throw new Error('not implemented');
}

export function moveToBacklog(db: DatabaseSync, todoId: Id): Result<Todo> {
	throw new Error('not implemented');
}

export function setStatus(db: DatabaseSync, todoId: Id, status: Status): Result<Todo> {
	throw new Error('not implemented');
}

export function toggleDone(db: DatabaseSync, todoId: Id): Result<Todo> {
	throw new Error('not implemented');
}

export function setDay(db: DatabaseSync, todoId: Id, day: IsoDate | null): Result<Todo> {
	throw new Error('not implemented');
}

export function reviewSummary(db: DatabaseSync): { sprint: Sprint; done: Todo[]; open: Todo[] } | null {
	throw new Error('not implemented');
}

export function closeReview(
	db: DatabaseSync,
	today: IsoDate,
	decisions: Record<Id, ReviewDecision>
): Result<Sprint> {
	throw new Error('not implemented');
}
