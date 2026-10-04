<script lang="ts">
	import {
		ASPECT_COLORS,
		ASPECT_ICONS,
		type AspectColor,
		type AspectIcon as AspectIconName
	} from '../../aspect-style';
	import AspectIcon from './AspectIcon.svelte';

	let {
		color = $bindable('sage'),
		icon = $bindable('star')
	}: { color?: AspectColor; icon?: AspectIconName } = $props();

	const colors = Object.entries(ASPECT_COLORS) as [AspectColor, (typeof ASPECT_COLORS)[AspectColor]][];
	const icons = Object.keys(ASPECT_ICONS) as AspectIconName[];
</script>

<div class="picker">
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
	.picker {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
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
	input {
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
