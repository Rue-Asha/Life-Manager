import type { Locator, Page } from '@playwright/test';

// The active semesters of the Uni overview; archived ones live in the archived group.
export const activeSemesters = (page: Page) => page.getByRole('group', { name: 'Active semesters' });

export const semesterSections = (scope: Page | Locator) => scope.getByRole('region', { name: /^Semester / });

export const semesterSection = (scope: Page | Locator, name: string) => scope.getByRole('region', { name: `Semester ${name}`, exact: true });

export const archivedGroup = (scope: Page | Locator) => scope.getByRole('region', { name: /^Archived \(/ });

export const classGrid = (scope: Page | Locator) => scope.getByRole('list', { name: 'Classes', exact: true });

export const classCards = (scope: Page | Locator) => classGrid(scope).getByRole('link');

export const sprintTodos = (scope: Page | Locator) => scope.getByRole('region', { name: /^This week/ });

export const uniPrompt = (page: Page) =>
	page.getByRole('region', { name: /^(Which aspect holds your uni todos\?|Change the Uni aspect)$/ });

// The sentence naming the Uni aspect; its <strong> carries the aspect name.
export const uniAspectLine = (scope: Page | Locator) => scope.getByText(/^Todos of the aspect/);

export const uniAspect = (scope: Page | Locator) => uniAspectLine(scope).getByRole('strong');

export const uniRail = (page: Page) => page.getByRole('complementary', { name: 'Uni', exact: true, includeHidden: true });

export const uniRailToggle = (page: Page) => page.getByRole('button', { name: 'Uni', exact: true, includeHidden: true });

export const notesRegion = (scope: Page | Locator) => scope.getByRole('region', { name: 'Notes', exact: true });

export const emptyState = (scope: Page | Locator) => scope.getByText('Start with the semester you are in now.');
