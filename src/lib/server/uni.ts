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

const notImplemented = { ok: false, error: 'not-implemented' } as const;

export function getUniAspectId(db: DatabaseSync): Id | null {
	return null;
}

export function setUniAspectId(db: DatabaseSync, aspectId: Id): Result<{ unlinked: number }> {
	return notImplemented;
}

export function countClassLinks(db: DatabaseSync): number {
	return 0;
}

export function listClassRefs(db: DatabaseSync): ClassRef[] {
	return [];
}

export function countOpenClassTodos(db: DatabaseSync): number {
	return 0;
}

export function classWritable(db: DatabaseSync, classId: Id): Result<void> {
	return notImplemented;
}

export function todoWritable(db: DatabaseSync, todoId: Id): Result<void> {
	return notImplemented;
}

// Unit 3 fills in the functions below.

export function listSemesters(db: DatabaseSync): { active: SemesterView[]; archived: SemesterView[]; overall: GradeSummary } {
	return { active: [], archived: [], overall: { average: null, earnedEcts: 0 } };
}

export function createSemester(db: DatabaseSync, name: string): Result<Semester> {
	return notImplemented;
}

export function renameSemester(db: DatabaseSync, id: Id, name: string): Result<Semester> {
	return notImplemented;
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
