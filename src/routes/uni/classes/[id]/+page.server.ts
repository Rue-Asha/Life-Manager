import { error } from '@sveltejs/kit';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { sprintPhase } from '$lib/server/sprints';
import { classCounts, classRules, classTodos, getClass } from '$lib/server/uni';
import { renderMarkdown } from '$lib/markdown';
import { weekDays } from '$lib/week';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const db = getDb();
	const id = Number(params.id);
	const cls = getClass(db, id);
	if (!cls) error(404, 'No such class');

	const day = today();
	const { phase, sprint } = sprintPhase(db, day);
	const canAdd = sprint !== null && (phase === 'running' || phase === 'review-available');
	return {
		cls,
		notesHtml: renderMarkdown(cls.notes),
		todos: classTodos(db, id),
		rules: classRules(db, id),
		counts: classCounts(db, id),
		today: day,
		sprintDays: canAdd ? weekDays(sprint.weekStart!) : null
	};
};
