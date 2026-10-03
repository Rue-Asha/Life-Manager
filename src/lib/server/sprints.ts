import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type {
	Id,
	IsoDate,
	Priority,
	Result,
	ReviewDecision,
	Sprint,
	SprintPhase,
	Status,
	Todo
} from '$lib/types';
import { addDays, reviewState, targetWeek } from '$lib/week';
import { now } from './clock';
import { generateInstances } from './recurring';

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
		recurring: r.recurring === 1,
		ruleId: r.rule_id === null ? null : Number(r.rule_id),
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
	return selectTodos(db, 'sprint_id IS NULL AND due_date BETWEEN ? AND ?', start, addDays(start, 6));
}

export function pullTodo(db: DatabaseSync, todoId: Id): Result<Todo> {
	if (!getTodo(db, todoId)) return { ok: false, error: 'not-found' };
	if (getActiveSprint(db)) return { ok: false, error: 'sprint-active' };
	db.prepare('UPDATE todos SET sprint_id = ?, day = NULL WHERE id = ?').run(planningDraft(db).id, todoId);
	return { ok: true, value: getTodo(db, todoId)! };
}

function toBacklog(db: DatabaseSync, todoId: Id): Todo {
	db.prepare(
		"UPDATE todos SET sprint_id = NULL, day = NULL, status = 'todo', completed_at = NULL WHERE id = ?"
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
	return { ok: true, value: toBacklog(db, todoId) };
}

export function startSprint(db: DatabaseSync, today: IsoDate, suggestedIds: Id[]): Result<Sprint> {
	const active = getActiveSprint(db);
	if (active) return blockedBy(active, today);
	return transaction(db, () => {
		const draft = planningDraft(db);
		const pull = db.prepare('UPDATE todos SET sprint_id = ?, day = NULL WHERE id = ? AND sprint_id IS NULL');
		for (const id of suggestedIds) pull.run(draft.id, id);
		const weekStart = targetWeek(today);
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

export function listSprintTodos(db: DatabaseSync, sprintId: Id): Todo[] {
	return selectTodos(db, 'sprint_id = ?', sprintId);
}

export function listToday(db: DatabaseSync, today: IsoDate): Todo[] {
	return selectTodos(
		db,
		"day = ? AND sprint_id = (SELECT id FROM sprints WHERE state = 'active')",
		today
	);
}

export function addToActiveSprint(db: DatabaseSync, todoId: Id): Result<Todo> {
	const active = getActiveSprint(db);
	if (!active) return { ok: false, error: 'no-active-sprint' };
	if (!getTodo(db, todoId)) return { ok: false, error: 'not-found' };
	db.prepare('UPDATE todos SET sprint_id = ?, day = NULL WHERE id = ?').run(active.id, todoId);
	return { ok: true, value: getTodo(db, todoId)! };
}

export function moveToBacklog(db: DatabaseSync, todoId: Id): Result<Todo> {
	if (!inSprint(db, todoId, 'active')) return { ok: false, error: 'not-found' };
	return { ok: true, value: toBacklog(db, todoId) };
}

export function setStatus(db: DatabaseSync, todoId: Id, status: Status): Result<Todo> {
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

export function setDay(db: DatabaseSync, todoId: Id, day: IsoDate | null): Result<Todo> {
	const todo = getTodo(db, todoId);
	if (!todo) return { ok: false, error: 'not-found' };
	if (day !== null) {
		const weekStart = todo.sprintId === null ? null : getSprint(db, todo.sprintId).weekStart;
		if (weekStart === null || day < weekStart || day > addDays(weekStart, 6)) {
			return { ok: false, error: 'day-outside-sprint', field: 'day' };
		}
	}
	db.prepare('UPDATE todos SET day = ? WHERE id = ?').run(day, todoId);
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
		if (todo.recurring && decision === 'backlog') {
			return { ok: false, error: 'recurring-no-backlog', field: `decision-${todo.id}` };
		}
		if (!todo.recurring && decision === 'drop') {
			return { ok: false, error: 'not-recurring', field: `decision-${todo.id}` };
		}
	}
	return transaction(db, () => {
		const draft = planningDraft(db);
		const carry = db.prepare('UPDATE todos SET sprint_id = ?, day = NULL WHERE id = ?');
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
