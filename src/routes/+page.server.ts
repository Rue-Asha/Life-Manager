import { listAspects } from '$lib/server/aspects';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { listToday, sprintPhase } from '$lib/server/sprints';
import { listOverdue } from '$lib/server/todos';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const db = getDb();
	const day = today();
	const { phase } = sprintPhase(db, day);
	const overdue = listOverdue(db, day);
	return {
		aspects: listAspects(db),
		today: day,
		phase,
		overdue,
		todos: listToday(db, day).filter((t) => !overdue.some((o) => o.id === t.id))
	};
};
