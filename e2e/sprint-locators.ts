import type { Locator, Page } from '@playwright/test';

const STATUS_NAMES = { todo: 'To do', doing: 'Doing', done: 'Done' } as const;

// A board column, named by its heading: "To do", "Doing" or "Done" followed by the count.
export const boardColumn = (scope: Page | Locator, status: keyof typeof STATUS_NAMES) =>
	scope.getByRole('region', { name: new RegExp(`^${STATUS_NAMES[status]}`) });

// The page's backlog rail: an aside that is display: none whenever it is not docked or opened.
export const contextRail = (page: Page) =>
	page.getByRole('complementary', { name: 'Backlog', exact: true, includeHidden: true });

export const railToggle = (page: Page) => page.getByRole('button', { name: 'Backlog', exact: true, includeHidden: true });

export const backlogRail = (scope: Page | Locator) =>
	scope.getByRole('group', { name: 'Backlog todos', includeHidden: true });

export const railGroup = (scope: Page | Locator, aspect: string) =>
	scope.getByRole('region', { name: `In backlog: ${aspect}`, exact: true });

export const sprintList = (scope: Page | Locator) => scope.getByRole('group', { name: 'Sprint todos' });

export const sprintPrompt = (scope: Page | Locator) => scope.getByRole('region', { name: 'Sprint prompt' });

export const weekGrid = (scope: Page | Locator) => scope.getByRole('group', { name: 'Week', exact: true });

export const sprintCard = (scope: Page | Locator, title: string) => scope.getByRole('group', { name: title });

export const plannedLabel = (scope: Page | Locator) => scope.getByRole('time');
