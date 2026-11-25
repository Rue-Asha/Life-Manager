export interface QuickAddContext {
	aspectId?: number;
	destination?: 'sprint';
}

// A stack, so the arriving page's context wins while the leaving page's effect still runs.
let contexts = $state.raw<{ ctx: QuickAddContext }[]>([]);
let open = $state(false);
let trigger: HTMLElement | null = null;

export function setQuickAddContext(ctx: QuickAddContext): () => void {
	const entry = { ctx };
	contexts = [...contexts, entry];
	return () => {
		contexts = contexts.filter((e) => e !== entry);
	};
}

export function quickAddContext(): QuickAddContext {
	return contexts.at(-1)?.ctx ?? {};
}

export function isQuickAddOpen(): boolean {
	return open;
}

export function openQuickAdd(from: HTMLElement): void {
	trigger = from;
	open = true;
}

export function closeQuickAdd(): void {
	const from = trigger;
	open = false;
	trigger = null;
	if (from?.isConnected) from.focus();
}
