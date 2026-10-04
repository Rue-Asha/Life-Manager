import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { PROJECT_STATUSES } from '$lib/projects';
import type { Id, Project, ProjectStatus } from '$lib/types';
import { setTestNow } from './clock';
import { openDb } from './db';
import {
	createProject,
	deleteProject,
	getItAspectId,
	getProject,
	listProjects,
	projectLinkCounts,
	projectTodos,
	setItAspectId,
	setProjectNotes,
	setProjectStatus,
	updateProject
} from './projects';

function setup() {
	const db = openDb(':memory:');
	const aspect = aspectRow(db, 'IT');
	return { db, aspect };
}

function aspectRow(db: DatabaseSync, name: string): Id {
	return Number(
		db
			.prepare("INSERT INTO aspects (name, color, icon, position, created_at) VALUES (?, 'sage', 'heart', 0, '')")
			.run(name).lastInsertRowid
	);
}

function value<T>(r: { ok: true; value: T } | { ok: false; error: string }): T {
	if (!r.ok) throw new Error(r.error);
	return r.value;
}

function project(db: DatabaseSync, name = 'Life-Manager'): Project {
	return value(createProject(db, { name }));
}

function todoRow(
	db: DatabaseSync,
	aspect: Id,
	projectId: Id | null,
	o: { sprint?: Id | null; status?: string; completedAt?: string | null; title?: string } = {}
): Id {
	return Number(
		db
			.prepare(
				`INSERT INTO todos (title, aspect_id, project_id, sprint_id, status, completed_at, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, '')`
			)
			.run(o.title ?? 't', aspect, projectId, o.sprint ?? null, o.status ?? 'todo', o.completedAt ?? null)
			.lastInsertRowid
	);
}

function sprintRow(db: DatabaseSync, state: string): Id {
	return Number(
		db
			.prepare('INSERT INTO sprints (week_start, state, started_at) VALUES (?, ?, ?)')
			.run(state === 'planning' ? null : '2026-09-28', state, state === 'planning' ? null : '')
			.lastInsertRowid
	);
}

const ids = (todos: { id: Id }[]) => todos.map((t) => t.id);

beforeEach(() => {
	process.env.LM_TEST = '1';
});
afterEach(() => setTestNow(null));

