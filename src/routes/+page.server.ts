import { listAspects } from '$lib/server/aspects';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { aspectProgress, listSprintTodos, listToday, sprintPhase } from '$lib/server/sprints';
import { listOverdue } from '$lib/server/todos';
import { berlinToday, weekDays } from '$lib/week';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const db = getDb();
	const day = today();
	const { phase, sprint } = sprintPhase(db, day);
	const active = phase === 'none' || phase === 'planning' ? null : sprint;
	// A sprint todo ticked while overdue leaves listOverdue; it stays, struck through, for the day it was ticked.
	const tickedLate = active
		? listSprintTodos(db, active.id).filter(
				(t) => t.status === 'done' && t.dueDate !== null && t.dueDate < day && berlinToday(new Date(t.completedAt!)) === day
			)
		: [];
	const overdue = [...listOverdue(db, day), ...tickedLate].sort(
		(a, b) => a.dueDate!.localeCompare(b.dueDate!) || a.id - b.id
	);
	return {
		aspects: listAspects(db),
		today: day,
		phase,
		activeSprintId: active?.id ?? null,
		sprintDays: active ? weekDays(active.weekStart!) : [],
		progress: active ? aspectProgress(db, active.id) : {},
		overdue,
		todos: listToday(db, day).filter((t) => !overdue.some((o) => o.id === t.id))
	};
};
