import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type {
	AspectProgress,
	ClassType,
	HhMm,
	Id,
	IsoDate,
	Placement,
	Priority,
	Result,
	ReviewDecision,
	Slot,
	Sprint,
	SprintPhase,
	Status,
	Todo
} from '$lib/types';
import { addDays, reviewState, targetWeek } from '$lib/week';
import { validateSlot } from '$lib/slot';
import { now } from './clock';
import { landing } from './planning';
import { generateInstances } from './recurring';
import { deleteTodo } from './todos';
import { todoWritable } from './uni';

type Row = Record<string, SQLInputValue>;

const ORDER = `CASE priority WHEN 0 THEN 4 ELSE priority END, due_date IS NULL, due_date, id`;

// Read model shared with recurring.ts; todos.ts (U5) has its own, built in parallel.
export function selectTodos(db: DatabaseSync, where: string, ...params: SQLInputValue[]): Todo[] {
	const rows = db.prepare(`SELECT * FROM todos WHERE ${where} ORDER BY ${ORDER}`).all(...params) as Row[];
	const items = db.prepare('SELECT * FROM checklist_items WHERE todo_id = ? ORDER BY position, id');
	return rows.map((r) => ({
		id: Number(r.id),
		title: r.title as string,
		aspectId: Number(r.aspect_id),
		notes: r.notes as string,
		priority: Number(r.priority) as Priority,
		dueDate: r.due_date as IsoDate | null,
		sprintId: r.sprint_id === null ? null : Number(r.sprint_id),
		status: r.status as Status,
		day: r.day as IsoDate | null,
		startTime: r.start_time as HhMm | null,
		endTime: r.end_time as HhMm | null,
		recurring: r.recurring === 1,
		ruleId: r.rule_id === null ? null : Number(r.rule_id),
		projectId: r.project_id === null ? null : Number(r.project_id),
		classId: r.class_id === null ? null : Number(r.class_id),
		type: r.type as ClassType | null,
		revisedAt: r.revised_at as IsoDate | null,
		checklist: (items.all(r.id) as Row[]).map((i) => ({
			id: Number(i.id),
			todoId: Number(i.todo_id),
			text: i.text as string,
			done: i.done === 1,
			position: Number(i.position)
		})),
		createdAt: r.created_at as string,
		completedAt: r.completed_at as string | null
	}));
}

function getTodo(db: DatabaseSync, id: Id): Todo | null {
	return selectTodos(db, 'id = ?', id)[0] ?? null;
}

function toSprint(r: Row | undefined): Sprint | null {
	if (!r) return null;
	return {
		id: Number(r.id),
		weekStart: r.week_start as IsoDate | null,
		state: r.state as Sprint['state'],
		startedAt: r.started_at as string | null,
		closedAt: r.closed_at as string | null
	};
}

function sprintIn(db: DatabaseSync, state: Sprint['state']): Sprint | null {
	return toSprint(db.prepare('SELECT * FROM sprints WHERE state = ?').get(state) as Row | undefined);
}

function getSprint(db: DatabaseSync, id: Id): Sprint {
	return toSprint(db.prepare('SELECT * FROM sprints WHERE id = ?').get(id) as Row)!;
}

function planningDraft(db: DatabaseSync): Sprint {
	const draft = sprintIn(db, 'planning');
	if (draft) return draft;
	const { lastInsertRowid } = db.prepare("INSERT INTO sprints (state) VALUES ('planning')").run();
	return getSprint(db, Number(lastInsertRowid));
}

export function transaction<T>(db: DatabaseSync, fn: () => T): T {
	db.exec('BEGIN');
	try {
		const value = fn();
		db.exec('COMMIT');
		return value;
	} catch (err) {
		db.exec('ROLLBACK');
		throw err;
	}
}

// Rolls back when the callback returns an error result, so a refused part leaves nothing half-written.
export function atomic<T>(db: DatabaseSync, fn: () => Result<T>): Result<T> {
	db.exec('BEGIN');
	try {
		const result = fn();
		db.exec(result.ok ? 'COMMIT' : 'ROLLBACK');
		return result;
	} catch (err) {
		db.exec('ROLLBACK');
		throw err;
	}
}

export function sprintPhase(db: DatabaseSync, today: IsoDate): { phase: SprintPhase; sprint: Sprint | null } {
	const active = getActiveSprint(db);
	if (active) return { phase: reviewState(active.weekStart!, today), sprint: active };
	const draft = sprintIn(db, 'planning');
	return draft ? { phase: 'planning', sprint: draft } : { phase: 'none', sprint: null };
}

