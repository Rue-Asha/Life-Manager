import type { DatabaseSync } from 'node:sqlite';
import type { ChecklistItem, Id, IsoDate, NewTodo, Result, Todo, TodoPatch } from '$lib/types';

export function createTodo(db: DatabaseSync, input: NewTodo): Result<Todo> {
	throw new Error('not implemented');
}

export function getTodo(db: DatabaseSync, id: Id): Todo | null {
	throw new Error('not implemented');
}

export function updateTodo(db: DatabaseSync, id: Id, patch: TodoPatch): Result<Todo> {
	throw new Error('not implemented');
}

export function deleteTodo(db: DatabaseSync, id: Id): Result<void> {
	throw new Error('not implemented');
}

export function addChecklistItem(db: DatabaseSync, todoId: Id, text: string): Result<ChecklistItem> {
	throw new Error('not implemented');
}

export function renameChecklistItem(db: DatabaseSync, itemId: Id, text: string): Result<ChecklistItem> {
	throw new Error('not implemented');
}

export function toggleChecklistItem(db: DatabaseSync, itemId: Id, done: boolean): Result<ChecklistItem> {
	throw new Error('not implemented');
}

export function deleteChecklistItem(db: DatabaseSync, itemId: Id): Result<void> {
	throw new Error('not implemented');
}

export function listBacklog(db: DatabaseSync, aspectId?: Id): Todo[] {
	throw new Error('not implemented');
}

export function listOverdue(db: DatabaseSync, today: IsoDate): Todo[] {
	throw new Error('not implemented');
}
