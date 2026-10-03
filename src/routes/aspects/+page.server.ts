import { fail, redirect } from '@sveltejs/kit';
import type { AspectColor, AspectIcon } from '$lib/aspect-style';
import {
	aspectUsage,
	countAspects,
	createAspect,
	deleteAspect,
	listAspects,
	updateAspect
} from '$lib/server/aspects';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { aspectProgress, sprintPhase } from '$lib/server/sprints';
import { backlogCounts } from '$lib/server/todos';
import type { AspectInput } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const db = getDb();
	const { phase, sprint } = sprintPhase(db, today());
	const showSprint = sprint !== null && (phase === 'running' || phase === 'review-available');
	return {
		aspects: listAspects(db).map((a) => ({ ...a, usage: aspectUsage(db, a.id) })),
		progress: showSprint ? aspectProgress(db, sprint.id) : null,
		backlogCounts: backlogCounts(db)
	};
};

function aspectInput(form: FormData): AspectInput {
	return {
		name: String(form.get('name') ?? ''),
		color: String(form.get('color')) as AspectColor,
		icon: String(form.get('icon')) as AspectIcon
	};
}

export const actions: Actions = {
	create: async ({ request }) => {
		const input = aspectInput(await request.formData());
		const result = createAspect(getDb(), input);
		if (!result.ok) return fail(400, { error: result.error, field: result.field, values: input });
		return { aspect: result.value };
	},
	update: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const input = aspectInput(form);
		const result = updateAspect(getDb(), id, input);
		if (!result.ok) return fail(400, { error: result.error, field: result.field, values: { id, ...input } });
		return { aspect: result.value };
	},
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const targetId = form.has('targetId') ? Number(form.get('targetId')) : undefined;
		const db = getDb();
		const result = deleteAspect(db, id, targetId);
		if (!result.ok) return fail(400, { error: result.error, field: result.field, values: { id, targetId } });
		if (countAspects(db) === 0) redirect(303, '/welcome');
	}
};