export function getActiveSprint(db: DatabaseSync): Sprint | null {
	return sprintIn(db, 'active');
}

function blockedBy(active: Sprint, today: IsoDate): { ok: false; error: string } {
	return {
		ok: false,
		error: reviewState(active.weekStart!, today) === 'running' ? 'sprint-active' : 'review-pending'
	};
}

export function openPlanning(
	db: DatabaseSync,
	today: IsoDate
): Result<{ sprint: Sprint; weekStart: IsoDate }> {
	const active = getActiveSprint(db);
	if (active) return blockedBy(active, today);
	return { ok: true, value: { sprint: planningDraft(db), weekStart: targetWeek(today) } };
}

export function suggestedTodos(db: DatabaseSync, today: IsoDate): Todo[] {
	const start = targetWeek(today);
	return selectTodos(
		db,
		"sprint_id IS NULL AND status != 'done' AND due_date BETWEEN ? AND ? AND (day IS NULL OR day < ?)",
		start,
		addDays(start, 6),
		start
	);
}

export function listPlannedForWeek(db: DatabaseSync, weekStart: IsoDate): Todo[] {
	// Archived-semester todos are read-only, so the start doesn't pull them and they don't join automatically.
	return selectTodos(db, "sprint_id IS NULL AND status != 'done' AND day BETWEEN ? AND ?", weekStart, addDays(weekStart, 6))
		.filter((t) => todoWritable(db, t.id).ok)
		.sort((a, b) =>
			a.day!.localeCompare(b.day!) ||
			Number(a.startTime !== null) - Number(b.startTime !== null) ||
			(a.startTime ?? '').localeCompare(b.startTime ?? '') ||
			a.title.localeCompare(b.title)
		);
}

export function pullTodo(db: DatabaseSync, todoId: Id): Result<Todo> {
	const todo = getTodo(db, todoId);
	if (!todo || (todo.sprintId !== null && !inSprint(db, todoId, 'planning'))) return { ok: false, error: 'not-found' };
	if (getActiveSprint(db)) return { ok: false, error: 'sprint-active' };
	const writable = todoWritable(db, todoId);
	if (!writable.ok) return writable;
	db.prepare('UPDATE todos SET sprint_id = ?, day = NULL, start_time = NULL, end_time = NULL WHERE id = ?').run(
		planningDraft(db).id,
		todoId
	);
	return { ok: true, value: getTodo(db, todoId)! };
}

function toBacklog(db: DatabaseSync, todoId: Id): Todo {
	db.prepare(
		"UPDATE todos SET sprint_id = NULL, day = NULL, start_time = NULL, end_time = NULL, status = 'todo', completed_at = NULL WHERE id = ?"
	).run(todoId);
	return getTodo(db, todoId)!;
}

function inSprint(db: DatabaseSync, todoId: Id, state: Sprint['state']): boolean {
	return (
		db
			.prepare('SELECT 1 FROM todos JOIN sprints ON sprints.id = todos.sprint_id WHERE todos.id = ? AND state = ?')
			.get(todoId, state) !== undefined
	);
}

export function unpullTodo(db: DatabaseSync, todoId: Id): Result<Todo> {
	if (!inSprint(db, todoId, 'planning')) return { ok: false, error: 'not-found' };
	const writable = todoWritable(db, todoId);
	if (!writable.ok) return writable;
	return { ok: true, value: toBacklog(db, todoId) };
}

export function startSprint(db: DatabaseSync, today: IsoDate, suggestedIds: Id[]): Result<Sprint> {
	const active = getActiveSprint(db);
	if (active) return blockedBy(active, today);
	return transaction(db, () => {
		const draft = planningDraft(db);
		const weekStart = targetWeek(today);
		const weekEnd = addDays(weekStart, 6);
		// A suggested todo keeps a day inside the new week; any other planned date is dropped with its slot.
		const pull = db.prepare(
			`UPDATE todos SET sprint_id = ?1,
			 day = CASE WHEN day BETWEEN ?3 AND ?4 THEN day END,
			 start_time = CASE WHEN day BETWEEN ?3 AND ?4 THEN start_time END,
			 end_time = CASE WHEN day BETWEEN ?3 AND ?4 THEN end_time END
			 WHERE id = ?2 AND sprint_id IS NULL`
		);
		for (const id of suggestedIds) if (todoWritable(db, id).ok) pull.run(draft.id, id, weekStart, weekEnd);
		const backlogIds = (where: string, ...params: SQLInputValue[]) =>
			(db.prepare(`SELECT id FROM todos WHERE sprint_id IS NULL AND status != 'done' AND ${where}`).all(...params) as Row[])
				.map((r) => Number(r.id))
				.filter((id) => todoWritable(db, id).ok);
		const join = db.prepare('UPDATE todos SET sprint_id = ? WHERE id = ?');
		for (const id of backlogIds('day BETWEEN ? AND ?', weekStart, weekEnd)) join.run(draft.id, id);
		const missed = db.prepare('UPDATE todos SET sprint_id = ?, day = NULL, start_time = NULL, end_time = NULL WHERE id = ?');
		for (const id of backlogIds('day < ?', weekStart)) missed.run(draft.id, id);
		db.prepare("UPDATE sprints SET state = 'active', week_start = ?, started_at = ? WHERE id = ?").run(
			weekStart,
			now().toISOString(),
			draft.id
		);
		const sprint = getSprint(db, draft.id);
		generateInstances(db, sprint, weekStart);
		return { ok: true, value: sprint };
	});
}

