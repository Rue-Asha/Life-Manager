import { test as base, type APIRequestContext, type Locator, type Page, type Response } from '@playwright/test';
import { resolve } from 'node:path';
import { createFake } from '../scripts/fake-proton.mjs';
import { menuNav, POSTURE_SWITCH } from '../src/lib/nav';
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

// Top bar from POSTURE_SWITCH, pill bar below (navigation contract).
export function posture(page: Page): 'phone' | 'desktop' {
	return (page.viewportSize()?.width ?? 1280) >= POSTURE_SWITCH ? 'desktop' : 'phone';
}

// A primary destination is a link in navigation "Main" at both postures; the rest sit in the
// top bar's "More" menu or, on the phone, in the More hub behind the "More" tab. An aspect is
// opened by its name.
export async function openNav(page: Page, name: string): Promise<void> {
	const nav = page.getByRole('navigation', { name: 'Main' });
	const label = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
	const primary = nav.getByRole('link', { name: label });
	if (!menuNav.some((item) => item.label === name) && (await primary.count()) > 0) {
		await primary.first().click();
		return;
	}
	if (posture(page) === 'desktop') {
		await nav.getByRole('button', { name: /^More\b/ }).click();
		const menu = page.getByRole('menu');
		await menu.getByRole('menuitem', { name: label }).or(menu.getByRole('link', { name: label })).first().click();
	} else {
		await nav.getByRole('link', { name: /^More\b/ }).click();
		await page.waitForURL('**/menu');
		// The hub's Aspects entry is the "All aspects" row; each aspect has its own row above it.
		const entry = name === 'Aspects' ? /^All aspects\b/ : label;
		await page.getByRole('main').getByRole('link', { name: entry }).first().click();
	}
}

// The desktop "New todo" pill and the phone "+" share the name; both open the one quick add.
export async function openNewTodo(page: Page): Promise<Locator> {
	await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'New todo' }).click();
	const dialog = page.getByRole('dialog', { name: 'New todo' });
	await dialog.waitFor();
	return dialog;
}

export const todoRow = (scope: Page | Locator, title: string) => scope.getByRole('listitem', { name: title });

export const todoRows = (scope: Page | Locator) => scope.getByRole('listitem', { name: /\S/ });

export const todoTitles = (scope: Page | Locator) =>
	todoRows(scope).evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));

const weekdayShort = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });
const dayMonth = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const utc = (day: string) => new Date(`${day}T00:00:00Z`);

// A sprint week column, named by its heading: "Tue 3" for 2026-11-03, or "Unscheduled".
export const dayColumn = (scope: Page | Locator, day: string | null) =>
	scope.getByRole('region', {
		name: day === null ? /^Unscheduled\b/ : new RegExp(`^${weekdayShort.format(utc(day))} ${utc(day).getUTCDate()}\\b`)
	});

// A calendar month cell, named by its visually hidden date: "Wed 21 Oct".
export const calendarCell = (scope: Page | Locator, day: string) =>
	scope.getByRole('group', { name: 'Month grid' }).getByRole('button', { name: dayMonth.format(utc(day)) });

// An aspect group on Today, Backlog and the sprint list: a region named by its heading.
export const aspectGroup = (scope: Page | Locator, name: string) => scope.getByRole('region', { name: new RegExp(`^${name}\\b`) });

// A calendar entry inside a month cell (the span holding its colour mark and title), or an entry of the day list, a listitem named by its title.
export const cellEntries = (cell: Locator) => cell.locator('span:has(> i)');

export const dayListEntries = (scope: Page | Locator) => scope.getByRole('listitem', { name: /\S/ });

export const projectCard = (scope: Page | Locator, name: string) => scope.getByRole('listitem', { name });

export const projectCards = (scope: Page | Locator) => scope.getByRole('listitem', { name: /\S/ });

export const ruleRow = (scope: Page | Locator, title: string) => scope.getByRole('listitem', { name: title });

export const ruleRows = (scope: Page | Locator) => scope.getByRole('listitem', { name: /\S/ });

// The computed colour a fingerprint token resolves to, for comparing against a rendered element.
export const tokenColor = (page: Page, token: string) =>
	page.evaluate((t) => {
		const probe = document.createElement('span');
		probe.style.color = `var(${t})`;
		document.body.append(probe);
		const value = getComputedStyle(probe).color;
		probe.remove();
		return value;
	}, token);
