import { test as base, type APIRequestContext, type Page, type Response } from '@playwright/test';
import { resolve } from 'node:path';
import { createFake } from '../scripts/fake-proton.mjs';
import type { PassOutcome, SyncStatus } from '../src/lib/server/proton/types';
import type { SeedInput, SeedResult } from '../src/routes/__test/seed/+server';

export type { SeedInput, SeedResult };
export { expect } from '@playwright/test';

// Same path as playwright.config.ts passes the server as FAKE_PROTON_DIR.
export const FAKE_PROTON_DIR = resolve(`.e2e/${Number(process.env.PORT ?? 4173)}-proton`);
export const FAKE_PROTON_CLI = resolve('scripts/fake-proton.mjs');

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
	fake().reset();
}

export function fake() {
	return createFake(FAKE_PROTON_DIR);
}

export interface ProtonOnOptions {
	profile?: string;
	debounceMs?: number;
	tickMs?: number;
	gapMs?: number;
}

// Long debounce and tick, so only explicit passes (protonPass) run.
export async function protonOn(request: APIRequestContext, opts: ProtonOnOptions = {}): Promise<void> {
	const enable = { cli: FAKE_PROTON_CLI, gapMs: 0, debounceMs: 3_600_000, tickMs: 3_600_000, ...opts };
	const response = await request.post('/__test/proton', { data: { enable } });
	if (!response.ok()) throw new Error(`protonOn failed: ${response.status()}`);
}

export async function protonPass(request: APIRequestContext, opts: { retryFailed?: boolean } = {}): Promise<PassOutcome | null> {
	const response = await request.post('/__test/proton', { data: { pass: opts } });
	if (!response.ok()) throw new Error(`protonPass failed: ${response.status()}`);
	return response.json();
}

export async function protonStatus(request: APIRequestContext): Promise<SyncStatus> {
	const response = await request.get('/__test/proton');
	if (!response.ok()) throw new Error(`protonStatus failed: ${response.status()}`);
	return response.json();
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

