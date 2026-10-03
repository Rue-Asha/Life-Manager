<script lang="ts" module>
	export const ASPECT_ERRORS: Record<string, string> = {
		required: 'Give the aspect a name.',
		duplicate: 'You already have an aspect with this name.'
	};
</script>

<script lang="ts">
	import {
		ASPECT_COLORS,
		ASPECT_ICONS,
		type AspectColor,
		type AspectIcon as AspectIconName
	} from '../../aspect-style';
	import AspectIcon from '../ui/AspectIcon.svelte';

	// Only the fields: the welcome page puts them inside its own form next to the presets.
	let {
		name = '',
		color = 'sage',
		icon = 'star',
		error
	}: { name?: string; color?: AspectColor; icon?: AspectIconName; error?: string } = $props();

	const uid = $props.id();
	const colors = Object.entries(ASPECT_COLORS) as [AspectColor, (typeof ASPECT_COLORS)[AspectColor]][];
	const icons = Object.keys(ASPECT_ICONS) as AspectIconName[];
</script>

<div class="form">
	<div class="name" class:invalid={error}>
		<span class="tile" style:background={ASPECT_COLORS[color].tint}>
			<AspectIcon {icon} {color} />
		</span>
		<label class="visually-hidden" for="{uid}-name">Name</label>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			id="{uid}-name"
			name="name"
			value={name}
			placeholder="Aspect name"
			autocomplete="off"
			autofocus
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? `${uid}-error` : undefined}
		/>
	</div>
	{#if error}<p class="error" id="{uid}-error">{ASPECT_ERRORS[error] ?? error}</p>{/if}

	<fieldset>
		<legend>Colour</legend>
		<div class="dots">
			{#each colors as [key, c] (key)}
				<label class="dot" style:--c={c.fg}>
					<span class="visually-hidden">{c.label}</span>
					<input type="radio" name="color" value={key} bind:group={color} />
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset>
		<legend>Icon</legend>
		<div class="icons" style:--tint={ASPECT_COLORS[color].tint}>
			{#each icons as key (key)}
				<label class="icon">
					<AspectIcon icon={key} {color} />
					<span class="visually-hidden">{key[0].toUpperCase() + key.slice(1)}</span>
					<input type="radio" name="icon" value={key} bind:group={icon} />
				</label>
			{/each}
		</div>
	</fieldset>
</div>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.name {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		height: var(--row-height);
		padding: 0 var(--space-2) 0 6px;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper);
	}

	.name:focus-within {
		box-shadow: var(--ring-focus);
	}

	.name.invalid {
		border-color: var(--ink);
	}

	.tile {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		flex: none;
		border-radius: var(--radius-sm);
	}

	input:not([type]) {
		flex: 1;
		min-width: 0;
		height: 100%;
		border: 0;
		background: none;
		font-size: var(--text-md);
	}

	input:not([type]):focus-visible {
		box-shadow: none;
	}

	input::placeholder {
		color: var(--ink-3);
	}

	.error {
		margin-top: calc(-1 * var(--space-2));
		color: var(--ink);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}

	legend {
		margin-bottom: var(--space-2);
		padding: 0;
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.dots {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	/* Each radio covers its swatch, so the swatch itself is the tap target. */
	input[type='radio'] {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}

	.dot {
		position: relative;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-pill);
		background: var(--c);
		cursor: pointer;
	}

	.dot:has(:checked) {
		box-shadow:
			0 0 0 2px var(--paper),
			0 0 0 4px var(--c);
	}

	.dot:has(:focus-visible) {
		box-shadow: var(--ring-focus);
	}

	.icons {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: var(--space-1);
	}

	.icon {
		position: relative;
		display: grid;
		place-items: center;
		height: 40px;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.icon:hover {
		background: var(--paper-hover);
	}

	.icon:has(:checked) {
		background: var(--tint);
	}

	.icon:has(:focus-visible) {
		box-shadow: var(--ring-focus);
	}
</style>
