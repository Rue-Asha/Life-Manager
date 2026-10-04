<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { MediaQuery } from 'svelte/reactivity';
	import { PROJECT_STATUSES, STATUS_LABELS } from '$lib/projects';
	import type { ProjectStatus } from '$lib/types';
	import ConfirmDialog from '../ui/ConfirmDialog.svelte';
	import Sheet from '../ui/Sheet.svelte';
	import { UI_ICONS } from '../ui/icons';
	import { GLYPHS } from './glyphs';

	let { status, openCount }: { status: ProjectStatus; openCount: number } = $props();

	const desktop = new MediaQuery('min-width: 768px', true);
	let menuOpen = $state(false);
	let confirming = $state(false);
	let target = $state<ProjectStatus>();
	let form = $state<HTMLFormElement>();
	let wrap = $state<HTMLElement>();
	const uid = $props.id();

	async function toggle() {
		menuOpen = !menuOpen;
		await tick();
		if (menuOpen) wrap?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
	}

	function closeMenu(e: PointerEvent | KeyboardEvent) {
		if (!menuOpen || !desktop.current) return;
		if (e instanceof KeyboardEvent ? e.key === 'Escape' : !wrap?.contains(e.target as Node)) menuOpen = false;
	}

	async function save(next: ProjectStatus) {
		target = next;
		confirming = false;
		await tick();
		form?.requestSubmit();
	}

	function pick(next: ProjectStatus) {
		menuOpen = false;
		if (next === status) return;
		// The warning is a UI step only: the todos stay either way.
		if (next === 'implemented' && openCount > 0) {
			target = next;
			confirming = true;
		} else save(next);
	}
</script>

{#snippet glyph(s: ProjectStatus)}
	<svg class="s" class:accent={s === 'active'} viewBox="0 0 16 16" aria-hidden="true">
		{#if s === 'backlog'}
			<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.75" stroke-dasharray="2.6 2.6" />
		{:else if s === 'active'}
			<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.75" />
			<path d="M8 4a4 4 0 0 1 0 8Z" fill="currentColor" />
		{:else if s === 'paused'}
			<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.75" />
			<path d="M6.4 5.6v4.8 M9.6 5.6v4.8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
		{:else}
			<circle cx="8" cy="8" r="7" fill="currentColor" />
			<path d="m5 8.2 2 2 4-4.2" fill="none" stroke="var(--paper)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
		{/if}
	</svg>
{/snippet}

{#snippet items()}
	<ul class="menu" role="menu" aria-label="Set status">
		{#each PROJECT_STATUSES as s (s)}
			<li role="none">
				<button type="button" role="menuitem" onclick={() => pick(s)}>
					{@render glyph(s)}{STATUS_LABELS[s]}
					{#if s === status}
						<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.check} /></svg>
					{/if}
				</button>
			</li>
		{/each}
	</ul>
{/snippet}

<svelte:window onpointerdown={closeMenu} onkeydown={closeMenu} />

<form
	method="POST"
	action="?/status"
	hidden
	bind:this={form}
	use:enhance={() =>
		async ({ update }) => {
			await update({ reset: false });
		}}
>
	<input type="hidden" name="status" value={target} />
</form>

<div class="wrap" bind:this={wrap}>
	<button
		type="button"
		class="pill"
		data-testid="status-pill"
		aria-haspopup="menu"
		aria-expanded={menuOpen}
		aria-controls="{uid}-menu"
		onclick={toggle}
	>
		{@render glyph(status)}{STATUS_LABELS[status]}
		<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS['chevron-down']} /></svg>
	</button>
	{#if menuOpen && desktop.current}
		<div id="{uid}-menu" class="pop">{@render items()}</div>
	{/if}
</div>

<Sheet open={menuOpen && !desktop.current} title="Set status" onclose={() => (menuOpen = false)}>
	{@render items()}
</Sheet>

<ConfirmDialog
	open={confirming}
	title="Mark as implemented?"
	message="{openCount} linked {openCount === 1 ? 'todo is' : 'todos are'} still open. They stay as they are."
	confirmLabel="Mark as implemented"
	onconfirm={() => save('implemented')}
	oncancel={() => (confirming = false)}
/>

<style>
	.wrap {
		position: relative;
		display: inline-block;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		height: 30px;
		padding: 0 var(--space-2) 0 var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-pill);
		background: var(--paper);
		color: var(--ink);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
	}

	.s {
		width: var(--icon-sm);
		height: var(--icon-sm);
		flex: none;
		color: var(--ink-3);
	}

	.s.accent {
		color: var(--accent);
	}

	.chev,
	.tick {
		width: var(--icon-sm);
		height: var(--icon-sm);
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.chev {
		color: var(--ink-3);
	}

	.pop {
		position: absolute;
		z-index: 2;
		top: calc(100% + var(--space-1));
		left: 0;
		min-width: 200px;
		padding: var(--space-1);
		border-radius: var(--radius-md);
		background: var(--paper);
		box-shadow: var(--shadow-pop);
	}

	.menu {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.menu button {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		height: var(--control-height);
		padding: 0 var(--space-3);
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		text-align: left;
		cursor: pointer;
	}

	.menu button:hover {
		background: var(--paper-hover);
	}

	.tick {
		margin-left: auto;
		color: var(--accent);
	}
</style>
