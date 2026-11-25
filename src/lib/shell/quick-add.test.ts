import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeQuickAdd, isQuickAddOpen, openQuickAdd, quickAddContext, setQuickAddContext } from './quick-add.svelte';

const trigger = () => ({ isConnected: true, focus: vi.fn() }) as unknown as HTMLElement & { focus: ReturnType<typeof vi.fn> };

afterEach(() => closeQuickAdd());

describe('quick add', () => {
	it('has no context until a page sets one', () => {
		expect(quickAddContext()).toEqual({});
	});

	it('takes the context a page sets and drops it when the page unregisters', () => {
		const unregister = setQuickAddContext({ aspectId: 4 });
		expect(quickAddContext()).toEqual({ aspectId: 4 });
		unregister();
		expect(quickAddContext()).toEqual({});
	});

	it('uses the latest context while two pages overlap during navigation', () => {
		const leaving = setQuickAddContext({ destination: 'sprint' });
		const arriving = setQuickAddContext({ aspectId: 2 });
		expect(quickAddContext()).toEqual({ aspectId: 2 });
		leaving();
		expect(quickAddContext()).toEqual({ aspectId: 2 });
		arriving();
		expect(quickAddContext()).toEqual({});
	});

	it('ignores a second unregister', () => {
		const first = setQuickAddContext({ aspectId: 1 });
		const second = setQuickAddContext({ aspectId: 2 });
		second();
		second();
		expect(quickAddContext()).toEqual({ aspectId: 1 });
		first();
	});

	it('opens from a trigger and returns focus to it on close', () => {
		const button = trigger();
		expect(isQuickAddOpen()).toBe(false);
		openQuickAdd(button);
		expect(isQuickAddOpen()).toBe(true);
		expect(button.focus).not.toHaveBeenCalled();
		closeQuickAdd();
		expect(isQuickAddOpen()).toBe(false);
		expect(button.focus).toHaveBeenCalledTimes(1);
		closeQuickAdd();
		expect(button.focus).toHaveBeenCalledTimes(1);
	});

	it('does not focus a trigger that left the page', () => {
		const button = trigger();
		openQuickAdd(button);
		Object.assign(button, { isConnected: false });
		closeQuickAdd();
		expect(button.focus).not.toHaveBeenCalled();
	});
});
