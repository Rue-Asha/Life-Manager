import { redirect } from '@sveltejs/kit';
import { listAspects } from '$lib/server/aspects';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { countActiveProjects, getItAspectId, listProjectRefs } from '$lib/server/projects';
import { listRules } from '$lib/server/recurring';
import { getActiveSprint, listSprintTodos, listToday } from '$lib/server/sprints';
import { listBacklog, listOverdue } from '$lib/server/todos';
import type { NavData } from '$lib/components/shell/Sidebar.svelte';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ url }) => {
	const db = getDb();
	const aspects = listAspects(db);
	if (aspects.length === 0 && url.pathname !== '/welcome') redirect(303, '/welcome');

	const day = today();
	const backlog = listBacklog(db);
	const active = getActiveSprint(db);
	const nav: NavData = {
		counts: {
			today: listToday(db, day).filter((t) => t.status !== 'done').length,
			overdue: listOverdue(db, day).length,
			sprint: active ? listSprintTodos(db, active.id).filter((t) => t.status !== 'done').length : 0,
			backlog: backlog.length,
			recurring: listRules(db).length,
			aspects: aspects.length,
			projects: countActiveProjects(db)
		},
		aspects: aspects.map((a) => ({ ...a, backlog: backlog.filter((t) => t.aspectId === a.id).length }))
	};
	return { aspects, nav, projects: listProjectRefs(db), itAspectId: getItAspectId(db) };
};