// A sprint todo without a day sits on its due date when that falls in the sprint's week.
function onDueDay(todo: Todo, weekStart: IsoDate | null): Todo {
	if (todo.day !== null || todo.dueDate === null || weekStart === null) return todo;
	return todo.dueDate >= weekStart && todo.dueDate <= addDays(weekStart, 6) ? { ...todo, dueDay: todo.dueDate } : todo;
}

export function listSprintTodos(db: DatabaseSync, sprintId: Id): Todo[] {
	const { weekStart } = getSprint(db, sprintId);
	return selectTodos(db, 'sprint_id = ?', sprintId).map((t) => onDueDay(t, weekStart));
}

export function listToday(db: DatabaseSync, today: IsoDate): Todo[] {
	return selectTodos(
		db,
		"(day = ? OR (day IS NULL AND due_date = ?)) AND sprint_id = (SELECT id FROM sprints WHERE state = 'active')",
		today,
		today
	).map((t) => (t.day === null ? { ...t, dueDay: today } : t));
}

export function addToActiveSprint(db: DatabaseSync, todoId: Id, today: IsoDate, placement?: Placement): Result<Todo> {
	const active = getActiveSprint(db);
	if (!active) return { ok: false, error: 'no-active-sprint' };
	if (reviewState(active.weekStart!, today) === 'review-required') return { ok: false, error: 'review-required' };
	const todo = getTodo(db, todoId);
	if (!todo || todo.sprintId !== null) return { ok: false, error: 'not-found' };
	const day = placement?.day ?? null;
	if (day !== null && (day < active.weekStart! || day > addDays(active.weekStart!, 6))) {
		return { ok: false, error: 'day-outside-sprint', field: 'day' };
	}
	const status = placement?.status ?? 'todo';
	if (!STATUSES.includes(status)) return { ok: false, error: 'required', field: 'status' };
	db.prepare(
		'UPDATE todos SET sprint_id = ?, day = ?, start_time = ?, end_time = ?, status = ?, completed_at = ? WHERE id = ?'
	).run(
		active.id,
		day,
		day === null ? null : todo.startTime,
		day === null ? null : todo.endTime,
		status,
		status === 'done' ? now().toISOString() : null,
		todoId
	);
	return { ok: true, value: getTodo(db, todoId)! };
}

export function aspectProgress(db: DatabaseSync, sprintId: Id): Record<Id, AspectProgress> {
	const rows = db
		.prepare(
			`SELECT aspect_id, SUM(status = 'done') AS done, COUNT(*) AS total FROM todos
			 WHERE sprint_id = ? GROUP BY aspect_id`
		)
		.all(sprintId) as Row[];
	return Object.fromEntries(rows.map((r) => [Number(r.aspect_id), { done: Number(r.done), total: Number(r.total) }]));
}

export function moveToBacklog(db: DatabaseSync, todoId: Id): Result<Todo> {
	if (!inSprint(db, todoId, 'active')) return { ok: false, error: 'not-found' };
	return { ok: true, value: toBacklog(db, todoId) };
}

// Recurring instances have no backlog, so removing one deletes it.
export function removeFromSprint(db: DatabaseSync, todoId: Id): Result<{ deleted: boolean; todo: Todo }> {
	const todo = getTodo(db, todoId);
	if (!todo?.recurring) {
		const moved = moveToBacklog(db, todoId);
		return moved.ok ? { ok: true, value: { deleted: false, todo: moved.value } } : moved;
	}
	if (!inSprint(db, todoId, 'active')) return { ok: false, error: 'not-found' };
	const deleted = deleteTodo(db, todoId);
	return deleted.ok ? { ok: true, value: { deleted: true, todo } } : deleted;
}

const STATUSES: Status[] = ['todo', 'doing', 'done'];

