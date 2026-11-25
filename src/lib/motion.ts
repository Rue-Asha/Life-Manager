import { quintOut } from 'svelte/easing';
import { crossfade } from 'svelte/transition';

export const MOVE_MS = 260;
export const NAV_MS = 160;
export const RAIL_IN_MS = 220;
export const RAIL_OUT_MS = 160;

export function reducedMotion(): boolean {
	return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const ms = (n: number) => (reducedMotion() ? 0 : n);

// Keyed by todo id: an item leaving one list lands in the other instead of vanishing.
export const [send, receive] = crossfade({
	duration: () => ms(MOVE_MS),
	easing: quintOut
});

export function flipOpts(): { duration: number } {
	return { duration: ms(MOVE_MS) };
}

// A created row settles in (a short rise and a fade); a removed one fades, quicker than it came. Reduced motion keeps the fades only.
export function settle(_node: Element) {
	const still = reducedMotion();
	return { duration: MOVE_MS, easing: quintOut, css: (t: number) => (still ? `opacity: ${t}` : `opacity: ${t}; transform: translateY(${(1 - t) * 6}px)`) };
}

export function fadeOut(_node: Element) {
	return { duration: 140, css: (t: number) => `opacity: ${t}` };
}

// A hidden column (the phone's other days) has no box to travel from or to, and crossfade
// would scale by width / 0; such a card just appears.
const rendered = (node: Element) => node.getClientRects().length > 0;

// While it fades out, the old card is only a picture of the move: the todo already lives in its
// new place, so the copy leaves the accessibility tree and stops being a row. A refused move
// brings the same element back, so this is undone when it arrives again.
function ghost(node: Element, leaving: boolean) {
	if (leaving) node.setAttribute('aria-hidden', 'true');
	else node.removeAttribute('aria-hidden');
}

export const arrive: typeof receive = (node, params) => {
	ghost(node, false);
	return rendered(node) ? receive(node, params) : () => ({});
};

export const leave: typeof send = (node, params) => {
	ghost(node, true);
	return rendered(node) ? send(node, params) : () => ({});
};

// A view (or the same view in a new layout) crossfades: the new one fades in just after the old one starts to leave. The outgoing
// copy is a picture, so it leaves the accessibility tree and stops taking focus and clicks.
export function viewIn(_node: HTMLElement) {
	return { duration: ms(NAV_MS), delay: ms(60), css: (t: number) => `opacity: ${t}` };
}

export function viewOut(node: HTMLElement) {
	node.setAttribute('aria-hidden', 'true');
	node.inert = true;
	return { duration: ms(120), css: (t: number) => `opacity: ${t}` };
}

// The Week view's backlog rail (gate 5, Q5): it slides in from the right edge and fades; out is quicker than in. Reduced motion fades only.
export function railSlide(_node: HTMLElement, { out = false }: { out?: boolean } = {}) {
	return {
		duration: out ? RAIL_OUT_MS : RAIL_IN_MS,
		easing: quintOut,
		css: (t: number) => (reducedMotion() ? `opacity: ${t}` : `opacity: ${t}; transform: translateX(${(1 - t) * 24}px)`)
	};
}
