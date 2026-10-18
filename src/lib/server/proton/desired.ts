import type { DatabaseSync } from 'node:sqlite';
import type { IsoDate } from '$lib/types';
import type { DesiredItem } from './types';

export function desiredState(db: DatabaseSync, today: IsoDate): DesiredItem[] {
	return [];
}
