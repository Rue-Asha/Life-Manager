import type { SubmitFunction } from '$app/forms';

export interface ActionError {
	error: string;
	field?: string;
}

// Todo actions live on /todos. SvelteKit 3's default `update` would navigate there (and get
// redirected to /backlog), so results stay on the posting page: failures come back to the caller,
// successes only refresh data. Forms keep their own state, so no reset.
export function submit(handlers: { onerror?: (e: ActionError) => void; onsuccess?: () => void } = {}): SubmitFunction {
	return () =>
		async ({ result, update }) => {
			if (result.type === 'failure') {
				handlers.onerror?.(result.data as unknown as ActionError);
				return;
			}
			await update({ reset: false, navigate: false });
			if (result.type === 'success') handlers.onsuccess?.();
		};
}
