import { fail } from '@sveltejs/kit';
import { listAspects } from '$lib/server/aspects';
import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { createRule, deleteRule, listRules, updateRule } from '$lib/server/recurring';
import type { Priority, Result, RuleInput, Weekday } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const db = getDb();
	return { rules: listRules(db), aspects: listAspects(db) };
};

function ruleInput(data: FormData): RuleInput {
	return {
		title: String(data.get('title') ?? ''),
		aspectId: Number(data.get('aspectId')),
		weekdays: data.getAll('weekday').map(Number) as Weekday[],
		notes: String(data.get('notes') ?? '').trim(),
		priority: Number(data.get('priority') ?? 0) as Priority,
		checklist: data
			.getAll('checklist')
			.map((text) => String(text).trim())
			.filter(Boolean)
	};
}

function respond<T>(result: Result<T>, values: RuleInput) {
	if (!result.ok) return fail(400, { error: result.error, field: result.field, values });
}

export const actions: Actions = {
	create: async ({ request }) => {
		const values = ruleInput(await request.formData());
		return respond(createRule(getDb(), values, today()), values);
	},
	update: async ({ request }) => {
		const data = await request.formData();
		const values = ruleInput(data);
		return respond(updateRule(getDb(), Number(data.get('id')), values), values);
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const result = deleteRule(getDb(), Number(data.get('id')));
		if (!result.ok) return fail(400, { error: result.error, field: result.field });
	}
};
