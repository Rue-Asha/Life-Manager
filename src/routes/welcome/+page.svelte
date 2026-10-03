<script lang="ts">
	import { enhance } from '$app/forms';
	import { ASPECT_COLORS, PRESET_ASPECTS } from '$lib/aspect-style';
	import AspectForm from '$lib/components/aspects/AspectForm.svelte';
	import AspectIcon from '$lib/components/ui/AspectIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let selected = $state<string[]>([]);
	let custom = $state(false);
	const count = $derived(selected.length + (custom ? 1 : 0));
</script>

<svelte:head>
	<title>Welcome · Life Manager</title>
</svelte:head>

<header>
	<h1>Set up your aspects</h1>
	<p>Aspects are the parts of your life you plan for. Pick a few to start; you can change them any time.</p>
</header>

<form method="POST" action="?/create" use:enhance>
	<ul>
		{#each PRESET_ASPECTS as preset (preset.name)}
			<li>
				<label class="row" style:--c={ASPECT_COLORS[preset.color].fg}>
					<span class="tile" style:background={ASPECT_COLORS[preset.color].tint}>
						<AspectIcon icon={preset.icon} color={preset.color} />
					</span>
					<span class="name">{preset.name}</span>
					<span class="check" aria-hidden="true">
						<svg viewBox="0 0 24 24"><path d={UI_ICONS.check} /></svg>
					</span>
					<input type="checkbox" name="preset" value={preset.name} bind:group={selected} />
				</label>
			</li>
		{/each}
	</ul>

	{#if custom}
		<section class="custom" aria-label="Your own aspect">
			<AspectForm color="tangerine" error={form?.field === 'name' ? form.error : undefined} />
			<Button type="button" variant="quiet" onclick={() => (custom = false)}>Remove</Button>
		</section>
	{:else}
		<button type="button" class="add" onclick={() => (custom = true)}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>
			Add your own
		</button>
	{/if}

	{#if form?.field === 'preset'}<p class="error">Pick at least one aspect.</p>{/if}

	<footer>
		<Button variant="primary" disabled={count === 0}>
			Continue with {count}
			{count === 1 ? 'aspect' : 'aspects'}
		</Button>
	</footer>
</form>

<style>
	header {
		margin: var(--space-4) 0 var(--space-6);
	}

	h1 {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-title);
	}

	header p {
		max-width: 46ch;
		margin-top: var(--space-2);
		color: var(--ink-3);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li + li {
		border-top: 1px solid var(--line);
	}

	.row {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 56px;
		padding: 0 var(--space-3);
		margin: 0 calc(-1 * var(--space-3));
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.row:hover {
		background: var(--paper-hover);
	}

	.row:has(:focus-visible) {
		box-shadow: var(--ring-focus);
	}

	/* The real checkbox covers the whole row, so a tap anywhere on it toggles. */
	.row input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}

	.tile {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		flex: none;
		border-radius: var(--radius-md);
	}

	.name {
		flex: 1;
		font-size: var(--text-lg);
	}

	.check {
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius-xs);
		color: transparent;
		transition:
			background-color var(--dur-fast) var(--ease-out),
			border-color var(--dur-fast) var(--ease-out);
	}

	.row:has(:checked) .check {
		border-color: var(--c);
		background: var(--c);
		color: var(--ink-on-accent);
	}

	svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: currentColor;
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.add {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: calc(100% + 2 * var(--space-3));
		min-height: 56px;
		margin: var(--space-2) calc(-1 * var(--space-3)) 0;
		padding: 0 var(--space-3);
		border: 0;
		border-top: 1px solid var(--line);
		border-radius: 0;
		background: none;
		color: var(--accent);
		font-size: var(--text-lg);
		text-align: left;
		cursor: pointer;
	}

	.add svg {
		width: var(--icon-md);
		height: var(--icon-md);
		margin: 0 var(--space-2);
		stroke-width: 2;
	}

	.add:hover {
		background: var(--paper-hover);
	}

	.custom {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2);
		margin-top: var(--space-4);
		padding: var(--space-4);
		border-radius: var(--radius-lg);
		background: var(--paper-sunk);
	}

	.custom > :global(:first-child) {
		align-self: stretch;
	}

	.error {
		margin-top: var(--space-4);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	footer {
		display: flex;
		justify-content: flex-end;
		margin-top: var(--space-7);
	}

	@media (min-width: 768px) {
		h1 {
			font-size: var(--text-3xl);
		}
	}
</style>
