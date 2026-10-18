import { expect, test, reset, seed, setClock } from './helpers';

// Wednesday 7 October 2026, midday in Berlin.
const NOW = '2026-10-07T10:00:00Z';

test.beforeEach(async ({ request }) => {
	await reset(request);
	await setClock(request, NOW);
});

test.afterAll(async ({ request }) => {
	await setClock(request, null);
});

test('Scenario: Archived class todo cannot be planned', async ({ page, request, baseURL }) => {
	const { todos, aspects } = await seed(request, {
		aspects: [{ name: 'Health' }, { name: 'Uni', color: 'lavender', icon: 'book' }],
		uniAspect: 1,
		semesters: [{ name: 'SS 26', archivedAt: '2026-09-30T10:00:00Z' }],
		classes: [{ semester: 0, name: 'Physics' }],
		todos: [{ title: 'Old lab report', aspect: 1, class: 0, day: '2026-10-20', startTime: '18:00' }]
	});
	const post = async (action: string, form: Record<string, string>) => {
		const response = await request.post(`/todos?/${action}`, {
			headers: { origin: baseURL!, 'x-sveltekit-action': 'true' },
			form
		});
		return response.json();
	};

	const setDay = await post('setDay', { id: String(todos[0]), day: '2026-10-27', startTime: '09:00', endTime: '10:00' });
	expect(setDay.type).toBe('failure');
	expect(setDay.status).toBe(409);
	expect(setDay.data).toContain('archived');

	const update = await post('update', {
		id: String(todos[0]),
		aspectId: String(aspects[1]),
		day: '2026-10-27',
		startTime: '09:00',
		endTime: '10:00'
	});
	expect(update.type).toBe('failure');
	expect(update.status).toBe(409);
	expect(update.data).toContain('archived');

	await page.goto('/backlog');
	await expect(page.getByTestId('todo-row').filter({ hasText: 'Old lab report' })).toHaveAttribute('data-day', '2026-10-20');
});
