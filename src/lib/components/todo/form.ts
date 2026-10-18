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

// Messages for the planned day and slot, shared by the create and edit forms.
export function planError({ error }: ActionError): string | undefined {
	if (error === 'day-in-past') return 'That day has already passed. Pick today or a later day.';
	if (error === 'review-required') return 'The sprint needs its review before a day can be changed.';
	if (error === 'recurring-outside-week') return 'A recurring todo stays in its sprint’s week. Pick a day of that week.';
	if (error === 'end-before-start') return 'The end time has to be after the start time.';
	if (error === 'end-without-start') return 'Set a start time before the end time.';
	if (error === 'invalid') return 'Use a time like 18:00.';
}
