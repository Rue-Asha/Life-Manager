import { error } from '@sveltejs/kit';
import { setTestNow } from '$lib/server/clock';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	if (process.env.LM_TEST !== '1') error(404);
	const { now } = (await request.json()) as { now: string | null };
	setTestNow(now === null ? null : new Date(now));
	return new Response(null, { status: 204 });
};
