import { invalidateAll } from '$app/navigation';

// SvelteKit folds an invalidation requested while another is still loading into that one, and the one in flight may have started
// before this move reached the server. Reloads after moves therefore queue, so each one starts after the move it follows.
let queue: Promise<unknown> = Promise.resolve();
export function reloadAfterMove(): Promise<void> {
	const next = queue.then(() => invalidateAll());
	queue = next.catch(() => {});
	return next;
}
