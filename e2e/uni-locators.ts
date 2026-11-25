import type { Locator, Page } from '@playwright/test';

// The active semesters of the Uni overview; archived ones live in the archived group.
export const activeSemesters = (page: Page) => page.getByRole('group', { name: 'Active semesters' });

export const semesterSections = (scope: Page | Locator) => scope.getByRole('region', { name: /^Semester / });

export const semesterSection = (scope: Page | Locator, name: string) => scope.getByRole('region', { name: `Semester ${name}`, exact: true });

export const archivedGroup = (scope: Page | Locator) => scope.getByRole('region', { name: /^Archived \(/ });

export const classGrid = (scope: Page | Locator) => scope.getByRole('list', { name: 'Classes', exact: true });

export const classCards = (scope: Page | Locator) => classGrid(scope).getByRole('link');

export const sprintTodos = (scope: Page | Locator) => scope.getByRole('region', { name: /^This week/ });

// The one-time prompt is a region; "Change" opens the same list on a dialog.
export const uniPrompt = (page: Page) =>
	page
		.getByRole('region', { name: 'Which aspect holds your uni todos?' })
		.or(page.getByRole('dialog', { name: 'Change the Uni aspect' }));

// The sentence naming the Uni aspect; its <strong> carries the aspect name.
export const uniAspectLine = (scope: Page | Locator) => scope.getByText(/^Todos of the aspect/);

export const uniAspect = (scope: Page | Locator) => uniAspectLine(scope).getByRole('strong');

// The "Notes and Uni aspect" panel: a right column from 1280, a card below the main column under it.
export const uniPanel = (page: Page) => page.getByRole('complementary', { name: 'Notes and Uni aspect', exact: true });

export const notesRegion = (scope: Page | Locator) => scope.getByRole('region', { name: 'Notes', exact: true });

export const emptyState = (scope: Page | Locator) => scope.getByRole('heading', { name: 'Start with the semester you are in now' });

// The sheet the "New semester" and "New class" buttons open.
export const sheet = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });
