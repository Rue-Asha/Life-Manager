import { test as base, type APIRequestContext, type Page, type Response } from '@playwright/test';
import type { SeedInput, SeedResult } from '../src/routes/__test/seed/+server';

export type { SeedInput, SeedResult };
export { expect } from '@playwright/test';

// Input that lands on the server-rendered page before hydration is silently lost, so every
// document load waits until the root layout has mounted.
function waitForHydration(page: Page): void {
	for (const name of ['goto', 'reload', 'goBack', 'goForward'] as const) {
		const navigate = page[name].bind(page) as (...args: unknown[]) => Promise<Response | null>;
		Object.assign(page, {
			[name]: async (...args: unknown[]) => {
				const response = await navigate(...args);
				if (response?.headers()['content-type']?.startsWith('text/html'))
					await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
				return response;
			}
		});
	}
}

export const test = base.extend({
	context: async ({ context }, use) => {
		context.on('page', waitForHydration);
		await use(context);
	}
});

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

