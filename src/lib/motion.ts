import { cubicOut } from 'svelte/easing';
import { crossfade } from 'svelte/transition';

export const MOVE_MS = 200;
export const NAV_MS = 160;
export const RAIL_MS = 320;

export function reducedMotion(): boolean {
	return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Keyed by todo id: an item leaving one list lands in the other instead of vanishing.
export const [send, receive] = crossfade({
	duration: () => (reducedMotion() ? 0 : MOVE_MS),
	easing: cubicOut
});

export function flipOpts(): { duration: number } {
	return { duration: reducedMotion() ? 0 : MOVE_MS };
}
