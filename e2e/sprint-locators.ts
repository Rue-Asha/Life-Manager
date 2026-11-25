import type { Locator, Page } from '@playwright/test';

const STATUS_NAMES = { todo: 'To do', doing: 'Doing', done: 'Done' } as const;

// A board column, named by its heading: "To do", "Doing" or "Done" followed by the count.
export const boardColumn = (scope: Page | Locator, status: keyof typeof STATUS_NAMES) =>
	scope.getByRole('region', { name: new RegExp(`^${STATUS_NAMES[status]}`) });

// The page's backlog rail: an aside that is display: none whenever it is not docked (below 1280 px, or folded in Week).
export const contextRail = (page: Page) =>
	page.getByRole('complementary', { name: 'Backlog', exact: true, includeHidden: true });

// Week at 1280 px and up: the folded rail's slim tab ("Backlog", the count, "todos, show the backlog") and the docked rail's "Hide backlog".
export const railTab = (page: Page) => page.getByRole('button', { name: /^Backlog .*show the backlog$/, includeHidden: true });

export const railHide = (page: Page) => page.getByRole('button', { name: 'Hide backlog', exact: true, includeHidden: true });

// "Manage" opens the backlog sheet below 1280 px; it is display: none beside the docked rail.
export const manageButton = (page: Page) => page.getByRole('button', { name: 'Manage', exact: true, includeHidden: true });

export const backlogRail = (scope: Page | Locator) =>
	scope.getByRole('group', { name: 'Backlog todos', includeHidden: true });

export const railGroup = (scope: Page | Locator, aspect: string) =>
	scope.getByRole('region', { name: `In backlog: ${aspect}`, exact: true });

export const sprintList = (scope: Page | Locator) => scope.getByRole('group', { name: 'Sprint todos' });

export const sprintPrompt = (scope: Page | Locator) => scope.getByRole('region', { name: 'Sprint prompt' });

export const weekGrid = (scope: Page | Locator) => scope.getByRole('group', { name: 'Week', exact: true });

export const sprintCard = (scope: Page | Locator, title: string) => scope.getByRole('group', { name: title });

export const plannedLabel = (scope: Page | Locator) => scope.getByRole('time');
