import type { DatabaseSync } from 'node:sqlite';
import type { Aspect, AspectInput, Id, Result } from '$lib/types';

export function listAspects(db: DatabaseSync): Aspect[] {
	throw new Error('not implemented');
}

export function countAspects(db: DatabaseSync): number {
	throw new Error('not implemented');
}

export function createAspect(db: DatabaseSync, input: AspectInput): Result<Aspect> {
	throw new Error('not implemented');
}

export function updateAspect(db: DatabaseSync, id: Id, input: AspectInput): Result<Aspect> {
	throw new Error('not implemented');
}

export function aspectUsage(db: DatabaseSync, id: Id): { todos: number; rules: number } {
	throw new Error('not implemented');
}

export function deleteAspect(db: DatabaseSync, id: Id, targetId?: Id): Result<void> {
	throw new Error('not implemented');
}
