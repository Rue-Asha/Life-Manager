// After Design-System primitives/scroll-cue/cue.ts. `hideOnType` here also fires on a fine pointer: the pill bar hides
// while any text field has focus (navigation spec), and the dock is only shown below 768 px anyway.
export function scrolled(bar: HTMLElement) {
	const frame = bar.parentElement as HTMLElement;
	const sentinel = document.createElement('div');
	sentinel.setAttribute('aria-hidden', 'true');
	sentinel.style.cssText = 'position:absolute;inset-block-start:0;inset-inline-start:0;inline-size:1px;pointer-events:none;block-size:var(--bar-h)';
	frame.append(sentinel);
	const watch = new IntersectionObserver(([e]) => bar.toggleAttribute('data-scrolled', !e.isIntersecting));
	watch.observe(sentinel);
	return {
		destroy() {
			watch.disconnect();
			sentinel.remove();
		}
	};
}

const NOT_TEXT = new Set(['button', 'checkbox', 'color', 'file', 'image', 'radio', 'range', 'reset', 'submit']);
const typing = (el: EventTarget | null) =>
	el instanceof HTMLElement &&
	(el.isContentEditable || el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !NOT_TEXT.has(el.type)));

export function hideOnType(dock: HTMLElement, forced = false) {
	let force = forced;
	const set = (on: boolean) => {
		dock.toggleAttribute('data-hidden', on || force);
		dock.inert = on || force;
	};
	const focusin = (e: FocusEvent) => set(typing(e.target));
	const focusout = (e: FocusEvent) => set(typing(e.relatedTarget));
	document.addEventListener('focusin', focusin);
	document.addEventListener('focusout', focusout);
	set(typing(document.activeElement));
	return {
		update(next: boolean) {
			force = next;
			set(typing(document.activeElement));
		},
		destroy() {
			document.removeEventListener('focusin', focusin);
			document.removeEventListener('focusout', focusout);
			dock.removeAttribute('data-hidden');
			dock.inert = false;
		}
	};
}

export function vfade(node: HTMLElement) {
	const update = () => {
		node.toggleAttribute('data-fade-top', node.scrollTop > 1);
		node.toggleAttribute('data-fade-bottom', node.scrollTop + node.clientHeight < node.scrollHeight - 1);
	};
	const watch = new ResizeObserver(update);
	const mutate = new MutationObserver(update);
	watch.observe(node);
	mutate.observe(node, { childList: true, subtree: true });
	node.addEventListener('scroll', update, { passive: true });
	update();
	return {
		destroy() {
			watch.disconnect();
			mutate.disconnect();
			node.removeEventListener('scroll', update);
		}
	};
}
