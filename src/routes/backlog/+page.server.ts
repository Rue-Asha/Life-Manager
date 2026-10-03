import { listAspects } from '$lib/server/aspects';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { sprintPhase } from '$lib/server/sprints';
import { listBacklog } from '$lib/server/todos';
import { weekDays } from '$lib/week';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const db = getDb();
	const param = url.searchParams.get('aspect');
	const aspectId = param ? Number(param) : null;
	const day = today();
	const { phase, sprint } = sprintPhase(db, day);
	// Nothing joins a sprint whose review is required; the page points to Review instead.
	const canAdd = sprint !== null && (phase === 'running' || phase === 'review-available');
	return {
		aspects: listAspects(db),
		todos: listBacklog(db, aspectId ?? undefined),
		aspectId,
		phase,
		today: day,
		sprintDays: canAdd ? weekDays(sprint.weekStart!) : null
	};
};
