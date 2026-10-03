import { listAspects } from '$lib/server/aspects';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { getActiveSprint } from '$lib/server/sprints';
import { listBacklog } from '$lib/server/todos';
import { weekDays } from '$lib/week';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const db = getDb();
	const param = url.searchParams.get('aspect');
	const aspectId = param ? Number(param) : null;
	const active = getActiveSprint(db);
	return {
		aspects: listAspects(db),
		todos: listBacklog(db, aspectId ?? undefined),
		aspectId,
		today: today(),
		sprintDays: active ? weekDays(active.weekStart!) : null
	};
};
