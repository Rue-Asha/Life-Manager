<!--
	Menu: copy-in reference primitive from Design-System (sync.sh <app> --primitive menu).
	The app owns this copy; restyle it with fingerprint tokens only.
	Props: name (accessible name), items, radio (choose one: menuitemradio with a check, else
	menuitem), icon (snippet taking the item, drawn before the label of a plain or danger item;
	primitives import no icon set), onselect (called with the item).
	Item: { label, checked?, danger?, disabled?, separator? (a rule above it), radio? (overrides
	the menu's radio for this item), group? (a small heading above it), value? (the app's own key for the item), hint? (a secondary
	word), kbd? (a shortcut, hidden on phones and touch) }.
	The panel is a white surface with --elevation-menu. Placing it is the app's job: put it in a
	popover or an anchored wrapper and move focus to it on open (the first checked item, or the
	first one). Up/Down/Home/End move between items; Escape and outside clicks belong to the host.
	A checked item is the charcoal pill with a check. Targets are >= 24px, 44px on touch.
-->
<script module lang="ts">
	export type MenuItem = {
		label: string;
		checked?: boolean;
		danger?: boolean;
		disabled?: boolean;
		separator?: boolean;
		radio?: boolean;
		group?: string;
		value?: string;
		hint?: string;
		kbd?: string;
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		name,
		items,
		radio = false,
		icon,
		onselect
	}: { name: string; items: MenuItem[]; radio?: boolean; icon?: Snippet<[MenuItem]>; onselect?: (item: MenuItem) => void } = $props();

	let menu: HTMLElement | undefined = $state();

	function onkeydown(e: KeyboardEvent) {
		const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
		if (!keys.includes(e.key) || !menu) return;
		const live = [...menu.querySelectorAll<HTMLButtonElement>('.item:not(:disabled)')];
		if (!live.length) return;
		e.preventDefault();
		const at = live.indexOf(document.activeElement as HTMLButtonElement);
		const next = e.key === 'Home' ? 0 : e.key === 'End' ? live.length - 1 : (at + (e.key === 'ArrowDown' ? 1 : -1) + live.length) % live.length;
		live[next].focus();
	}
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div class="menu-list" role="menu" aria-label={name} bind:this={menu} {onkeydown}>
	{#each items as item, i (i)}
		{@const isRadio = item.radio ?? radio}
		{#if item.separator}<hr />{/if}
		{#if item.group}<p class="group">{item.group}</p>{/if}
		<button
			type="button"
			class="item"
			class:danger={item.danger}
			role={isRadio ? 'menuitemradio' : 'menuitem'}
			aria-checked={isRadio ? !!item.checked : undefined}
			disabled={item.disabled}
			onclick={() => onselect?.(item)}
		>
			{#if isRadio}
				<span class="lead">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
				</span>
			{:else if icon}
				<span class="lead" aria-hidden="true">{@render icon(item)}</span>
			{/if}
			<span class="text">{item.label}</span>
			{#if item.hint}<span class="hint">{item.hint}</span>{/if}
			{#if item.kbd}<kbd>{item.kbd}</kbd>{/if}
		</button>
	{/each}
</div>

<style>
	.menu-list {
		display: grid;
		gap: var(--space-0-5);
		inline-size: min(100%, 19rem);
		min-inline-size: 0;
		padding: var(--space-1-5);
		border-radius: var(--radius-panel);
		background: var(--surface-raised);
		box-shadow: var(--elevation-menu);
		color: var(--ink);
	}
	.group {
		margin: var(--space-1) var(--space-3);
		font-size: var(--type-overline-size);
		letter-spacing: var(--type-kicker-tracking);
		text-transform: uppercase;
		color: var(--ink-secondary);
	}
	hr {
		block-size: var(--stroke-hairline);
		margin: var(--space-1) var(--space-2);
		border: 0;
		background: var(--hairline);
	}
	.item {
		display: flex;
		align-items: center;
		gap: var(--space-2-5);
		min-block-size: max(var(--control-height-s), var(--target));
		padding: var(--space-1) var(--space-3-5) var(--space-1) var(--space-3);
		border: 0;
		border-radius: var(--radius-item);
		background: none;
		color: var(--ink);
		font-family: var(--font-ui);
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
		text-align: start;
	}
	.lead {
		display: inline-flex;
		flex: none;
	}
	.item[aria-checked='true'] {
		background: var(--surface-inverse);
		color: var(--ink-on-inverse);
	}
	.item[role='menuitemradio']:not([aria-checked='true']) .lead {
		visibility: hidden;
	}
	.item.danger {
		color: var(--danger);
	}
	.item:disabled {
		opacity: var(--disabled-opacity);
	}
	.text {
		flex: 1;
		min-inline-size: 0;
		overflow-wrap: anywhere;
	}
	.hint {
		flex: none;
		color: var(--ink-secondary);
		font-size: var(--type-caption-size);
	}
	.item[aria-checked='true'] .hint {
		color: var(--ink-on-inverse-secondary);
	}
	kbd {
		flex: none;
		padding: var(--space-0-5) var(--space-2);
		border-radius: var(--radius-pill);
		box-shadow: var(--ring-hairline);
		color: var(--ink-secondary);
		font-family: var(--font-ui);
		font-size: var(--type-caption-size);
		white-space: nowrap;
	}
	.item[aria-checked='true'] kbd {
		color: var(--ink-on-inverse-secondary);
		box-shadow: var(--ring-control-on-inverse);
	}
	@media (max-width: 767px), (pointer: coarse) {
		kbd {
			display: none;
		}
	}
	/* The ink ring would vanish on the charcoal pill: white ring with an ink halo, as base.css's data-focus="halo". */
	.item[aria-checked='true']:focus-visible {
		outline-color: var(--focus-ring-on-inverse);
		box-shadow: var(--focus-halo);
	}
	@media (hover: hover) {
		.item:not([aria-checked='true']):not(:disabled):hover {
			background: var(--surface-sunken);
		}
	}
</style>
