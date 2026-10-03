import { error, json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import type { AspectColor, AspectIcon } from '$lib/aspect-style';
import type { Id, IsoDate, Priority, Sprint, Status, Weekday } from '$lib/types';
import type { RequestHandler } from './$types';

// `aspect` and `rule` are indexes into this request's `aspects` / `rules`, because the ids
// only exist once the rows are inserted. `inSprint` puts a todo on the seeded `sprint`.
export interface SeedInput {
	aspects?: { name: string; color?: AspectColor; icon?: AspectIcon }[];
	sprint?: { state: Sprint['state']; weekStart?: IsoDate | null };
	rules?: {
		title: string;
		aspect?: number;
		weekdays: Weekday[];
		notes?: string;
		priority?: Priority;
		checklist?: string[];
	}[];
	todos?: {
		title: string;
		aspect?: number;
		notes?: string;
		priority?: Priority;
		dueDate?: IsoDate | null;
		inSprint?: boolean;
		status?: Status;
		day?: IsoDate | null;
		recurring?: boolean;
		rule?: number;
		checklist?: string[];
		createdAt?: string;
	}[];
}

export interface SeedResult {
	aspects: Id[];
	sprint: Id | null;
	rules: Id[];
	todos: Id[];
}

export const POST: RequestHandler = async ({ request }) => {
	if (process.env.LM_TEST !== '1') error(404);
	const input = (await request.json()) as SeedInput;
	const db = getDb();
	const now = new Date().toISOString();
	const result: SeedResult = { aspects: [], sprint: null, rules: [], todos: [] };

	const insertAspect = db.prepare(
		`INSERT INTO aspects (name, color, icon, position, created_at)
		 VALUES (?, ?, ?, (SELECT coalesce(max(position) + 1, 0) FROM aspects), ?)`
	);
	for (const a of input.aspects ?? []) {
		const { lastInsertRowid } = insertAspect.run(a.name, a.color ?? 'sage', a.icon ?? 'heart', now);
		result.aspects.push(Number(lastInsertRowid));
	}

	if (input.sprint) {
		const { state, weekStart = null } = input.sprint;
		const { lastInsertRowid } = db
			.prepare('INSERT INTO sprints (week_start, state, started_at, closed_at) VALUES (?, ?, ?, ?)')
			.run(weekStart, state, state === 'planning' ? null : now, state === 'closed' ? now : null);
		result.sprint = Number(lastInsertRowid);
	}

	const insertRule = db.prepare(
		`INSERT INTO recurring_rules (title, aspect_id, weekdays, notes, priority, checklist, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`
	);
	for (const r of input.rules ?? []) {
		const { lastInsertRowid } = insertRule.run(
			r.title,
			result.aspects[r.aspect ?? 0],
			r.weekdays.join(','),
			r.notes ?? '',
			r.priority ?? 0,
			JSON.stringify(r.checklist ?? []),
			now
		);
		result.rules.push(Number(lastInsertRowid));
	}

	const insertTodo = db.prepare(
		`INSERT INTO todos (title, aspect_id, notes, priority, due_date, sprint_id, status, day,
		                    recurring, rule_id, created_at, completed_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);
	const insertItem = db.prepare(
		'INSERT INTO checklist_items (todo_id, text, position) VALUES (?, ?, ?)'
	);
	for (const t of input.todos ?? []) {
		const status = t.status ?? 'todo';
		const { lastInsertRowid } = insertTodo.run(
			t.title,
			result.aspects[t.aspect ?? 0],
			t.notes ?? '',
			t.priority ?? 0,
			t.dueDate ?? null,
			t.inSprint ? result.sprint : null,
			status,
			t.day ?? null,
			t.recurring || t.rule !== undefined ? 1 : 0,
			t.rule === undefined ? null : result.rules[t.rule],
			t.createdAt ?? now,
			status === 'done' ? now : null
		);
		const id = Number(lastInsertRowid);
		(t.checklist ?? []).forEach((text, i) => insertItem.run(id, text, i));
		result.todos.push(id);
	}

	return json(result);
};
