import { error, json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import type { AspectColor, AspectIcon } from '$lib/aspect-style';
import type { ClassLink, ClassType, Grade, Id, IsoDate, ProjectStatus, Priority, Sprint, Status, Weekday } from '$lib/types';
import type { RequestHandler } from './$types';

// `aspect`, `rule`, `itAspect`, `uniAspect`, `project`, `semester` and `class` are indexes into this request's
// `aspects` / `rules` / `projects` / `semesters` / `classes`, because the ids only exist once the rows are inserted. `inSprint` puts a todo on the seeded `sprint`.
export interface SeedInput {
	aspects?: { name: string; color?: AspectColor; icon?: AspectIcon }[];
	itAspect?: number;
	uniAspect?: number;
	semesters?: { name: string; archivedAt?: string; createdAt?: string }[];
	classes?: {
		semester: number;
		name: string;
		color?: AspectColor;
		icon?: AspectIcon;
		notes?: string;
		lecturer?: string;
		room?: string;
		ects?: number;
		links?: ClassLink[];
		examAt?: string;
		examRoom?: string;
		grade?: Grade;
	}[];
	projects?: {
		name: string;
		description?: string;
		repoUrl?: string;
		tags?: string[];
		notes?: string;
		status?: ProjectStatus;
		updatedAt?: string;
	}[];
	sprint?: { state: Sprint['state']; weekStart?: IsoDate | null };
	rules?: {
		title: string;
		aspect?: number;
		weekdays: Weekday[];
		notes?: string;
		priority?: Priority;
		checklist?: string[];
		class?: number;
		type?: ClassType;
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
		project?: number;
		checklist?: string[];
		createdAt?: string;
		completedAt?: string;
		class?: number;
		type?: ClassType;
		revisedAt?: IsoDate;
	}[];
}

export interface SeedResult {
	aspects: Id[];
	sprint: Id | null;
	rules: Id[];
	projects: Id[];
	semesters: Id[];
	classes: Id[];
	todos: Id[];
}

export const POST: RequestHandler = async ({ request }) => {
	if (process.env.LM_TEST !== '1') error(404);
	const input = (await request.json()) as SeedInput;
	const db = getDb();
	const now = new Date().toISOString();
	const result: SeedResult = { aspects: [], sprint: null, rules: [], projects: [], semesters: [], classes: [], todos: [] };

	const insertAspect = db.prepare(
		`INSERT INTO aspects (name, color, icon, position, created_at)
		 VALUES (?, ?, ?, (SELECT coalesce(max(position) + 1, 0) FROM aspects), ?)`
	);
	for (const a of input.aspects ?? []) {
		const { lastInsertRowid } = insertAspect.run(a.name, a.color ?? 'sage', a.icon ?? 'heart', now);
		result.aspects.push(Number(lastInsertRowid));
	}

	if (input.itAspect !== undefined) {
		db.prepare("INSERT INTO settings (key, value) VALUES ('it_aspect_id', ?)").run(String(result.aspects[input.itAspect]));
	}

	if (input.uniAspect !== undefined) {
		db.prepare("INSERT INTO settings (key, value) VALUES ('uni_aspect_id', ?)").run(String(result.aspects[input.uniAspect]));
	}

	const insertSemester = db.prepare('INSERT INTO semesters (name, archived_at, created_at) VALUES (?, ?, ?)');
	for (const s of input.semesters ?? []) {
		const { lastInsertRowid } = insertSemester.run(s.name, s.archivedAt ?? null, s.createdAt ?? now);
		result.semesters.push(Number(lastInsertRowid));
	}

	const insertClass = db.prepare(
		`INSERT INTO classes (semester_id, name, color, icon, notes, lecturer, room, ects, links, exam_at, exam_room, grade,
		                      created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);
	for (const c of input.classes ?? []) {
		const { lastInsertRowid } = insertClass.run(
			result.semesters[c.semester],
			c.name,
			c.color ?? 'sky',
			c.icon ?? 'book',
			c.notes ?? '',
			c.lecturer ?? null,
			c.room ?? null,
			c.ects ?? null,
			JSON.stringify(c.links ?? []),
			c.examAt ?? null,
			c.examRoom ?? null,
			c.grade ?? null,
			now,
			now
		);
		result.classes.push(Number(lastInsertRowid));
	}

	const insertProject = db.prepare(
		`INSERT INTO it_projects (name, description, repo_url, tags, notes, status, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	);
	for (const p of input.projects ?? []) {
		const { lastInsertRowid } = insertProject.run(
			p.name,
			p.description ?? '',
			p.repoUrl ?? null,
			JSON.stringify(p.tags ?? []),
			p.notes ?? '',
			p.status ?? 'backlog',
			now,
			p.updatedAt ?? now
		);
		result.projects.push(Number(lastInsertRowid));
	}

	if (input.sprint) {
		const { state, weekStart = null } = input.sprint;
		const { lastInsertRowid } = db
			.prepare('INSERT INTO sprints (week_start, state, started_at, closed_at) VALUES (?, ?, ?, ?)')
			.run(weekStart, state, state === 'planning' ? null : now, state === 'closed' ? now : null);
		result.sprint = Number(lastInsertRowid);
	}

	const insertRule = db.prepare(
		`INSERT INTO recurring_rules (title, aspect_id, weekdays, notes, priority, checklist, class_id, type, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);
	for (const r of input.rules ?? []) {
		const { lastInsertRowid } = insertRule.run(
			r.title,
			result.aspects[r.aspect ?? 0],
			r.weekdays.join(','),
			r.notes ?? '',
			r.priority ?? 0,
			JSON.stringify(r.checklist ?? []),
			r.class === undefined ? null : result.classes[r.class],
			r.class === undefined ? null : (r.type ?? 'OTH'),
			now
		);
		result.rules.push(Number(lastInsertRowid));
	}

	const insertTodo = db.prepare(
		`INSERT INTO todos (title, aspect_id, notes, priority, due_date, sprint_id, status, day,
		                    recurring, rule_id, project_id, class_id, type, revised_at, created_at, completed_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
			t.project === undefined ? null : result.projects[t.project],
			t.class === undefined ? null : result.classes[t.class],
			t.class === undefined ? null : (t.type ?? 'OTH'),
			t.class === undefined ? null : (t.revisedAt ?? null),
			t.createdAt ?? now,
			status === 'done' ? (t.completedAt ?? now) : null
		);
		const id = Number(lastInsertRowid);
		(t.checklist ?? []).forEach((text, i) => insertItem.run(id, text, i));
		result.todos.push(id);
	}

	return json(result);
};
