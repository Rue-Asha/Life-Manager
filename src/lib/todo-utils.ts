import type { IsoDate, Priority, Todo } from '$lib/types';

export function isOverdue(todo: Pick<Todo, 'dueDate' | 'status'>, today: IsoDate): boolean {
	return todo.dueDate !== null && todo.dueDate < today && todo.status !== 'done';
}

export function isPriority(p: unknown): p is Priority {
	return p === 0 || p === 1 || p === 2 || p === 3;
}
