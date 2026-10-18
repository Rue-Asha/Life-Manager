import type { DatabaseSync } from 'node:sqlite';
import type { Id, IsoDate, RecurringRule, Todo } from '$lib/types';
import { addDays, weekdayOf } from '$lib/week';
import { archivedRuleIds, projectionStart } from '../calendar';
import { listRules } from '../recurring';
import { selectTodos } from '../sprints';
import { getUniAspectId } from '../uni';
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

const DAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

function seriesItem(r: RecurringRule, from: IsoDate, todos: Todo[], rooms: Map<Id, string>): DesiredItem {
	const weekdays = [...r.weekdays].sort((a, b) => a - b);
	let date = from;
	while (!weekdays.includes(weekdayOf(date))) date = addDays(date, 1);
	const exdates = [
		...new Set(todos.filter((t) => t.ruleId === r.id && t.day! >= date && weekdays.includes(weekdayOf(t.day!))).map((t) => t.day!))
	].sort();
	return {
		key: `rule:${r.id}`,
		aspectId: r.aspectId,
		label: r.title,
		spec: {
			title: r.title,
			description: r.notes,
			location: (r.classId !== null && rooms.get(r.classId)) || '',
			date,
			start: r.startTime,
			end: r.endTime,
			durationMin: r.startTime !== null && r.endTime === null ? 30 : null,
			rrule: `FREQ=WEEKLY;BYDAY=${weekdays.map((d) => DAY_CODES[d - 1]).join(',')}`,
			exdates
		}
	};
}

function examItems(db: DatabaseSync, today: IsoDate, synced: Set<string>): DesiredItem[] {
	const aspectId = getUniAspectId(db);
	if (aspectId === null) return [];
	const rows = db
		.prepare('SELECT id, name, exam_at, exam_room FROM classes WHERE exam_at IS NOT NULL ORDER BY id')
		.all() as { id: number; name: string; exam_at: string; exam_room: string | null }[];
	return rows
		.filter((c) => c.exam_at.slice(0, 10) >= today || synced.has(`exam:${c.id}`))
		.map((c) => {
			const timed = c.exam_at.length > 10;
			return {
				key: `exam:${c.id}`,
				aspectId,
				label: `Exam · ${c.name}`,
				spec: {
					title: `Exam · ${c.name}`,
					description: '',
					location: c.exam_room ?? '',
					date: c.exam_at.slice(0, 10),
					start: timed ? c.exam_at.slice(11, 16) : null,
					end: null,
					durationMin: timed ? 120 : null,
					rrule: null,
					exdates: []
				}
			};
		});
}

export function desiredState(db: DatabaseSync, today: IsoDate): DesiredItem[] {
	const rooms = classRooms(db);
	const synced = new Set(
		(db.prepare('SELECT key FROM proton_items WHERE event_ref IS NOT NULL').all() as { key: string }[]).map((r) => r.key)
	);
	const todos = selectTodos(db, 'day IS NOT NULL').filter((t) => t.day! >= today || synced.has(`todo:${t.id}`));
	const from = projectionStart(db, today);
	const archived = archivedRuleIds(db);
	const series = listRules(db)
		.filter((r) => !archived.has(r.id))
		.map((r) => seriesItem(r, from, todos, rooms));
	return [...todos.map((t) => todoItem(t, rooms)), ...series, ...examItems(db, today, synced)];
}
