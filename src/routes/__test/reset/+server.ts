import { error } from '@sveltejs/kit';
import { setTestNow } from '$lib/server/clock';
import { resetDb } from '$lib/server/db';
import { resetWorker } from '$lib/server/proton/worker';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	if (process.env.LM_TEST !== '1') error(404);
	await resetWorker();
	resetDb();
	setTestNow(null);
	return new Response(null, { status: 204 });
};
