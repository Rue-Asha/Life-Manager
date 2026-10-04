import { fail } from '@sveltejs/kit';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import {
	archiveSemester,
	countClassLinks,
	createClass,
	createSemester,
	deleteSemester,
	getUniAspectId,
	listDeadlines,
	listSemesters,
	renameSemester,
	semesterCounts,
	setUniAspectId,
	unarchiveSemester
} from '$lib/server/uni';
import type { ClassInput, Result } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

// Link rows arrive as repeated linkLabel / linkUrl fields, zipped in order.
function classInput(data: FormData): ClassInput {
	const text = (key: string) => String(data.get(key) ?? '');
	const urls = data.getAll('linkUrl').map(String);
	return {
		name: text('name'),
		color: text('color'),
		icon: text('icon'),
		lecturer: text('lecturer'),
		room: text('room'),
		ects: text('ects'),
		links: data.getAll('linkLabel').map((label, i) => ({ label: String(label), url: urls[i] ?? '' })),
		examAt: text('examAt'),
		examRoom: text('examRoom'),
		grade: text('grade')
	};
}

function failed(result: Result<unknown>) {
	if (!result.ok)
		return fail(result.error === 'not-found' ? 404 : result.error === 'archived' ? 409 : 400, {
			error: result.error,
			field: result.field
		});
}

export const load: PageServerLoad = () => {
	const db = getDb();
	const day = today();
	const { active, archived, overall } = listSemesters(db);
	return {
		uniAspectId: getUniAspectId(db),
		linkCount: countClassLinks(db),
		active,
		archived,
		overall,
		deadlines: listDeadlines(db, day),
		today: day,
		// The archive and delete confirms name these counts before anything is posted.
		counts: Object.fromEntries([...active, ...archived].map((s) => [s.id, semesterCounts(db, s.id)]))
	};
};

export const actions: Actions = {
	setUniAspect: async ({ request }) => {
		const data = await request.formData();
		const result = setUniAspectId(getDb(), Number(data.get('aspectId')));
		if (!result.ok) return fail(400, { error: result.error, field: result.field });
	},
	createSemester: async ({ request }) => {
		const data = await request.formData();
		return failed(createSemester(getDb(), String(data.get('name') ?? '')));
	},
	renameSemester: async ({ request }) => {
		const data = await request.formData();
		return failed(renameSemester(getDb(), Number(data.get('id')), String(data.get('name') ?? '')));
	},
	archive: async ({ request }) => {
		const data = await request.formData();
		return failed(archiveSemester(getDb(), Number(data.get('id'))));
	},
	unarchive: async ({ request }) => {
		const data = await request.formData();
		return failed(unarchiveSemester(getDb(), Number(data.get('id'))));
	},
	deleteSemester: async ({ request }) => {
		const data = await request.formData();
		return failed(deleteSemester(getDb(), Number(data.get('id'))));
	},
	createClass: async ({ request }) => {
		const data = await request.formData();
		return failed(createClass(getDb(), Number(data.get('semesterId')), classInput(data)));
	}
};
