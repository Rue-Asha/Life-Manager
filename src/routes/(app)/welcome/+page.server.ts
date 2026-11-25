import { fail, redirect } from '@sveltejs/kit';
import { PRESET_ASPECTS, type AspectColor, type AspectIcon } from '$lib/aspect-style';
import { createAspect, listAspects } from '$lib/server/aspects';
import { getDb } from '$lib/server/db';
import type { AspectInput } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

function takenNames(): Set<string> {
	return new Set(listAspects(getDb()).map((a) => a.name.toLowerCase()));
}

export const load: PageServerLoad = () => {
	const taken = takenNames();
	return { existingPresets: PRESET_ASPECTS.filter((p) => taken.has(p.name.toLowerCase())).map((p) => p.name) };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const presets = form.getAll('preset').map(String);
		// The custom fields are only rendered once "Add your own" is open.
		const custom: AspectInput | null = form.has('name')
			? {
					name: String(form.get('name')),
					color: String(form.get('color')) as AspectColor,
					icon: String(form.get('icon')) as AspectIcon
				}
			: null;
		const taken = takenNames();
		const fresh = PRESET_ASPECTS.filter((p) => presets.includes(p.name) && !taken.has(p.name.toLowerCase()));
		const inputs = [...fresh, ...(custom ? [custom] : [])];
		const values = { preset: presets, custom };
		if (inputs.length === 0) return fail(400, { error: 'required', field: 'preset', values });

		// All or nothing, so a rejected custom name doesn't leave the presets half-created.
		const db = getDb();
		db.exec('BEGIN');
		for (const input of inputs) {
			const result = createAspect(db, input);
			if (!result.ok) {
				db.exec('ROLLBACK');
				return fail(400, { error: result.error, field: result.field, values });
			}
		}
		db.exec('COMMIT');
		redirect(303, '/backlog');
	}
};
