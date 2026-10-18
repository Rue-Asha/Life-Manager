import { error, json } from '@sveltejs/kit';
import { configureWorker, syncNow, syncStatus } from '$lib/server/proton/worker';
import type { RequestHandler } from './$types';

interface Body {
	enable?: { cli: string; profile?: string; debounceMs?: number; tickMs?: number; gapMs?: number };
	disable?: true;
	pass?: { retryFailed?: boolean };
}

export const GET: RequestHandler = () => {
	if (process.env.LM_TEST !== '1') error(404);
	return json(syncStatus());
};

export const POST: RequestHandler = async ({ request }) => {
	if (process.env.LM_TEST !== '1') error(404);
	const body = (await request.json()) as Body;
	if (body.enable) {
		const { cli, profile, ...timings } = body.enable;
		configureWorker({ cli, profile: profile ?? 'default' }, timings);
	} else if (body.disable) {
		configureWorker(null);
	} else if (body.pass) {
		return json(await syncNow(body.pass));
	}
	return new Response(null, { status: 204 });
};
