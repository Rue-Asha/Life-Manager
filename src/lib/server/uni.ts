import type { DatabaseSync } from 'node:sqlite';
import { ASPECT_COLORS, ASPECT_ICONS } from '$lib/aspect-style';
import type {
	ClassInput,
	ClassRef,
	ClassTodos,
	Deadline,
	Grade,
	GradeSummary,
	Id,
	IsoDate,
	RecurringRule,
	Result,
	Semester,
	SemesterView,
	UniClass
} from '$lib/types';
import { GRADES } from '$lib/uni';
import { now } from './clock';
import { transaction } from './sprints';

const notImplemented = { ok: false, error: 'not-implemented' } as const;

export function getUniAspectId(db: DatabaseSync): Id | null {
	const row = db
		.prepare(
			`SELECT a.id FROM settings s JOIN aspects a ON a.id = CAST(s.value AS INTEGER)
			 WHERE s.key = 'uni_aspect_id'`
		)
		.get() as { id: Id } | undefined;
	return row?.id ?? null;
}

export function setUniAspectId(db: DatabaseSync, aspectId: Id): Result<{ unlinked: number }> {
	if (db.prepare('SELECT 1 FROM aspects WHERE id = ?').get(aspectId) === undefined) {
		return { ok: false, error: 'not-found', field: 'aspectId' };
	}
	if (getUniAspectId(db) === aspectId) return { ok: true, value: { unlinked: 0 } };
	return transaction(db, () => {
		const todos = db
			.prepare('UPDATE todos SET class_id = NULL, type = NULL, revised_at = NULL WHERE class_id IS NOT NULL')
			.run().changes;
		const rules = db.prepare('UPDATE recurring_rules SET class_id = NULL, type = NULL WHERE class_id IS NOT NULL').run().changes;
		db.prepare(
			`INSERT INTO settings (key, value) VALUES ('uni_aspect_id', ?)
			 ON CONFLICT (key) DO UPDATE SET value = excluded.value`
		).run(String(aspectId));
		return { ok: true, value: { unlinked: Number(todos) + Number(rules) } };
	});
}

export function countClassLinks(db: DatabaseSync): number {
	return (
		db
			.prepare(
				`SELECT (SELECT count(*) FROM todos WHERE class_id IS NOT NULL)
				      + (SELECT count(*) FROM recurring_rules WHERE class_id IS NOT NULL) AS n`
			)
			.get() as { n: number }
	).n;
}

export function listClassRefs(db: DatabaseSync): ClassRef[] {
	const rows = db
		.prepare(
			`SELECT c.id, c.name, c.color, c.icon, c.semester_id AS semesterId, s.archived_at IS NOT NULL AS archived
			 FROM classes c JOIN semesters s ON s.id = c.semester_id
			 ORDER BY c.name COLLATE NOCASE, c.id`
		)
		.all() as unknown as (Omit<ClassRef, 'archived'> & { archived: number })[];
	return rows.map((r) => ({ ...r, archived: r.archived === 1 }));
}

export function countOpenClassTodos(db: DatabaseSync): number {
	return (
		db
			.prepare(
				`SELECT count(*) AS n FROM todos t
				 JOIN classes c ON c.id = t.class_id JOIN semesters s ON s.id = c.semester_id
				 WHERE t.status != 'done' AND s.archived_at IS NULL`
			)
			.get() as { n: number }
	).n;
}

export function classWritable(db: DatabaseSync, classId: Id): Result<void> {
	const row = db
		.prepare('SELECT s.archived_at AS archivedAt FROM classes c JOIN semesters s ON s.id = c.semester_id WHERE c.id = ?')
		.get(classId) as { archivedAt: string | null } | undefined;
	if (!row) return { ok: false, error: 'not-found', field: 'classId' };
	if (row.archivedAt !== null) return { ok: false, error: 'archived', field: 'classId' };
	return { ok: true, value: undefined };
}

// Todos without a class, and unknown ids, pass: the write itself reports those.
export function todoWritable(db: DatabaseSync, todoId: Id): Result<void> {
	const archived = db
		.prepare(
			`SELECT 1 FROM todos t JOIN classes c ON c.id = t.class_id JOIN semesters s ON s.id = c.semester_id
			 WHERE t.id = ? AND s.archived_at IS NOT NULL`
		)
		.get(todoId);
	return archived ? { ok: false, error: 'archived' } : { ok: true, value: undefined };
}

// Unit 3 fills in the functions below.

const semesterColumns = 'id, name, archived_at AS archivedAt, created_at AS createdAt';

function getSemester(db: DatabaseSync, id: Id): Semester | null {
	const row = db.prepare(`SELECT ${semesterColumns} FROM semesters WHERE id = ?`).get(id) as Semester | undefined;
	return row ? { ...row } : null;
}

