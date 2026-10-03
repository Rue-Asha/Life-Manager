import type { APIRequestContext } from '@playwright/test';
import type { SeedInput, SeedResult } from '../src/routes/__test/seed/+server';

export type { SeedInput, SeedResult };

// A POST without a content type counts as a form post, which SvelteKit's CSRF check rejects.
export async function reset(request: APIRequestContext): Promise<void> {
	const response = await request.post('/__test/reset', { data: {} });
	if (!response.ok()) throw new Error(`reset failed: ${response.status()}`);
}

export async function seed(request: APIRequestContext, input: SeedInput): Promise<SeedResult> {
	const response = await request.post('/__test/seed', { data: input });
	if (!response.ok()) throw new Error(`seed failed: ${response.status()} ${await response.text()}`);
	return response.json();
}

// `now` is an instant (ISO string); "today" is derived from it in Europe/Berlin. null = real time.
export async function setClock(request: APIRequestContext, now: string | null): Promise<void> {
	const response = await request.post('/__test/clock', { data: { now } });
	if (!response.ok()) throw new Error(`setClock failed: ${response.status()}`);
}