describe('projects', () => {
	it('Scenario: Project fields round-trip', () => {
		const { db } = setup();
		const created = value(
			createProject(db, {
				name: 'Life-Manager',
				description: 'Weekly sprints',
				repoUrl: 'https://github.com/x/y',
				tags: 'svelte, sqlite'
			})
		);
		expect(created.createdAt).toBe(created.updatedAt);
		expect(created).toMatchObject({ notes: '', status: 'backlog' });
		value(setProjectNotes(db, created.id, '## Ideas'));
		const read = getProject(db, created.id)!;
		expect(read).toMatchObject({
			name: 'Life-Manager',
			description: 'Weekly sprints',
			repoUrl: 'https://github.com/x/y',
			tags: ['svelte', 'sqlite'],
			notes: '## Ideas',
			status: 'backlog'
		});
		expect(read.createdAt).toBe(created.createdAt);
		expect(getProject(db, created.id + 1)).toBeNull();
	});

	it('Scenario: Most recently updated project comes first', () => {
		const { db } = setup();
		setTestNow(new Date('2026-10-01T10:00:00Z'));
		const older = project(db, 'Older');
		setTestNow(new Date('2026-10-01T11:00:00Z'));
		const newer = project(db, 'Newer');
		expect(listProjects(db).map((p) => p.id)).toEqual([newer.id, older.id]);

		setTestNow(new Date('2026-10-01T12:00:00Z'));
		value(updateProject(db, older.id, { name: 'Older, edited' }));
		expect(listProjects(db).map((p) => p.id)).toEqual([older.id, newer.id]);
	});

	it('Scenario: Empty project name is rejected', () => {
		const { db } = setup();
		for (const name of ['', '   ']) {
			expect(createProject(db, { name })).toEqual({ ok: false, error: 'required', field: 'name' });
		}
		expect(listProjects(db)).toEqual([]);
	});

	it('Scenario: Non-http repo URL is rejected', () => {
		const { db } = setup();
		for (const repoUrl of ['ftp://host/repo', 'github.com/x']) {
			expect(createProject(db, { name: 'P', repoUrl })).toEqual({ ok: false, error: 'invalid', field: 'repoUrl' });
		}
		expect(listProjects(db)).toEqual([]);
	});

	it('Scenario: Tags are trimmed and deduplicated', () => {
		const { db } = setup();
		const p = value(createProject(db, { name: 'P', tags: ' svelte, ,sqlite, svelte ' }));
		expect(p.tags).toEqual(['svelte', 'sqlite']);
	});

	it('Scenario: Metadata edit uses the create validation', () => {
		const { db } = setup();
		const p = value(createProject(db, { name: 'P', repoUrl: 'https://example.com' }));
		expect(updateProject(db, p.id, { name: ' ' })).toEqual({ ok: false, error: 'required', field: 'name' });
		expect(updateProject(db, p.id, { name: 'P', repoUrl: 'ftp://host/repo' })).toEqual({
			ok: false,
			error: 'invalid',
			field: 'repoUrl'
		});
		expect(updateProject(db, p.id + 1, { name: 'x' })).toEqual({ ok: false, error: 'not-found' });
		expect(getProject(db, p.id)).toEqual(p);
	});

	it('Scenario: Every status transition is allowed', () => {
		const { db } = setup();
		setTestNow(new Date('2026-10-01T00:00:00Z'));
		const p = project(db);
		let tick = 0;
		for (const from of PROJECT_STATUSES) {
			for (const to of PROJECT_STATUSES) {
				if (from === to) continue;
				setTestNow(new Date(Date.UTC(2026, 9, 2, 0, 0, tick++)));
				value(setProjectStatus(db, p.id, from));
				const before = getProject(db, p.id)!.updatedAt;
				setTestNow(new Date(Date.UTC(2026, 9, 2, 0, 0, tick++)));
				const r = value(setProjectStatus(db, p.id, to));
				expect(r.status).toBe(to);
				expect(r.updatedAt > before).toBe(true);
			}
		}
		expect(setProjectStatus(db, p.id, 'dropped' as ProjectStatus)).toEqual({
			ok: false,
			error: 'invalid',
			field: 'status'
		});
		expect(setProjectStatus(db, p.id + 1, 'active')).toEqual({ ok: false, error: 'not-found' });
	});

	it('Scenario: Deleting a project unlinks its todos', () => {
		const { db, aspect } = setup();
		const p = project(db);
		const a = todoRow(db, aspect, p.id);
		const b = todoRow(db, aspect, p.id, { status: 'done' });
		expect(deleteProject(db, p.id)).toEqual({ ok: true, value: { unlinked: 2 } });
		expect(getProject(db, p.id)).toBeNull();
		const rows = db.prepare('SELECT id, project_id FROM todos ORDER BY id').all();
		expect(rows).toEqual([
			{ id: a, project_id: null },
			{ id: b, project_id: null }
		]);
		expect(deleteProject(db, p.id)).toEqual({ ok: false, error: 'not-found' });
	});

	it('Scenario: Changing the IT aspect unlinks every todo', () => {
		const { db, aspect } = setup();
		const other = aspectRow(db, 'Other');
		expect(getItAspectId(db)).toBeNull();
		expect(setItAspectId(db, aspect)).toEqual({ ok: true, value: { unlinked: 0 } });
		expect(getItAspectId(db)).toBe(aspect);
		const p = project(db);
		todoRow(db, aspect, p.id);
		todoRow(db, aspect, p.id, { status: 'done' });
		expect(projectLinkCounts(db, p.id)).toEqual({ linked: 2, open: 1 });

		expect(setItAspectId(db, other)).toEqual({ ok: true, value: { unlinked: 2 } });
		expect(getItAspectId(db)).toBe(other);
		expect(db.prepare('SELECT count(*) AS n FROM todos WHERE project_id IS NOT NULL').get()).toEqual({ n: 0 });
		expect(setItAspectId(db, other + 99)).toEqual({ ok: false, error: 'not-found', field: 'aspectId' });
	});

	it('Scenario: Linked todos are grouped Open, Planned, Done', () => {
		const { db, aspect } = setup();
		const p = project(db);
		const active = sprintRow(db, 'active');
		const draft = sprintRow(db, 'planning');
		const backlog = todoRow(db, aspect, p.id);
		const planned = todoRow(db, aspect, p.id, { sprint: active, status: 'doing' });
		const earlier = todoRow(db, aspect, p.id, { status: 'done', completedAt: '2026-09-29T10:00:00Z' });
		const later = todoRow(db, aspect, p.id, { sprint: active, status: 'done', completedAt: '2026-10-01T10:00:00Z' });
		const inDraft = todoRow(db, aspect, p.id, { sprint: draft });
		todoRow(db, aspect, null);

		const groups = projectTodos(db, p.id);
		expect(ids(groups.open)).toEqual([backlog]);
		expect(ids(groups.planned)).toEqual([planned, inDraft]);
		expect(ids(groups.done)).toEqual([later, earlier]);
		expect(projectLinkCounts(db, p.id)).toEqual({ linked: 5, open: 3 });
		expect(listProjects(db)[0].openTodos).toBe(3);
	});
});
