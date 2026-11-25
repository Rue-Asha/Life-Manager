import { expect, type Locator, type Page } from '@playwright/test';

// A sprint row's status and day sit behind menus: the glyph "Status: <label>" and "More actions" (its Day group). On a week chip the
// glyph's menu holds both ("Status and day"); a Board card has no glyph, its "More actions" holds the Status group as well. Each
// helper opens the right menu and picks the item. The trigger and the pick are retried as a whole (a menu opened while the page still settles can close again): right after a view switch the outgoing view's
// copy of the row is still there for a moment.

const glyphOf = (row: Locator) => row.getByRole('button', { name: /^Status: / });
const moreOf = (row: Locator) => row.getByRole('button', { name: 'More actions' });

export async function chooseStatus(page: Page, row: Locator, label: 'To do' | 'Doing' | 'Done'): Promise<void> {
	await expect(async () => {
		const glyph = glyphOf(row);
		await ((await glyph.count()) ? glyph : moreOf(row)).first().click({ timeout: 2000 });
		await page.getByRole('menu').getByRole('menuitemradio', { name: label, exact: true }).click({ timeout: 2000 });
	}).toPass({ timeout: 15000 });
}

export async function chooseDay(page: Page, row: Locator, label: string): Promise<void> {
	await expect(async () => {
		const more = moreOf(row);
		await ((await more.count()) ? more : glyphOf(row)).first().click({ timeout: 2000 });
		await page.getByRole('menu').getByRole('menuitemradio', { name: label, exact: true }).click({ timeout: 2000 });
	}).toPass({ timeout: 15000 });
}

export const STATUS_LABEL = { todo: 'To do', doing: 'Doing', done: 'Done' } as const;

// A todo's status as its row shows it: the glyph's name on a sprint row, hidden text where the row has no glyph (Today, backlog, Board card).
export const statusOf = (row: Locator, label: string): Locator =>
	row.getByLabel(`Status: ${label}`, { exact: true }).or(row.getByText(`Status: ${label}`, { exact: true }));
