import type { IsoDate, Todo } from '$lib/types';

export function isOverdue(todo: Pick<Todo, 'dueDate' | 'status'>, today: IsoDate): boolean {
	return todo.dueDate !== null && todo.dueDate < today && todo.status !== 'done';
}
