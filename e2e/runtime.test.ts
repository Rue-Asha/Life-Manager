import { expect, test } from '@playwright/test';
import { reset, seed, setClock } from './helpers';

test('Scenario: Health check returns 200', async ({ request }) => {
	const response = await request.get('/healthz');
	expect(response.status()).toBe(200);
});

test('test hooks reset, seed and set the clock', async ({ request }) => {
	await reset(request);
	const ids = await seed(request, {
		aspects: [{ name: 'Health' }, { name: 'Uni', color: 'sky', icon: 'cap' }],
		sprint: { state: 'active', weekStart: '2026-09-28' },
		rules: [{ title: 'Gym', aspect: 0, weekdays: [1, 3] }],
		todos: [
			{ title: 'Read', aspect: 1, inSprint: true, day: '2026-09-29', checklist: ['ch. 1'] },
			{ title: 'Gym', rule: 0, inSprint: true, status: 'done' }
		]
	});
	expect(ids.aspects).toHaveLength(2);
	expect(ids.sprint).not.toBeNull();
	expect(ids.rules).toHaveLength(1);
	expect(ids.todos).toHaveLength(2);
	await setClock(request, '2026-10-01T10:00:00Z');
	await setClock(request, null);
	await reset(request);
	expect((await seed(request, {})).aspects).toEqual([]);
});
