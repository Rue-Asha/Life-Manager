import { error, fail, redirect } from '@sveltejs/kit';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import {
	deleteProject,
	getProject,
	projectLinkCounts,
	projectTodos,
	setProjectNotes,
	setProjectStatus,
	updateProject
} from '$lib/server/projects';
import { sprintPhase } from '$lib/server/sprints';
import { renderMarkdown } from '$lib/markdown';
import type { ProjectInput, ProjectStatus } from '$lib/types';
import { weekDays } from '$lib/week';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const db = getDb();
	const id = Number(params.id);
	const project = getProject(db, id);
	if (!project) error(404, 'No such project');

	const day = today();
	const { phase, sprint } = sprintPhase(db, day);
	const canAdd = sprint !== null && (phase === 'running' || phase === 'review-available');
	return {
		project,
		notesHtml: renderMarkdown(project.notes),
		todos: projectTodos(db, id),
		counts: projectLinkCounts(db, id),
		today: day,
		sprintDays: canAdd ? weekDays(sprint.weekStart!) : null
	};
};

function projectInput(form: FormData): ProjectInput {
	return {
		name: String(form.get('name') ?? ''),
		description: String(form.get('description') ?? ''),
		repoUrl: String(form.get('repoUrl') ?? ''),
		tags: String(form.get('tags') ?? '')
	};
}

export const actions: Actions = {
	update: async ({ request, params }) => {
		const input = projectInput(await request.formData());
		const result = updateProject(getDb(), Number(params.id), input);
		if (!result.ok) return fail(400, { error: result.error, field: result.field, values: input });
	},
	notes: async ({ request, params }) => {
		const notes = String((await request.formData()).get('notes') ?? '');
		const result = setProjectNotes(getDb(), Number(params.id), notes);
		if (!result.ok) return fail(400, { error: result.error, field: result.field });
	},
	status: async ({ request, params }) => {
		const status = String((await request.formData()).get('status')) as ProjectStatus;
		const result = setProjectStatus(getDb(), Number(params.id), status);
		if (!result.ok) return fail(400, { error: result.error, field: result.field });
	},
	delete: ({ params }) => {
		const result = deleteProject(getDb(), Number(params.id));
		if (!result.ok) return fail(400, { error: result.error, field: result.field });
		redirect(303, '/projects');
	}
};
