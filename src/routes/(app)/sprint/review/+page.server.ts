import { fail, redirect } from '@sveltejs/kit';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { closeReview, reviewSummary, sprintPhase } from '$lib/server/sprints';
import type { Id, ReviewDecision } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const db = getDb();
	const { phase } = sprintPhase(db, today());
	if (phase === 'running') redirect(303, '/sprint');
	if (phase === 'none' || phase === 'planning') redirect(303, '/sprint/plan');
	return { today: today(), ...reviewSummary(db)! };
};

export const actions: Actions = {
	close: async ({ request }) => {
		const data = await request.formData();
		const decisions: Record<Id, ReviewDecision> = {};
		for (const [key, value] of data) {
			if (key.startsWith('decision-')) decisions[Number(key.slice(9))] = String(value) as ReviewDecision;
		}
		const result = closeReview(getDb(), today(), decisions);
		if (!result.ok) return fail(400, { error: result.error, field: result.field });
		redirect(303, '/sprint/plan');
	}
};
