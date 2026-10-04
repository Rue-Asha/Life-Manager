import type { DatabaseSync } from 'node:sqlite';
import { PROJECT_STATUSES, parseTags } from '$lib/projects';
import type { Id, Project, ProjectInput, ProjectRef, ProjectStatus, ProjectSummary, ProjectTodos, Result } from '$lib/types';
import { now } from './clock';
import { selectTodos } from './sprints';

type ProjectRow = Omit<Project, 'tags'> & { tags: string };

const columns = `id, name, description, repo_url AS repoUrl, tags, notes, status,
	created_at AS createdAt, updated_at AS updatedAt`;

const toProject = (row: ProjectRow): Project => ({ ...row, tags: JSON.parse(row.tags) });

export function getProject(db: DatabaseSync, id: Id): Project | null {
	const row = db.prepare(`SELECT ${columns} FROM it_projects WHERE id = ?`).get(id) as ProjectRow | undefined;
	return row ? toProject(row) : null;
}

export function listProjects(db: DatabaseSync): ProjectSummary[] {
	const rows = db
		.prepare(
			`SELECT id, name, description, repo_url AS repoUrl, tags, status, created_at AS createdAt,
			        updated_at AS updatedAt,
			        (SELECT count(*) FROM todos WHERE project_id = it_projects.id AND status != 'done') AS openTodos
			 FROM it_projects ORDER BY updated_at DESC, id DESC`
		)
		.all() as unknown as (Omit<ProjectSummary, 'tags'> & { tags: string })[];
	return rows.map((r) => ({ ...r, tags: JSON.parse(r.tags) }));
}

export function listProjectRefs(db: DatabaseSync): ProjectRef[] {
	return db
		.prepare('SELECT id, name, status FROM it_projects ORDER BY name COLLATE NOCASE, id')
		.all() as unknown as ProjectRef[];
}

function validate(input: ProjectInput): Result<{ name: string; description: string; repoUrl: string | null; tags: string }> {
	const name = input.name.trim();
	if (!name) return { ok: false, error: 'required', field: 'name' };
	const repo = (input.repoUrl ?? '').trim();
	if (repo && !URL.parse(repo)?.protocol.match(/^https?:$/)) return { ok: false, error: 'invalid', field: 'repoUrl' };
	return {
		ok: true,
		value: {
			name,
			description: (input.description ?? '').trim(),
			repoUrl: repo || null,
			tags: JSON.stringify(parseTags(input.tags ?? ''))
		}
	};
}

export function createProject(db: DatabaseSync, input: ProjectInput): Result<Project> {
	const v = validate(input);
	if (!v.ok) return v;
	const at = now().toISOString();
	const { lastInsertRowid } = db
		.prepare(
			`INSERT INTO it_projects (name, description, repo_url, tags, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.run(v.value.name, v.value.description, v.value.repoUrl, v.value.tags, at, at);
	return { ok: true, value: getProject(db, Number(lastInsertRowid))! };
}

export function updateProject(db: DatabaseSync, id: Id, input: ProjectInput): Result<Project> {
	if (!getProject(db, id)) return { ok: false, error: 'not-found' };
	const v = validate(input);
	if (!v.ok) return v;
	db.prepare(
		'UPDATE it_projects SET name = ?, description = ?, repo_url = ?, tags = ?, updated_at = ? WHERE id = ?'
	).run(v.value.name, v.value.description, v.value.repoUrl, v.value.tags, now().toISOString(), id);
	return { ok: true, value: getProject(db, id)! };
}

export function setProjectNotes(db: DatabaseSync, id: Id, notes: string): Result<Project> {
	const { changes } = db
		.prepare('UPDATE it_projects SET notes = ?, updated_at = ? WHERE id = ?')
		.run(notes, now().toISOString(), id);
	return changes ? { ok: true, value: getProject(db, id)! } : { ok: false, error: 'not-found' };
}

export function setProjectStatus(db: DatabaseSync, id: Id, status: ProjectStatus): Result<Project> {
	if (!getProject(db, id)) return { ok: false, error: 'not-found' };
	if (!PROJECT_STATUSES.includes(status)) return { ok: false, error: 'invalid', field: 'status' };
	db.prepare('UPDATE it_projects SET status = ?, updated_at = ? WHERE id = ?').run(status, now().toISOString(), id);
	return { ok: true, value: getProject(db, id)! };
}

export function deleteProject(db: DatabaseSync, id: Id): Result<{ unlinked: number }> {
	if (!getProject(db, id)) return { ok: false, error: 'not-found' };
	const { linked } = projectLinkCounts(db, id);
	db.prepare('DELETE FROM it_projects WHERE id = ?').run(id);
	return { ok: true, value: { unlinked: linked } };
}

export function projectLinkCounts(db: DatabaseSync, id: Id): { linked: number; open: number } {
	return db
		.prepare(
			`SELECT count(*) AS linked, coalesce(sum(status != 'done'), 0) AS open
			 FROM todos WHERE project_id = ?`
		)
		.get(id) as { linked: number; open: number };
}

export function projectTodos(db: DatabaseSync, id: Id): ProjectTodos {
	return {
		open: selectTodos(db, "project_id = ? AND status != 'done' AND sprint_id IS NULL", id),
		planned: selectTodos(db, "project_id = ? AND status != 'done' AND sprint_id IS NOT NULL", id),
		done: selectTodos(db, "project_id = ? AND status = 'done'", id).sort((a, b) =>
			(b.completedAt ?? '').localeCompare(a.completedAt ?? '')
		)
	};
}

export function countActiveProjects(db: DatabaseSync): number {
	return (db.prepare("SELECT count(*) AS n FROM it_projects WHERE status IN ('active', 'in_progress')").get() as { n: number }).n;
}

export function countProjectLinks(db: DatabaseSync): number {
	return (db.prepare('SELECT count(*) AS n FROM todos WHERE project_id IS NOT NULL').get() as { n: number }).n;
}

export function getItAspectId(db: DatabaseSync): Id | null {
	const row = db
		.prepare(
			`SELECT a.id FROM settings s JOIN aspects a ON a.id = CAST(s.value AS INTEGER)
			 WHERE s.key = 'it_aspect_id'`
		)
		.get() as { id: Id } | undefined;
	return row?.id ?? null;
}

export function setItAspectId(db: DatabaseSync, aspectId: Id): Result<{ unlinked: number }> {
	if (db.prepare('SELECT 1 FROM aspects WHERE id = ?').get(aspectId) === undefined) {
		return { ok: false, error: 'not-found', field: 'aspectId' };
	}
	if (getItAspectId(db) === aspectId) return { ok: true, value: { unlinked: 0 } };
	db.exec('BEGIN');
	try {
		const { changes } = db.prepare('UPDATE todos SET project_id = NULL WHERE project_id IS NOT NULL').run();
		db.prepare(
			`INSERT INTO settings (key, value) VALUES ('it_aspect_id', ?)
			 ON CONFLICT (key) DO UPDATE SET value = excluded.value`
		).run(String(aspectId));
		db.exec('COMMIT');
		return { ok: true, value: { unlinked: Number(changes) } };
	} catch (err) {
		db.exec('ROLLBACK');
		throw err;
	}
}
