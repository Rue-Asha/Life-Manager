import type { ActionReturn } from 'svelte/action';
import { MediaQuery } from 'svelte/reactivity';
import type { Id } from '$lib/types';

export const TODO_MIME = 'application/x-lm-todo';

export type DragFrom = 'backlog' | 'sprint';

export interface DragPayload {
	id: Id;
	from: DragFrom;
	recurring: boolean;
}

// Drag is the desktop shortcut; touch moves todos with buttons and menus.
export const canDrag = new MediaQuery('(hover: hover) and (pointer: fine)');

// dragover can only see MIME types, not data, so zones read the payload from here.
let current: DragPayload | null = null;

export function draggableTodo(node: HTMLElement, payload: DragPayload): ActionReturn<DragPayload> {
	node.draggable = canDrag.current;
	function start(e: DragEvent) {
		if (!canDrag.current || !e.dataTransfer) return e.preventDefault();
		e.dataTransfer.setData(TODO_MIME, JSON.stringify(payload));
		e.dataTransfer.effectAllowed = 'move';
		current = payload;
		node.dataset.dragging = '';
	}
	function end() {
		current = null;
		delete node.dataset.dragging;
	}
	node.addEventListener('dragstart', start);
	node.addEventListener('dragend', end);
	return {
		update: (next) => (payload = next),
		destroy() {
			node.removeEventListener('dragstart', start);
			node.removeEventListener('dragend', end);
		}
	};
}

interface DropZoneOptions {
	accepts: (p: DragPayload) => boolean;
	ondrop: (p: DragPayload) => void;
}

export function dropZone(node: HTMLElement, opts: DropZoneOptions): ActionReturn<DropZoneOptions> {
	const matching = (e: DragEvent) =>
		current !== null && !!e.dataTransfer?.types.includes(TODO_MIME) && opts.accepts(current);
	function over(e: DragEvent) {
		if (!matching(e)) return;
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
		node.dataset.over = '';
	}
	function leave(e: DragEvent) {
		if (!node.contains(e.relatedTarget as Node | null)) delete node.dataset.over;
	}
	function drop(e: DragEvent) {
		delete node.dataset.over;
		if (!matching(e)) return;
		e.preventDefault();
		const payload = JSON.parse(e.dataTransfer!.getData(TODO_MIME)) as DragPayload;
		current = null;
		opts.ondrop(payload);
	}
	node.addEventListener('dragover', over);
	node.addEventListener('dragleave', leave);
	node.addEventListener('drop', drop);
	return {
		update: (next) => (opts = next),
		destroy() {
			node.removeEventListener('dragover', over);
			node.removeEventListener('dragleave', leave);
			node.removeEventListener('drop', drop);
		}
	};
}
