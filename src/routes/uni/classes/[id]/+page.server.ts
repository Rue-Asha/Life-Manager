import { error, fail, redirect } from '@sveltejs/kit';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { sprintPhase } from '$lib/server/sprints';
import { setRevisedAt } from '$lib/server/todos';
import { classCounts, classRules, classTodos, deleteClass, getClass, setClassNotes, updateClass } from '$lib/server/uni';
import { renderMarkdown } from '$lib/markdown';
import type { ClassInput } from '$lib/types';
import { weekDays } from '$lib/week';
import type { Actions, PageServerLoad } from './$types';

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

function classInput(form: FormData): ClassInput {
	const urls = form.getAll('linkUrl').map(String);
	return {
		name: String(form.get('name') ?? ''),
		color: String(form.get('color') ?? ''),
		icon: String(form.get('icon') ?? ''),
		lecturer: String(form.get('lecturer') ?? ''),
		room: String(form.get('room') ?? ''),
		ects: String(form.get('ects') ?? ''),
		links: form.getAll('linkLabel').map((label, i) => ({ label: String(label), url: urls[i] ?? '' })),
		examAt: String(form.get('examAt') ?? ''),
		examRoom: String(form.get('examRoom') ?? ''),
		grade: String(form.get('grade') ?? '')
	};
}

const status = (error: string) => (error === 'archived' ? 409 : 400);

export const actions: Actions = {
	update: async ({ request, params }) => {
		const result = updateClass(getDb(), Number(params.id), classInput(await request.formData()));
		if (!result.ok) return fail(status(result.error), { error: result.error, field: result.field });
	},
	notes: async ({ request, params }) => {
		const notes = String((await request.formData()).get('notes') ?? '');
		const result = setClassNotes(getDb(), Number(params.id), notes);
		if (!result.ok) return fail(status(result.error), { error: result.error, field: result.field });
	},
	revised: async ({ request }) => {
		const form = await request.formData();
		const date = String(form.get('date') ?? '');
		const result = setRevisedAt(getDb(), Number(form.get('todoId')), date || null);
		if (!result.ok) return fail(status(result.error), { error: result.error, field: result.field });
	},
	delete: ({ params }) => {
		const result = deleteClass(getDb(), Number(params.id));
		if (!result.ok) return fail(400, { error: result.error });
		redirect(303, '/uni');
	}
};
