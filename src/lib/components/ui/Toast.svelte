<!--
	The one toast (role="status"): past tense, one optional action. It portals to the body, because the frame's backdrop-filter would
	make a fixed toast sit against the frame. Bottom centre; on phones it floats above the pill bar and the round "+".
	The message clamps at two lines; the action stays visible. Leaving (dismiss or `duration`) calls `ontimeout`.
-->
<script lang="ts">
	import { UI_ICONS } from './icons';

	let {
		message,
		actionLabel,
		onaction,
		ontimeout,
		duration = 5000
	}: { message: string; actionLabel?: string; onaction?: () => void; ontimeout: () => void; duration?: number } =
		$props();

	let paused = false;
	let left = 0;
	let started = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	function start() {
		started = Date.now();
		timer = setTimeout(ontimeout, Math.max(left, 0));
	}
	function pause() {
		if (paused) return;
		paused = true;
		clearTimeout(timer);
		left -= Date.now() - started;
	}
	function resume() {
		if (!paused) return;
		paused = false;
		start();
	}

	$effect(() => {
		left = duration;
		start();
		return () => clearTimeout(timer);
	});

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}
</script>

<div class="toaster" data-surface="inverse" use:portal>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="list" role="status" aria-live="polite" onpointerenter={pause} onpointerleave={resume} onfocusin={pause} onfocusout={resume}>
		<div class="toast">
			<p class="message">{message}</p>
			{#if actionLabel && onaction}
				<button type="button" class="action" data-press onclick={onaction}>{actionLabel}</button>
			{/if}
			<button type="button" class="dismiss" aria-label="Dismiss" data-press="round" onclick={ontimeout}>
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d={UI_ICONS.x} /></svg>
			</button>
		</div>
	</div>
</div>

<style>
	.toaster {
		position: fixed;
		z-index: var(--z-toast);
		inset-inline: var(--space-4);
		inset-block-end: calc(var(--space-4) + env(safe-area-inset-bottom));
		display: grid;
		justify-items: center;
		pointer-events: none;
		-webkit-user-select: none;
		user-select: none;
		-webkit-touch-callout: none;
		cursor: default;
	}
	@media (max-width: 767px) {
		.toaster {
			inset-block-end: calc(max(var(--space-3), env(safe-area-inset-bottom)) + var(--target-touch) + var(--space-2) * 2 + var(--space-3));
		}
	}
	.list {
		display: grid;
		justify-items: center;
		inline-size: 100%;
	}
	.toast {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		inline-size: min(100%, calc(var(--measure) * 0.75));
		min-block-size: max(var(--control-height), var(--target));
		padding: var(--space-1-5) var(--space-1-5) var(--space-1-5) var(--space-4);
		border-radius: var(--radius-panel);
		background: var(--surface-inverse);
		box-shadow: var(--elevation-menu);
		color: var(--ink-on-inverse);
		pointer-events: auto;
		animation: enter var(--motion-glide) var(--ease-out);
	}
	.message {
		flex: 1;
		min-inline-size: 0;
		margin-block: var(--space-2);
		overflow: hidden;
		overflow-wrap: anywhere;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
	}
	.action,
	.dismiss {
		display: grid;
		place-items: center;
		flex: none;
		min-block-size: max(var(--control-height-xs), var(--target));
		border: 0;
		border-radius: var(--radius-control);
		font-size: var(--type-label-size);
		line-height: var(--type-label-line);
		font-weight: var(--type-label-weight);
	}
	.action {
		padding-inline: var(--space-3-5);
		background: var(--surface-raised);
		color: var(--ink);
	}
	.dismiss {
		inline-size: max(var(--control-height-xs), var(--target));
		border-radius: var(--radius-round);
		background: transparent;
		color: var(--ink-on-inverse);
	}
	@media (hover: hover) {
		.action:hover {
			background: var(--surface-sunken);
		}
		.dismiss:hover {
			background: var(--surface-inverse-tint-strong);
		}
	}
	@keyframes enter {
		from {
			opacity: 0;
			transform: translateY(var(--settle-rise));
		}
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.toast {
			animation-name: fade;
		}
	}
</style>