export function listSemesters(db: DatabaseSync): { active: SemesterView[]; archived: SemesterView[]; overall: GradeSummary } {
	const semesters = db
		.prepare(`SELECT ${semesterColumns} FROM semesters ORDER BY created_at DESC, id DESC`)
		.all() as unknown as Semester[];
	const views = semesters.map((s): SemesterView => ({ ...s, classes: [], grades: { average: null, earnedEcts: 0 } }));
	return {
		active: views.filter((s) => s.archivedAt === null),
		archived: views.filter((s) => s.archivedAt !== null),
		overall: { average: null, earnedEcts: 0 }
	};
}

export function createSemester(db: DatabaseSync, name: string): Result<Semester> {
	const trimmed = name.trim();
	if (!trimmed) return { ok: false, error: 'required', field: 'name' };
	const { lastInsertRowid } = db
		.prepare('INSERT INTO semesters (name, created_at) VALUES (?, ?)')
		.run(trimmed, now().toISOString());
	return { ok: true, value: getSemester(db, Number(lastInsertRowid))! };
}

export function renameSemester(db: DatabaseSync, id: Id, name: string): Result<Semester> {
	const semester = getSemester(db, id);
	if (!semester) return { ok: false, error: 'not-found' };
	const trimmed = name.trim();
	if (!trimmed) return { ok: false, error: 'required', field: 'name' };
	if (semester.archivedAt !== null) return { ok: false, error: 'archived' };
	db.prepare('UPDATE semesters SET name = ? WHERE id = ?').run(trimmed, id);
	return { ok: true, value: getSemester(db, id)! };
}

export function archiveSemester(db: DatabaseSync, id: Id): Result<{ completed: number }> {
	const semester = getSemester(db, id);
	if (!semester) return { ok: false, error: 'not-found' };
	if (semester.archivedAt !== null) return { ok: true, value: { completed: 0 } };
	const at = now().toISOString();
	return transaction(db, () => {
		const { changes } = db
			.prepare(
				`UPDATE todos SET status = 'done', completed_at = ?
				 WHERE status != 'done' AND class_id IN (SELECT id FROM classes WHERE semester_id = ?)`
			)
			.run(at, id);
		db.prepare('UPDATE semesters SET archived_at = ? WHERE id = ?').run(at, id);
		return { ok: true, value: { completed: Number(changes) } };
	});
}

export function unarchiveSemester(db: DatabaseSync, id: Id): Result<Semester> {
	const { changes } = db.prepare('UPDATE semesters SET archived_at = NULL WHERE id = ?').run(id);
	return changes ? { ok: true, value: getSemester(db, id)! } : { ok: false, error: 'not-found' };
}

export function semesterCounts(db: DatabaseSync, id: Id): { classes: number; todos: number; openTodos: number } {
	return db
		.prepare(
			`SELECT (SELECT count(*) FROM classes WHERE semester_id = ?) AS classes, count(t.id) AS todos,
			        coalesce(sum(t.status != 'done'), 0) AS openTodos
			 FROM todos t JOIN classes c ON c.id = t.class_id WHERE c.semester_id = ?`
		)
		.get(id, id) as { classes: number; todos: number; openTodos: number };
}

export function deleteSemester(db: DatabaseSync, id: Id): Result<{ classes: number; todos: number }> {
	if (!getSemester(db, id)) return { ok: false, error: 'not-found' };
	const { classes, todos } = semesterCounts(db, id);
	db.prepare('DELETE FROM semesters WHERE id = ?').run(id);
	return { ok: true, value: { classes, todos } };
}

type ClassRow = Omit<UniClass, 'links'> & { links: string };

const classColumns = `id, semester_id AS semesterId, name, color, icon, notes, lecturer, room, ects, links,
	exam_at AS examAt, exam_room AS examRoom, grade, created_at AS createdAt, updated_at AS updatedAt`;

const toClass = (row: ClassRow): UniClass => ({ ...row, links: JSON.parse(row.links) });

function readClass(db: DatabaseSync, id: Id): UniClass {
	return toClass(db.prepare(`SELECT ${classColumns} FROM classes WHERE id = ?`).get(id) as ClassRow);
}

export function getClass(db: DatabaseSync, id: Id): (UniClass & { semester: Semester }) | null {
	const row = db.prepare(`SELECT ${classColumns} FROM classes WHERE id = ?`).get(id) as ClassRow | undefined;
	return row ? { ...toClass(row), semester: getSemester(db, row.semesterId)! } : null;
}

type ClassValues = [string, string, string, string | null, string | null, number | null, string, string | null, string | null, string | null];

