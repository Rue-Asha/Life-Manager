import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type { AspectColor } from '$lib/aspect-style';
import type { HhMm, Id, IsoDate, Todo } from '$lib/types';
import { addDays, monthGrid, weekdayOf } from '$lib/week';
import { listRules } from './recurring';
import { getActiveSprint, selectTodos } from './sprints';

export type CalendarEntry =
	| { kind: 'todo'; todo: Todo; startTime: HhMm | null; endTime: HhMm | null; title: string; aspectId: Id; done: boolean }
	| { kind: 'projection'; ruleId: Id; title: string; aspectId: Id; startTime: HhMm | null; endTime: HhMm | null }
	| { kind: 'exam'; classId: Id; title: string; color: AspectColor; room: string | null; startTime: HhMm | null; endTime: null };

type Row = Record<string, SQLInputValue>;

function byTime(a: CalendarEntry, b: CalendarEntry): number {
	if ((a.startTime === null) !== (b.startTime === null)) return a.startTime === null ? -1 : 1;
	if (a.startTime !== b.startTime) return a.startTime! < b.startTime! ? -1 : 1;
	return a.title.localeCompare(b.title);
}

export function calendarMonth(
	db: DatabaseSync,
	month: string,
	today: IsoDate
): { month: string; weeks: IsoDate[][]; entries: Record<IsoDate, CalendarEntry[]> } {
	const weeks = monthGrid(month);
	const days = weeks.flat().filter((d) => d.startsWith(month));
	const entries: Record<IsoDate, CalendarEntry[]> = {};
	const add = (day: IsoDate, entry: CalendarEntry) => (entries[day] ??= []).push(entry);

	for (const t of selectTodos(db, 'day >= ? AND day <= ?', days[0], days[days.length - 1])) {
		add(t.day!, { kind: 'todo', todo: t, startTime: t.startTime, endTime: t.endTime, title: t.title, aspectId: t.aspectId, done: t.status === 'done' });
	}

	const active = getActiveSprint(db);
	const projectFrom = active?.weekStart ? addDays(active.weekStart, 7) : today;
	const archived = new Set(
		(
			db
				.prepare(
					`SELECT r.id FROM recurring_rules r JOIN classes c ON c.id = r.class_id
					 JOIN semesters s ON s.id = c.semester_id WHERE s.archived_at IS NOT NULL`
				)
				.all() as Row[]
		).map((r) => Number(r.id))
	);
	const rules = listRules(db).filter((r) => !archived.has(r.id));
	for (const day of days) {
		if (day < projectFrom) continue;
		for (const r of rules) {
			if (r.weekdays.includes(weekdayOf(day))) {
				add(day, { kind: 'projection', ruleId: r.id, title: r.title, aspectId: r.aspectId, startTime: r.startTime, endTime: r.endTime });
			}
		}
	}

	const exams = db
		.prepare(
			`SELECT id, name, color, exam_at, exam_room FROM classes
			 WHERE exam_at IS NOT NULL AND substr(exam_at, 1, 10) >= ? AND substr(exam_at, 1, 10) <= ?`
		)
		.all(days[0], days[days.length - 1]) as Row[];
	for (const e of exams) {
		const at = e.exam_at as string;
		add(at.slice(0, 10), {
			kind: 'exam',
			classId: Number(e.id),
			title: e.name as string,
			color: e.color as AspectColor,
			room: e.exam_room as string | null,
			startTime: at.length > 10 ? at.slice(11, 16) : null,
			endTime: null
		});
	}

	for (const list of Object.values(entries)) list.sort(byTime);
	return { month, weeks, entries };
}
