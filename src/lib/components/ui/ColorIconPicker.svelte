<!--
	Colour (8) and icon (25) choice of an aspect as two native radio groups. The colour is a swatch in the aspect colour with a check on the
	chosen one (never colour alone), the icon its real glyph on the charcoal pill when chosen. Every choice is a 44 px circle. Used by the
	aspect form and by Welcome and the class form; the radios post as `color` and `icon`.
-->
<script lang="ts">
	import { ASPECT_COLORS, ASPECT_ICONS, type AspectColor, type AspectIcon as AspectIconName } from '../../aspect-style';
	import Icon from '../shell/Icon.svelte';

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
		<div class="row">
			{#each colors as [key, c] (key)}
				<label class="swatch" style:--aspect={c.fg}>
					<input type="radio" name="color" value={key} bind:group={color} />
					<span class="dot" aria-hidden="true"><Icon name="check" size={14} /></span>
					<span class="sr-only">{c.label}</span>
				</label>
			{/each}
		</div>
	</fieldset>
	<fieldset>
		<legend>Icon</legend>
		<div class="row">
			{#each icons as key (key)}
				<label class="glyph-choice">
					<input type="radio" name="icon" value={key} bind:group={icon} />
					<Icon aspect={key} size={20} />
					<span class="sr-only">{key[0].toUpperCase() + key.slice(1)}</span>
				</label>
			{/each}
		</div>
	</fieldset>
</div>

<style>
	.picker {
		display: grid;
		gap: var(--space-5);
		min-inline-size: 0;
	}
	fieldset {
		min-inline-size: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}
	legend {
		margin-block-end: var(--space-2);
		padding: 0;
		font-size: var(--type-label-size);
		line-height: var(--type-label-line);
		font-weight: var(--type-label-weight);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}
	.swatch,
	.glyph-choice {
		position: relative;
		display: grid;
		place-items: center;
		inline-size: max(44px, var(--target-touch));
		block-size: max(44px, var(--target-touch));
		border: var(--stroke-strong) solid transparent;
		border-radius: var(--radius-round);
		cursor: pointer;
		touch-action: manipulation;
	}
	/* Each radio covers its circle, so the whole circle is the target. */
	input {
		position: absolute;
		inset: 0;
		inline-size: 100%;
		block-size: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	.dot {
		display: grid;
		place-items: center;
		inline-size: var(--space-7);
		block-size: var(--space-7);
		border-radius: var(--radius-round);
		background: var(--aspect);
		color: transparent;
	}
	.swatch:has(input:checked) {
		border-color: var(--aspect);
	}
	.swatch:has(input:checked) .dot {
		color: var(--aspect-ink);
	}
	.glyph-choice {
		color: var(--ink-secondary);
	}
	.glyph-choice:has(input:checked) {
		background: var(--surface-inverse);
		color: var(--ink-on-inverse);
	}
	:is(.swatch, .glyph-choice):has(input:focus-visible) {
		outline: var(--focus-width) solid var(--focus-ring);
		outline-offset: var(--focus-offset);
	}
	@media (hover: hover) and (pointer: fine) {
		.glyph-choice:not(:has(input:checked)):hover {
			background: var(--surface-sunken);
			color: var(--ink);
		}
	}
</style>
