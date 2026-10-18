import type { DatabaseSync } from 'node:sqlite';
import type { Id, IsoDate, Todo } from '$lib/types';
import { selectTodos } from '../sprints';
import type { DesiredItem } from './types';

function classRooms(db: DatabaseSync): Map<Id, string> {
	const rows = db.prepare('SELECT id, room FROM classes WHERE room IS NOT NULL').all() as { id: number; room: string }[];
	return new Map(rows.map((r) => [r.id, r.room]));
}

function todoItem(t: Todo, rooms: Map<Id, string>): DesiredItem {
	return {
		key: `todo:${t.id}`,
		aspectId: t.aspectId,
		label: t.title,
		spec: {
			title: t.status === 'done' ? `✓ ${t.title}` : t.title,
			description: t.notes,
			location: (t.classId !== null && rooms.get(t.classId)) || '',
			date: t.day!,
			start: t.startTime,
			end: t.endTime,
			durationMin: t.startTime !== null && t.endTime === null ? 30 : null,
			rrule: null,
			exdates: []
		}
	};
}

export function desiredState(db: DatabaseSync, today: IsoDate): DesiredItem[] {
	const rooms = classRooms(db);
	return selectTodos(db, 'day IS NOT NULL').map((t) => todoItem(t, rooms));
}
