import { parseAspectFilter } from '$lib/aspect-filter';
import { listAspects } from '$lib/server/aspects';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { sprintPhase } from '$lib/server/sprints';
import { listBacklog } from '$lib/server/todos';
import { isOverdue } from '$lib/todo-utils';
import { weekDays } from '$lib/week';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const db = getDb();
	const filter = parseAspectFilter(url.searchParams.get('aspect'));
	const aspects = listAspects(db);
	const known = filter.kind === 'id' && aspects.some((a) => a.id === filter.id);
	const aspectId = known && filter.kind === 'id' ? filter.id : null;
	const empty = filter.kind === 'unknown' || (filter.kind === 'id' && !known);
	const day = today();
	const { phase, sprint } = sprintPhase(db, day);
	// Nothing joins a sprint whose review is required; the page points to Review instead.
	const canAdd = sprint !== null && (phase === 'running' || phase === 'review-available');
	// The key-facts card counts the whole backlog, whatever the filter shows.
	const all = listBacklog(db);
	return {
		aspects,
		facts: {
			open: all.length,
			planned: all.filter((t) => t.day !== null).length,
			overdue: all.filter((t) => isOverdue(t, day)).length
		},
		todos: empty ? [] : aspectId === null ? all : all.filter((t) => t.aspectId === aspectId),
		aspectId,
		phase,
		today: day,
		sprintDays: canAdd ? weekDays(sprint.weekStart!) : null
	};
};
