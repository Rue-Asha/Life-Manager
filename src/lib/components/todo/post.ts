import { deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import type { ActionError } from './form';

// A todo action posted from a menu choice, where no form is on screen. Failures come back to the caller; a success reloads the page data.
export async function postTodo(action: string, fields: Record<string, string>): Promise<ActionError | null> {
	const body = new FormData();
	for (const [key, value] of Object.entries(fields)) body.set(key, value);
	const response = await fetch(`/todos?/${action}`, { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
	const result = deserialize(await response.text());
	if (result.type === 'failure') return result.data as unknown as ActionError;
	await invalidateAll();
	return null;
}
