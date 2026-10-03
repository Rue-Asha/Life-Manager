import type { ServerInit } from '@sveltejs/kit/hooks';
import { getDb } from '$lib/server/db';

export const init: ServerInit = () => {
	try {
		getDb();
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};
