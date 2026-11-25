<!--
	PopMenu: the app's placement for the menu primitive. A native popover placed at its trigger (light dismiss, Escape and focus
	return come from the browser), flipping when there is no room; 160 ms in, 120 ms out, scaling from 0.97 at the trigger's corner.
	Props: name (the menu's accessible name), items, radio and icon (as Menu), onselect (called with the item after the menu closed),
	trigger (a snippet taking the attributes to spread on the one button that opens it), wide (the signed ~320 px row menu of the aspects list).
	Opening moves focus to the checked item, else the first.
-->
<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import Menu, { type MenuItem } from './Menu.svelte';

	let {
		name,
		items,
		radio = false,
		icon,
		onselect,
		trigger,
		wide = false
	}: {
		name: string;
		items: MenuItem[];
		radio?: boolean;
		icon?: Snippet<[MenuItem]>;
		onselect?: (item: MenuItem) => void;
		trigger: Snippet<[Record<string, string | boolean>]>;
		wide?: boolean;
	} = $props();

	const uid = $props.id();
	let pop: HTMLElement | undefined = $state();
	let open = $state(false);
	// The items exist only while the panel is open (and fading out), so a closed row carries no menu text and no extra nodes.
	let mounted = $state(false);
	let unmount: ReturnType<typeof setTimeout> | undefined;

	// Placed from the button's rectangle: below it unless there is little room and more above, from its left edge unless that would run off the
	// right edge, and never taller than the room it has (the panel scrolls). Plain fixed coordinates: they hold wherever the button sits.
	let place_ = $state({ top: 'auto', bottom: 'auto', left: 'auto', right: 'auto', room: 640, side: 'bottom' as 'top' | 'bottom', origin: 'top left' });
	function place() {
		clearTimeout(unmount);
		mounted = true;
		const trigger = document.querySelector(`[popovertarget="${uid}-menu"]`);
		if (!trigger) return;
		const r = trigger.getBoundingClientRect();
		const below = innerHeight - r.bottom;
		const side = below < 320 && r.top > below ? 'top' : 'bottom';
		const gap = 6;
		const end = r.left + 320 > innerWidth - 16;
		place_ = {
			side,
			top: side === 'bottom' ? `${r.bottom + gap}px` : 'auto',
			bottom: side === 'top' ? `${innerHeight - r.top + gap}px` : 'auto',
			left: end ? 'auto' : `${r.left}px`,
			right: end ? `${innerWidth - r.right}px` : 'auto',
			origin: `${side === 'top' ? 'bottom' : 'top'} ${end ? 'right' : 'left'}`,
			room: Math.min(640, Math.max(160, (side === 'top' ? r.top : below) - gap - 16))
		};
	}

	async function toggled(e: Event) {
		open = (e as ToggleEvent).newState === 'open';
		if (!open) {
			unmount = setTimeout(() => (mounted = false), 200);
			return;
		}
		await tick();
		const live = [...(pop?.querySelectorAll<HTMLElement>('.item:not(:disabled)') ?? [])];
		(live.find((i) => i.getAttribute('aria-checked') === 'true') ?? live[0])?.focus();
	}

	function select(item: MenuItem) {
		pop?.hidePopover();
		onselect?.(item);
	}
</script>

{@render trigger({
	popovertarget: `${uid}-menu`,
	'aria-haspopup': 'menu',
	'aria-expanded': open
})}
<div bind:this={pop} id="{uid}-menu" class="pop" data-side={place_.side} data-wide={wide ? '' : undefined} style:top={place_.top} style:bottom={place_.bottom} style:left={place_.left} style:right={place_.right} style:transform-origin={place_.origin} style:max-block-size="{place_.room}px" popover="auto" onbeforetoggle={(e) => (e as ToggleEvent).newState === 'open' && place()} ontoggle={toggled}>
	{#if mounted}<Menu {name} {items} {radio} {icon} onselect={select} />{/if}
</div>

<style>
	.pop {
		position: fixed;
		margin: 0;
		min-inline-size: 220px;
		max-inline-size: min(320px, 100vw - 2 * var(--space-4));
		max-block-size: 40rem;
		padding: var(--space-1-5);
		border: 0;
		border-radius: var(--radius-panel);
		background: var(--surface-raised);
		box-shadow: var(--elevation-menu);
		color: var(--ink);
		overflow-y: auto;
		overscroll-behavior: contain;
		transition:
			opacity calc(var(--motion-quick) * 0.75) var(--ease-out),
			scale calc(var(--motion-quick) * 0.75) var(--ease-out),
			overlay calc(var(--motion-quick) * 0.75) allow-discrete,
			display calc(var(--motion-quick) * 0.75) allow-discrete;
	}
	.pop[data-wide] {
		min-inline-size: min(calc(var(--space-16) * 5), 100vw - 2 * var(--space-4));
	}
	.pop:not(:popover-open) {
		display: none;
		opacity: 0;
		scale: var(--press-scale);
	}
	.pop:popover-open {
		opacity: 1;
		scale: 1;
		transition-duration: var(--motion-quick);
	}
	@starting-style {
		.pop:popover-open {
			opacity: 0;
			scale: var(--press-scale);
		}
	}
	.pop :global(.menu-list) {
		inline-size: auto;
		padding: 0;
		background: none;
		box-shadow: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.pop:not(:popover-open) {
			scale: 1;
		}
		@starting-style {
			.pop:popover-open {
				scale: 1;
			}
		}
	}
</style>
