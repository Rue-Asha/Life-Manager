import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { countProjectLinks, createProject, getItAspectId, listProjects, setItAspectId } from '$lib/server/projects';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const db = getDb();
	return { projects: listProjects(db), itAspectId: getItAspectId(db), linkCount: countProjectLinks(db) };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const values = {
			name: String(data.get('name') ?? ''),
			description: String(data.get('description') ?? ''),
			repoUrl: String(data.get('repoUrl') ?? ''),
			tags: String(data.get('tags') ?? '')
		};
		const result = createProject(getDb(), values);
		if (!result.ok) return fail(400, { error: result.error, field: result.field, values });
	},
	setItAspect: async ({ request }) => {
		const data = await request.formData();
		const result = setItAspectId(getDb(), Number(data.get('aspectId')));
		if (!result.ok) return fail(400, { error: result.error, field: result.field });
	}
};
