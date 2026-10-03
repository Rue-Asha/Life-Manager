<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UI_ICONS } from './icons';

	let {
		open,
		title,
		onclose,
		children
	}: { open: boolean; title: string; onclose: () => void; children: Snippet } = $props();

	const titleId = $props.id();
	let dialog: HTMLDialogElement;

	$effect(() => {
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});
</script>

<!-- `open` is the only source of truth: Escape and backdrop clicks ask the parent to close
     instead of closing the dialog themselves. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	aria-labelledby={titleId}
	oncancel={(e) => {
		e.preventDefault();
		onclose();
	}}
	onclick={(e) => {
		if (e.target === dialog) onclose();
	}}
>
	<div class="body">
		<header>
			<h2 id={titleId}>{title}</h2>
			<button type="button" class="close" aria-label="Close" onclick={onclose}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.x} /></svg>
			</button>
		</header>
		{@render children()}
	</div>
</dialog>

<style>
	dialog {
		border: 0;
		padding: 0;
		background: var(--paper);
		color: var(--ink);
		box-shadow: var(--shadow-float);
		max-width: 100vw;
	}

	dialog::backdrop {
		background: var(--paper-scrim);
	}

	.body {
		padding: var(--space-4) var(--gutter) var(--space-5);
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	h2 {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
		letter-spacing: -0.01em;
	}

	.close {
		display: grid;
		place-items: center;
		width: var(--control-height);
		height: var(--control-height);
		margin: 0 calc(-1 * var(--space-2)) 0 auto;
		border: 0;
		border-radius: var(--radius-md);
		background: none;
		color: var(--ink-2);
		cursor: pointer;
	}

	.close:hover {
		background: var(--paper-hover);
		color: var(--ink);
	}

	svg {
		width: var(--icon-md);
		height: var(--icon-md);
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	@media (max-width: 767px) {
		dialog {
			width: 100%;
			max-height: 90dvh;
			margin: auto 0 0;
			border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		}

		dialog[open] {
			animation: sheet-up var(--dur-slow) var(--ease-out);
		}

		.body {
			padding-bottom: calc(var(--space-5) + env(safe-area-inset-bottom));
		}
	}

	@media (min-width: 768px) {
		dialog {
			width: min(480px, calc(100vw - 2 * var(--gutter)));
			border-radius: var(--radius-lg);
		}

		.body {
			padding: var(--space-5) var(--space-6) var(--space-6);
		}

		dialog[open] {
			animation: dialog-in var(--dur-base) var(--ease-out);
		}
	}

	@keyframes sheet-up {
		from {
			transform: translateY(100%);
		}
	}

	@keyframes dialog-in {
		from {
			opacity: 0;
			transform: scale(0.97);
		}
	}
</style>
