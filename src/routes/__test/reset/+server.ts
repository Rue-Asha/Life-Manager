import { error } from '@sveltejs/kit';
import { setTestNow } from '$lib/server/clock';
import { resetDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = () => {
	if (process.env.LM_TEST !== '1') error(404);
	resetDb();
	setTestNow(null);
	return new Response(null, { status: 204 });
};
