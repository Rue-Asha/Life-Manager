import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { aspectProgress, listSprintTodos, sprintPhase } from '$lib/server/sprints';
import { backlogCounts, listBacklog } from '$lib/server/todos';
import { weekDays } from '$lib/week';
import type { PageServerLoad } from './$types';

const VIEWS = ['aspect', 'board', 'week'] as const;

export const load: PageServerLoad = ({ url }) => {
	const db = getDb();
	const day = today();
	const param = url.searchParams.get('view');
	const view = VIEWS.find((v) => v === param) ?? 'aspect';
	const { phase, sprint } = sprintPhase(db, day);
	// Sunday is still a sprint day: its review is offered above the views, not instead of them.
	const showSprint = sprint !== null && (phase === 'running' || phase === 'review-available');
	return {
		view,
		phase,
		today: day,
		todos: showSprint ? listSprintTodos(db, sprint.id) : [],
		sprintDays: showSprint ? weekDays(sprint.weekStart!) : null,
		backlog: showSprint ? listBacklog(db) : [],
		progress: showSprint ? aspectProgress(db, sprint.id) : {},
		backlogCounts: showSprint ? backlogCounts(db) : {}
	};
};