const optional = (s: string | undefined) => s?.trim() || null;

function isExamAt(s: string): boolean {
	const m = /^(\d{4}-\d{2}-\d{2})(T([01]\d|2[0-3]):[0-5]\d)?$/.exec(s);
	const time = m && Date.parse(`${m[1]}T00:00:00Z`);
	return !!time && new Date(time).toISOString().startsWith(m[1]);
}

function validate(input: ClassInput): Result<ClassValues> {
	const name = input.name.trim();
	if (!name) return { ok: false, error: 'required', field: 'name' };
	if (!Object.hasOwn(ASPECT_COLORS, input.color)) return { ok: false, error: 'invalid', field: 'color' };
	if (!Object.hasOwn(ASPECT_ICONS, input.icon)) return { ok: false, error: 'invalid', field: 'icon' };
	const ects = optional(input.ects);
	if (ects !== null && (!/^\d+(\.\d+)?$/.test(ects) || !Number.isInteger(Number(ects) * 2))) {
		return { ok: false, error: 'invalid', field: 'ects' };
	}
	const links = (input.links ?? [])
		.map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
		.filter((l) => l.label || l.url);
	if (links.some((l) => !URL.parse(l.url)?.protocol.match(/^https?:$/))) return { ok: false, error: 'invalid', field: 'links' };
	const examAt = optional(input.examAt);
	if (examAt !== null && !isExamAt(examAt)) return { ok: false, error: 'invalid', field: 'examAt' };
	const grade = optional(input.grade);
	if (grade !== null && !GRADES.includes(grade as Grade)) return { ok: false, error: 'invalid', field: 'grade' };
	return {
		ok: true,
		value: [
			name,
			input.color,
			input.icon,
			optional(input.lecturer),
			optional(input.room),
			ects === null ? null : Number(ects),
			JSON.stringify(links),
			examAt,
			optional(input.examRoom),
			grade
		]
	};
}

export function createClass(db: DatabaseSync, semesterId: Id, input: ClassInput): Result<UniClass> {
	const semester = getSemester(db, semesterId);
	if (!semester) return { ok: false, error: 'not-found', field: 'semesterId' };
	if (semester.archivedAt !== null) return { ok: false, error: 'archived', field: 'semesterId' };
	const v = validate(input);
	if (!v.ok) return v;
	const at = now().toISOString();
	const { lastInsertRowid } = db
		.prepare(
			`INSERT INTO classes (name, color, icon, lecturer, room, ects, links, exam_at, exam_room, grade,
			                      semester_id, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(...v.value, semesterId, at, at);
	return { ok: true, value: readClass(db, Number(lastInsertRowid)) };
}

export function updateClass(db: DatabaseSync, id: Id, input: ClassInput): Result<UniClass> {
	const writable = classWritable(db, id);
	if (!writable.ok) return writable;
	const v = validate(input);
	if (!v.ok) return v;
	db.prepare(
		`UPDATE classes SET name = ?, color = ?, icon = ?, lecturer = ?, room = ?, ects = ?, links = ?, exam_at = ?,
		                    exam_room = ?, grade = ?, updated_at = ?
		 WHERE id = ?`
	).run(...v.value, now().toISOString(), id);
	return { ok: true, value: readClass(db, id) };
}

export function setClassNotes(db: DatabaseSync, id: Id, notes: string): Result<UniClass> {
	const writable = classWritable(db, id);
	if (!writable.ok) return writable;
	db.prepare('UPDATE classes SET notes = ?, updated_at = ? WHERE id = ?').run(notes, now().toISOString(), id);
	return { ok: true, value: readClass(db, id) };
}

export function classCounts(db: DatabaseSync, id: Id): { todos: number } {
	return db.prepare('SELECT count(*) AS todos FROM todos WHERE class_id = ?').get(id) as { todos: number };
}

export function deleteClass(db: DatabaseSync, id: Id): Result<{ todos: number }> {
	if (!db.prepare('SELECT 1 FROM classes WHERE id = ?').get(id)) return { ok: false, error: 'not-found' };
	const { todos } = classCounts(db, id);
	db.prepare('DELETE FROM classes WHERE id = ?').run(id);
	return { ok: true, value: { todos } };
}

export function classTodos(db: DatabaseSync, id: Id): ClassTodos {
	return { open: [], planned: [], done: [] };
}

export function classRules(db: DatabaseSync, id: Id): RecurringRule[] {
	return [];
}

export function gradeSummary(classes: Pick<UniClass, 'ects' | 'grade'>[]): GradeSummary {
	return { average: null, earnedEcts: 0 };
}

export function listDeadlines(db: DatabaseSync, today: IsoDate): Deadline[] {
	return [];
}