export function setStatus(db: DatabaseSync, todoId: Id, status: Status): Result<Todo> {
	if (!STATUSES.includes(status)) return { ok: false, error: 'required', field: 'status' };
	const todo = getTodo(db, todoId);
	if (!todo) return { ok: false, error: 'not-found' };
	const completedAt = status !== 'done' ? null : todo.completedAt ?? now().toISOString();
	db.prepare('UPDATE todos SET status = ?, completed_at = ? WHERE id = ?').run(status, completedAt, todoId);
	return { ok: true, value: getTodo(db, todoId)! };
}

export function toggleDone(db: DatabaseSync, todoId: Id): Result<Todo> {
	const todo = getTodo(db, todoId);
	if (!todo) return { ok: false, error: 'not-found' };
	return setStatus(db, todoId, todo.status === 'done' ? 'todo' : 'done');
}

export function setDay(db: DatabaseSync, todoId: Id, day: IsoDate | null, today: IsoDate, slot?: Slot): Result<Todo> {
	const todo = getTodo(db, todoId);
	if (!todo) return { ok: false, error: 'not-found' };
	const next = day === null ? { startTime: null, endTime: null } : (slot ?? todo);
	const invalid = validateSlot(next.startTime, next.endTime);
	if (invalid) return { ok: false, ...invalid };
	if (day === null) {
		db.prepare('UPDATE todos SET day = NULL, start_time = NULL, end_time = NULL WHERE id = ?').run(todoId);
		return { ok: true, value: getTodo(db, todoId)! };
	}
	const placed = landing(db, todo.sprintId, day, today);
	if (!placed.ok) return placed;
	const { sprintId, resetStatus } = placed.value;
	// Recurring instances have no backlog, and one carried back in by sprint start would lose its day to its rule.
	if (todo.recurring && todo.sprintId !== null && sprintId !== todo.sprintId) {
		return { ok: false, error: 'recurring-outside-week', field: 'day' };
	}
	db.prepare(
		`UPDATE todos SET sprint_id = ?1, day = ?2, start_time = ?3, end_time = ?4,
		 status = CASE WHEN ?5 THEN 'todo' ELSE status END, completed_at = CASE WHEN ?5 THEN NULL ELSE completed_at END
		 WHERE id = ?6`
	).run(sprintId, day, next.startTime, next.endTime, resetStatus ? 1 : 0, todoId);
	return { ok: true, value: getTodo(db, todoId)! };
}

export function reviewSummary(db: DatabaseSync): { sprint: Sprint; done: Todo[]; open: Todo[] } | null {
	const sprint = getActiveSprint(db);
	if (!sprint) return null;
	const todos = listSprintTodos(db, sprint.id);
	return {
		sprint,
		done: todos.filter((t) => t.status === 'done'),
		open: todos.filter((t) => t.status !== 'done')
	};
}

const DECISIONS: ReviewDecision[] = ['carry', 'backlog', 'drop'];

export function closeReview(
	db: DatabaseSync,
	today: IsoDate,
	decisions: Record<Id, ReviewDecision>
): Result<Sprint> {
	const summary = reviewSummary(db);
	if (!summary) return { ok: false, error: 'no-active-sprint' };
	// Closing before Sunday would let the next sprint target the same week.
	if (reviewState(summary.sprint.weekStart!, today) === 'running') return { ok: false, error: 'sprint-active' };
	const plan = summary.open.map((t) => ({ todo: t, decision: decisions[t.id] ?? 'carry' }));
	for (const { todo, decision } of plan) {
		if (!DECISIONS.includes(decision)) return { ok: false, error: 'required', field: `decision-${todo.id}` };
		if (todo.recurring && decision === 'backlog') {
			return { ok: false, error: 'recurring-no-backlog', field: `decision-${todo.id}` };
		}
		if (!todo.recurring && decision === 'drop') {
			return { ok: false, error: 'not-recurring', field: `decision-${todo.id}` };
		}
	}
	return transaction(db, () => {
		const draft = planningDraft(db);
		const carry = db.prepare('UPDATE todos SET sprint_id = ?, day = NULL, start_time = NULL, end_time = NULL WHERE id = ?');
		const drop = db.prepare('DELETE FROM todos WHERE id = ?');
		for (const { todo, decision } of plan) {
			if (decision === 'carry') carry.run(draft.id, todo.id);
			else if (decision === 'drop') drop.run(todo.id);
			else toBacklog(db, todo.id);
		}
		db.prepare("UPDATE sprints SET state = 'closed', closed_at = ? WHERE id = ?").run(
			now().toISOString(),
			summary.sprint.id
		);
		return { ok: true, value: draft };
	});
}
