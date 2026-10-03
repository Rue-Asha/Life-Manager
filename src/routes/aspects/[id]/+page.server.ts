import { error } from '@sveltejs/kit';
import { listAspects } from '$lib/server/aspects';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { aspectProgress, listSprintTodos, sprintPhase } from '$lib/server/sprints';
import { listBacklog } from '$lib/server/todos';
import { weekDays } from '$lib/week';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const db = getDb();
	const aspects = listAspects(db);
	const aspect = aspects.find((a) => String(a.id) === params.id);
	if (!aspect) error(404, 'No such aspect');

	const day = today();
	const { phase, sprint } = sprintPhase(db, day);
	// While the review is required the sprint is over: nothing joins it and its list waits for Review.
	const showSprint = sprint !== null && (phase === 'running' || phase === 'review-available');
	const backlog = listBacklog(db, aspect.id);
	return {
		aspect,
		aspects,
		phase,
		today: day,
		sprintDays: showSprint ? weekDays(sprint.weekStart!) : null,
		sprintTodos: showSprint ? listSprintTodos(db, sprint.id).filter((t) => t.aspectId === aspect.id) : [],
		backlog,
		progress: showSprint ? (aspectProgress(db, sprint.id)[aspect.id] ?? { done: 0, total: 0 }) : null,
		backlogCount: backlog.length
	};
};
