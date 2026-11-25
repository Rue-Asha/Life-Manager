import type { Page } from '@playwright/test';
import { expect, test, reset, seed } from './helpers';

const main = (page: Page) => page.getByRole('navigation', { name: 'Main' });
const hub = (page: Page) => page.getByRole('main');

async function openMore(page: Page) {
	await main(page).getByRole('button', { name: /^More\b/ }).click();
	return page.getByRole('menu', { name: 'More' });
}

const PROJECTS = {
	aspects: [{ name: 'IT' }],
	itAspect: 0,
	projects: [
		{ name: 'A', status: 'active' },
		{ name: 'B', status: 'active' },
		{ name: 'C', status: 'backlog' },
		{ name: 'D', status: 'implemented' }
	]
} as const;

const UNI = {
	aspects: [{ name: 'Studies' }],
	uniAspect: 0,
	semesters: [{ name: 'WS 26/27' }, { name: 'SS 26', archivedAt: '2026-09-01T10:00:00.000Z' }],
	classes: [
		{ semester: 0, name: 'Analysis I' },
		{ semester: 0, name: 'Algorithms' },
		{ semester: 1, name: 'Old class' }
	]
} as const;

test.beforeEach(async ({ request }) => {
	await reset(request);
});

test('Scenario: Projects entry counts active projects', async ({ page, request }) => {
	await seed(request, { ...PROJECTS, projects: [...PROJECTS.projects] });

	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	await expect((await openMore(page)).getByRole('menuitem', { name: /^Projects/ })).toHaveText('Projects 2');

	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/menu');
	await expect(hub(page).getByRole('link', { name: /^Projects/ })).toHaveText(/^\s*Projects\s+IT projects\s+2\s*$/);
});

test('Scenario: Zero active projects shows no count', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'IT' }], itAspect: 0, projects: [{ name: 'Idea', status: 'backlog' }] });

	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	await expect((await openMore(page)).getByRole('menuitem', { name: /^Projects/ })).toHaveText('Projects');

	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/menu');
	await expect(hub(page).getByRole('link', { name: /^Projects/ })).not.toContainText(/\d/);
});

test('Scenario: Uni entry counts open class todos in active semesters', async ({ page, request }) => {
	await seed(request, {
		...UNI,
		semesters: [...UNI.semesters],
		classes: [...UNI.classes],
		todos: [
			{ title: 'Sheet 1', aspect: 0, class: 0, type: 'EXC' },
			{ title: 'Sheet 2', aspect: 0, class: 1, type: 'EXC' },
			{ title: 'Sheet 0', aspect: 0, class: 0, type: 'EXC', status: 'done', completedAt: '2026-10-01T10:00:00.000Z' },
			{ title: 'Archived sheet', aspect: 0, class: 2, type: 'EXC' },
			{ title: 'Enrol', aspect: 0 }
		]
	});

	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	await expect((await openMore(page)).getByRole('menuitem', { name: /^Uni/ })).toHaveText('Uni 2');

	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/menu');
	await expect(hub(page).getByRole('link', { name: /^Uni/ })).toHaveText(/^\s*Uni\s+Semesters and classes\s+2\s*$/);
});

test('Scenario: Zero open class todos shows no count', async ({ page, request }) => {
	await seed(request, { aspects: [{ name: 'Studies' }], uniAspect: 0, semesters: [{ name: 'WS 26/27' }], classes: [{ semester: 0, name: 'Analysis I' }] });

	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	await expect((await openMore(page)).getByRole('menuitem', { name: /^Uni/ })).toHaveText('Uni');

	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/menu');
	await expect(hub(page).getByRole('link', { name: /^Uni/ })).not.toContainText(/\d/);
});
