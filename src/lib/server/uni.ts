import type { DatabaseSync } from 'node:sqlite';
import type {
	ClassInput,
	ClassRef,
	ClassTodos,
	Deadline,
	GradeSummary,
	Id,
	IsoDate,
	RecurringRule,
	Result,
	Semester,
	SemesterView,
	UniClass
} from '$lib/types';
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
	return notImplemented;
}

export function unarchiveSemester(db: DatabaseSync, id: Id): Result<Semester> {
	return notImplemented;
}

export function semesterCounts(db: DatabaseSync, id: Id): { classes: number; todos: number; openTodos: number } {
	return { classes: 0, todos: 0, openTodos: 0 };
}

export function deleteSemester(db: DatabaseSync, id: Id): Result<{ classes: number; todos: number }> {
	return notImplemented;
}

export function getClass(db: DatabaseSync, id: Id): (UniClass & { semester: Semester }) | null {
	return null;
}

export function createClass(db: DatabaseSync, semesterId: Id, input: ClassInput): Result<UniClass> {
	return notImplemented;
}

export function updateClass(db: DatabaseSync, id: Id, input: ClassInput): Result<UniClass> {
	return notImplemented;
}

export function setClassNotes(db: DatabaseSync, id: Id, notes: string): Result<UniClass> {
	return notImplemented;
}

export function classCounts(db: DatabaseSync, id: Id): { todos: number } {
	return { todos: 0 };
}

export function deleteClass(db: DatabaseSync, id: Id): Result<{ todos: number }> {
	return notImplemented;
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
