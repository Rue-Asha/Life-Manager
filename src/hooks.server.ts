import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { getDb } from '$lib/server/db';
import { readConfig } from '$lib/server/proton/config';
import { configureWorker, nudge } from '$lib/server/proton/worker';

export const init: ServerInit = () => {
	try {
		getDb();
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
	configureWorker(readConfig(process.env));
};

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	if (event.request.method !== 'GET' && !event.url.pathname.startsWith('/__test/')) nudge();
	return response;
};
