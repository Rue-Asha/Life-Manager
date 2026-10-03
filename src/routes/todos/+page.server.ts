import { fail, redirect } from '@sveltejs/kit';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import {
	addChecklistItem,
	createTodo,
	deleteChecklistItem,
	deleteTodo,
	renameChecklistItem,
	toggleChecklistItem,
	updateTodo
} from '$lib/server/todos';
import { addToActiveSprint, moveToBacklog, setDay, setStatus, toggleDone } from '$lib/server/sprints';
import type { Priority, Result, Status, Target, TodoPatch } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

// Every view posts here; the route itself has nothing to show.
export const load: PageServerLoad = () => redirect(303, '/backlog');

function respond<T>(result: Result<T>, data: FormData) {
	if (result.ok) return { ok: true };
	const values = Object.fromEntries([...data].map(([k, v]) => [k, String(v)]));
	return fail(400, { error: result.error, field: result.field, values });
}

const text = (data: FormData, key: string) => String(data.get(key) ?? '');
const num = (data: FormData, key: string) => Number(data.get(key));
const optionalDate = (data: FormData, key: string) => text(data, key) || null;

function target(data: FormData): Target {
	const kind = text(data, 'target');
	if (kind === 'sprint') return { kind };
	if (kind === 'day') return { kind, day: text(data, 'day') };
	return { kind: 'backlog' };
}

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const result = createTodo(getDb(), {
			title: text(data, 'title'),
			aspectId: num(data, 'aspectId'),
			notes: text(data, 'notes'),
			priority: num(data, 'priority') as Priority,
			dueDate: optionalDate(data, 'dueDate'),
			checklist: data.getAll('checklist').map(String),
			target: target(data)
		});
		return respond(result, data);
	},
	update: async ({ request }) => {
		const data = await request.formData();
		const patch: TodoPatch = {};
		if (data.has('title')) patch.title = text(data, 'title');
		if (data.has('aspectId')) patch.aspectId = num(data, 'aspectId');
		if (data.has('notes')) patch.notes = text(data, 'notes');
		if (data.has('priority')) patch.priority = num(data, 'priority') as Priority;
		if (data.has('dueDate')) patch.dueDate = optionalDate(data, 'dueDate');
		return respond(updateTodo(getDb(), num(data, 'id'), patch), data);
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		return respond(deleteTodo(getDb(), num(data, 'id')), data);
	},
	checklistAdd: async ({ request }) => {
		const data = await request.formData();
		return respond(addChecklistItem(getDb(), num(data, 'todoId'), text(data, 'text')), data);
	},
	checklistRename: async ({ request }) => {
		const data = await request.formData();
		return respond(renameChecklistItem(getDb(), num(data, 'itemId'), text(data, 'text')), data);
	},
	checklistToggle: async ({ request }) => {
		const data = await request.formData();
		return respond(toggleChecklistItem(getDb(), num(data, 'itemId'), text(data, 'done') === 'true'), data);
	},
	checklistDelete: async ({ request }) => {
		const data = await request.formData();
		return respond(deleteChecklistItem(getDb(), num(data, 'itemId')), data);
	},
	setStatus: async ({ request }) => {
		const data = await request.formData();
		return respond(setStatus(getDb(), num(data, 'id'), text(data, 'status') as Status), data);
	},
	toggleDone: async ({ request }) => {
		const data = await request.formData();
		return respond(toggleDone(getDb(), num(data, 'id')), data);
	},
	setDay: async ({ request }) => {
		const data = await request.formData();
		return respond(setDay(getDb(), num(data, 'id'), optionalDate(data, 'day')), data);
	},
	addToSprint: async ({ request }) => {
		const data = await request.formData();
		return respond(addToActiveSprint(getDb(), num(data, 'id'), today()), data);
	},
	moveToBacklog: async ({ request }) => {
		const data = await request.formData();
		return respond(moveToBacklog(getDb(), num(data, 'id')), data);
	}
};
