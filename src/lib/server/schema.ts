// Migration n (1-based) brings the database to PRAGMA user_version = n. Append only.
export const migrations: string[] = [
	`
	CREATE TABLE aspects (
		id INTEGER PRIMARY KEY,
		name TEXT NOT NULL,
		color TEXT NOT NULL,
		icon TEXT NOT NULL,
		position INTEGER NOT NULL,
		created_at TEXT NOT NULL
	);
	CREATE UNIQUE INDEX aspects_name ON aspects (lower(name));

	CREATE TABLE sprints (
		id INTEGER PRIMARY KEY,
		week_start TEXT NULL,
		state TEXT NOT NULL CHECK (state IN ('planning', 'active', 'closed')),
		started_at TEXT NULL,
		closed_at TEXT NULL
	);
	CREATE UNIQUE INDEX sprints_one_active ON sprints (state) WHERE state = 'active';
	CREATE UNIQUE INDEX sprints_one_planning ON sprints (state) WHERE state = 'planning';

	CREATE TABLE recurring_rules (
		id INTEGER PRIMARY KEY,
		title TEXT NOT NULL,
		aspect_id INTEGER NOT NULL REFERENCES aspects (id),
		weekdays TEXT NOT NULL,
		notes TEXT NOT NULL DEFAULT '',
		priority INTEGER NOT NULL DEFAULT 0,
		checklist TEXT NOT NULL DEFAULT '[]',
		created_at TEXT NOT NULL
	);

	CREATE TABLE todos (
		id INTEGER PRIMARY KEY,
		title TEXT NOT NULL,
		aspect_id INTEGER NOT NULL REFERENCES aspects (id),
		notes TEXT NOT NULL DEFAULT '',
		priority INTEGER NOT NULL DEFAULT 0,
		due_date TEXT NULL,
		sprint_id INTEGER NULL REFERENCES sprints (id),
		status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
		day TEXT NULL,
		recurring INTEGER NOT NULL DEFAULT 0,
		rule_id INTEGER NULL REFERENCES recurring_rules (id) ON DELETE SET NULL,
		created_at TEXT NOT NULL,
		completed_at TEXT NULL
	);

	CREATE TABLE checklist_items (
		id INTEGER PRIMARY KEY,
		todo_id INTEGER NOT NULL REFERENCES todos (id) ON DELETE CASCADE,
		text TEXT NOT NULL,
		done INTEGER NOT NULL DEFAULT 0,
		position INTEGER NOT NULL
	);
	`
];
