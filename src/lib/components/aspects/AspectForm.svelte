<script lang="ts" module>
	export const ASPECT_ERRORS: Record<string, string> = {
		required: 'Give the aspect a name.',
		duplicate: 'You already have an aspect with this name.'
	};
</script>

<script lang="ts">
	import { ASPECT_COLORS, type AspectColor, type AspectIcon as AspectIconName } from '../../aspect-style';
	import AspectIcon from '../ui/AspectIcon.svelte';
	import ColorIconPicker from '../ui/ColorIconPicker.svelte';

	// Only the fields: the welcome page puts them inside its own form next to the presets.
	let {
		name = '',
		color = 'sage',
		icon = 'star',
		error
	}: { name?: string; color?: AspectColor; icon?: AspectIconName; error?: string } = $props();

	const uid = $props.id();
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

	<ColorIconPicker bind:color bind:icon />
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
</style>
