<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { ASPECT_COLORS, PRESET_ASPECTS } from '$lib/aspect-style';
	import { copy } from '$lib/copy';
	import Button from '$lib/components/ui/Button.svelte';
	import ColorIconPicker from '$lib/components/ui/ColorIconPicker.svelte';
	import Field from '$lib/components/field/Field.svelte';
	import Icon from '$lib/components/shell/Icon.svelte';
	import type { AspectColor, AspectIcon } from '$lib/aspect-style';

	let { data, form } = $props();

	const uid = $props.id();
	// Reached later, with aspects already there: the bars come back.
	const revisit = $derived(data.nav.aspects.length > 0);
	const NAME_ERRORS: Record<string, string> = { required: copy.welcome.nameRequired, duplicate: copy.welcome.nameTaken };

	let picked = $state<string[]>([]);
	// With every preset taken, the own aspect is the only way to add one.
	let open = $state(data.existingPresets.length === PRESET_ASPECTS.length);
	let typed = $state('');
	let color = $state<AspectColor>('tangerine');
	let icon = $state<AspectIcon>('star');
	// The server's name error stays until the name is edited or removed.
	let edited = $state(false);

	const nameError = $derived(form?.field === 'name' && !edited ? (NAME_ERRORS[form.error as string] ?? String(form.error)) : '');
	const formError = $derived(form?.field === 'preset' ? copy.welcome.pickOne : '');
	// A custom aspect the server just refused is not one the next submit adds, so it is not counted until the name changes.
	const n = $derived(picked.length + (open && typed.trim() && !nameError ? 1 : 0));
	const label = $derived(n === 0 ? copy.welcome.continue : copy.welcome.continueWith(n));

	const toggle = (name: string, on: boolean) => (picked = on ? [...picked, name] : picked.filter((x) => x !== name));
	async function add() {
		open = true;
		await tick();
		document.getElementById(`${uid}-name`)?.focus();
	}
	function remove() {
		open = false;
		typed = '';
		edited = true;
	}
</script>

<svelte:head>
	<title>Welcome · Life Manager</title>
</svelte:head>

