import { fail, redirect } from '@sveltejs/kit';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { listSprintTodos, pullTodo, sprintPhase, startSprint, suggestedTodos, unpullTodo } from '$lib/server/sprints';
import { listBacklog } from '$lib/server/todos';
import type { Result } from '$lib/types';
import { targetWeek } from '$lib/week';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const db = getDb();
	const day = today();
	const { phase, sprint } = sprintPhase(db, day);
	if (phase === 'running') redirect(303, '/sprint');
	if (phase === 'review-available' || phase === 'review-required') redirect(303, '/sprint/review');

	// Opening the page doesn't create the draft; the first pull does.
	const suggested = suggestedTodos(db, day);
	return {
		today: day,
		weekStart: targetWeek(day),
		planned: sprint ? listSprintTodos(db, sprint.id) : [],
		suggested,
		backlog: listBacklog(db).filter((t) => !suggested.some((s) => s.id === t.id))
	};
};

function respond<T>(result: Result<T>) {
	if (!result.ok) return fail(400, { error: result.error, field: result.field });
}

export const actions: Actions = {
	pull: async ({ request }) => {
		const data = await request.formData();
		return respond(pullTodo(getDb(), Number(data.get('id'))));
	},
	unpull: async ({ request }) => {
		const data = await request.formData();
		return respond(unpullTodo(getDb(), Number(data.get('id'))));
	},
	start: async ({ request }) => {
		const data = await request.formData();
		const result = startSprint(getDb(), today(), data.getAll('suggested').map(Number));
		if (!result.ok) return respond(result);
		redirect(303, '/sprint');
	}
};