<div class="screen-head">
	<div class="screen-lead lead">
		<ul class="kicker">
			<li>{revisit ? copy.welcome.kickerRevisit : copy.welcome.kickerFirst}</li>
			{#if !revisit}<li>{copy.welcome.kickerFirstRun}</li>{/if}
		</ul>
		<h1>Set up your <em class="accent-word">aspects</em></h1>
		<p class="lede">{copy.welcome.lede}</p>
	</div>
</div>

<div class="screen-body" data-settle>
	<form
		class="card form"
		data-surface="solid"
		method="POST"
		action="?/create"
		aria-label={copy.welcome.title}
		use:enhance={() => {
			edited = false;
			return ({ update }) => update({ reset: false });
		}}
	>
		<fieldset>
			<legend class="ruled">{copy.welcome.presets}</legend>
			<ul class="grid">
				{#each PRESET_ASPECTS as preset (preset.name)}
					{@const has = data.existingPresets.includes(preset.name)}
					<li>
						<label class="preset" data-existing={has ? '' : undefined} style:--aspect={ASPECT_COLORS[preset.color].fg}>
							<input
								type="checkbox"
								name="preset"
								value={preset.name}
								aria-label={preset.name}
								checked={!has && picked.includes(preset.name)}
								disabled={has}
								aria-describedby={has ? `${uid}-${preset.name}` : undefined}
								onchange={(e) => toggle(preset.name, e.currentTarget.checked)}
							/>
							<span class="chip" aria-hidden="true"><Icon aspect={preset.icon} size={22} /></span>
							<span class="text">
								<span class="name">{preset.name}</span>
								{#if has}<span class="tag" id="{uid}-{preset.name}"><Icon name="check" size={14} />{copy.welcome.existing}</span>{/if}
							</span>
							{#if !has}<span class="tick" aria-hidden="true"><Icon name="check" size={16} /></span>{/if}
						</label>
					</li>
				{/each}
			</ul>
		</fieldset>

		{#if open}
			<fieldset class="custom">
				<legend class="ruled">{copy.welcome.custom}</legend>
				<div class="custom-name">
					<Field
						label={copy.welcome.nameLabel}
						name="name"
						placeholder={copy.welcome.nameLabel}
						autocomplete="off"
						autocapitalize="words"
						enterkeyhint="done"
						id="{uid}-name"
						data-user
						error={nameError || undefined}
						bind:value={typed}
						oninput={() => (edited = true)}
					/>
				</div>
				<ColorIconPicker bind:color bind:icon />
				<Button variant="quiet" size="s" type="button" class="remove" onclick={remove}><Icon name="close" size={16} />{copy.welcome.remove}</Button>
			</fieldset>
		{/if}

		<div class="foot">
			{#if !open}
				<Button variant="secondary" type="button" aria-expanded="false" onclick={add}><Icon name="plus" size={18} />{copy.welcome.addOwn}</Button>
			{/if}
			{#if formError}
				<p class="form-error" role="alert"><Icon name="alert" size={14} />{formError}</p>
			{:else if n === 0}
				<p class="hint">{copy.welcome.hint}</p>
			{/if}
			<Button class="go" variant="primary" arrow disabled={n === 0}>{label}</Button>
		</div>
	</form>
</div>

<style>
	.lead {
		max-inline-size: 40rem;
	}

	.screen-body > .form.card {
		display: grid;
		gap: var(--space-6);
		padding: var(--space-6) var(--space-6) var(--space-5);
		background: var(--surface-raised);
		min-inline-size: 0;
	}
	fieldset {
		min-inline-size: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}
	legend.ruled {
		margin-block-end: var(--space-4);
	}

	/* ---------- Presets: one big toggle pill each ---------- */
	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-2-5);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	/* The real checkbox covers the whole pill, so a tap anywhere toggles it and a click lands on the input itself. */
	.preset > input {
		position: absolute;
		inset: 0;
		inline-size: 100%;
		block-size: 100%;
		margin: 0;
		opacity: 0;
		cursor: inherit;
	}
	.preset {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-block-size: var(--space-16);
		padding: var(--space-2-5) var(--space-4) var(--space-2-5) var(--space-2-5);
		border-radius: var(--radius-pill);
		background: var(--surface-sunken);
		cursor: pointer;
		touch-action: manipulation;
		transition:
			background-color var(--motion-quick) var(--ease-out),
			color var(--motion-quick) var(--ease-out),
			box-shadow var(--motion-quick) var(--ease-out),
			transform var(--motion-quick) var(--ease-out);
	}
	.preset:not(:has(input:disabled)):active {
		transform: scale(var(--press-scale));
	}
	.chip {
		display: grid;
		place-items: center;
		flex: none;
		inline-size: var(--space-12);
		block-size: var(--space-12);
		border-radius: var(--radius-round);
		background: var(--aspect);
		color: var(--aspect-ink);
	}
	.text {
		display: grid;
		gap: var(--space-0-5);
		flex: 1;
		min-inline-size: 0;
	}
	.name {
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
		font-weight: var(--type-title-weight);
		overflow-wrap: break-word;
	}
	.tick {
		display: grid;
		place-items: center;
		flex: none;
		inline-size: var(--space-7);
		block-size: var(--space-7);
		border-radius: var(--radius-round);
		box-shadow: var(--ring-control);
		color: transparent;
	}
	/* Picked (gate 5, Q13): the charcoal pressed state with a check, as in menus and segments; no accent fill. An existing preset never reads as picked. */
	.preset:has(input:checked:not(:disabled)) {
		background: var(--surface-inverse);
		color: var(--ink-on-inverse);
		box-shadow: none;
	}
	.preset:has(input:checked:not(:disabled)) .tick {
		background: var(--surface-raised);
		box-shadow: none;
		color: var(--ink);
	}
	.preset:has(input:focus-visible) {
		outline: var(--focus-width) solid var(--focus-ring);
		outline-offset: var(--focus-offset);
	}
	.preset:has(input:checked:not(:disabled)):has(input:focus-visible) {
		outline-color: var(--focus-ring-on-inverse);
		box-shadow: var(--focus-halo);
	}
	@media (hover: hover) and (pointer: fine) {
		.preset:not(:has(input:checked, input:disabled)):hover {
			background: var(--surface-control-solid-hover);
		}
	}
	/* An existing preset is a plain, dimmed pill with its note: nothing about it looks pressed. */
	.preset[data-existing] {
		cursor: default;
	}
	.preset[data-existing] :is(.chip, .name) {
		opacity: var(--disabled-opacity);
	}
	.tag {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--type-caption-size);
		line-height: var(--type-caption-line);
		font-weight: var(--weight-semibold);
		color: var(--ink-secondary);
	}

	/* ---------- Your own aspect ---------- */
	.custom {
		display: grid;
		gap: var(--space-5);
	}
	.custom-name {
		max-inline-size: 26rem;
	}
	.custom :global(.remove) {
		justify-self: start;
	}

	/* ---------- Foot ---------- */
	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		padding-block-start: var(--space-5);
		box-shadow: var(--rule-above);
	}
	.hint {
		flex: 1 1 12rem;
		margin: 0;
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
		color: var(--ink-secondary);
	}
	.form-error {
		flex: 1 1 100%;
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
		margin: 0;
		font-size: var(--type-body-s-size);
		font-weight: var(--weight-semibold);
		color: var(--danger);
	}
	.foot :global(.go) {
		margin-inline-start: auto;
	}

	@media (max-width: 1099px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 767px) {
		.screen-body > .form.card {
			gap: var(--space-5);
			padding: var(--space-4) var(--space-3);
		}
		.grid {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-2);
		}
		.chip {
			inline-size: var(--target-touch);
			block-size: var(--target-touch);
		}
		.foot {
			gap: var(--space-2);
		}
		.foot :global(.btn) {
			flex: 1 1 100%;
		}
		.foot :global(.go) {
			justify-content: space-between;
		}
		.hint {
			order: -1;
			flex-basis: 100%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.preset {
			transition:
				background-color var(--motion-quick) var(--ease-out),
				box-shadow var(--motion-quick) var(--ease-out);
		}
		.preset:not(:has(input:disabled)):active {
			transform: none;
		}
	}
</style>
