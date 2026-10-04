<script lang="ts">
	import { enhance } from '$app/forms';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import type { Aspect, Id } from '$lib/types';
	import AspectIcon from '../ui/AspectIcon.svelte';
	import Button from '../ui/Button.svelte';
	import ConfirmDialog from '../ui/ConfirmDialog.svelte';
	import { UI_ICONS } from '../ui/icons';

	let {
		aspects,
		current = null,
		linkCount,
		oncancel,
		onsaved
	}: { aspects: Aspect[]; current?: Id | null; linkCount: number; oncancel?: () => void; onsaved?: () => void } = $props();

	// svelte-ignore state_referenced_locally
	let selected = $state<Id | null>(current ?? aspects.find((a) => a.name.toLowerCase() === 'uni')?.id ?? null);
	let confirming = $state(false);
	let confirmed = false;
	let form: HTMLFormElement;

	const name = $derived(aspects.find((a) => a.id === selected)?.name);
	const dropsLinks = $derived(current !== null && selected !== current && linkCount > 0);
</script>

<section class="prompt" data-testid="uni-aspect-prompt">
	<h2>{current === null ? 'Which aspect holds your uni todos?' : 'Change the Uni aspect'}</h2>
	<p>Todos of this aspect can be linked to a class. You can change it later.</p>
	<form
		method="POST"
		action="?/setUniAspect"
		bind:this={form}
		use:enhance={({ cancel }) => {
			if (dropsLinks && !confirmed) {
				cancel();
				confirming = true;
				return;
			}
			return async ({ update }) => {
				await update();
				onsaved?.();
			};
		}}
	>
		<ul>
			{#each aspects as aspect (aspect.id)}
				<li style:--a={ASPECT_COLORS[aspect.color].fg}>
					<label>
						<input class="hit" type="radio" name="aspectId" value={aspect.id} bind:group={selected} />
						<AspectIcon icon={aspect.icon} color={aspect.color} />{aspect.name}
						<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.check} /></svg>
					</label>
				</li>
			{/each}
		</ul>
		<footer>
			{#if oncancel}<Button type="button" variant="quiet" onclick={oncancel}>Cancel</Button>{/if}
			<Button type="submit" variant="primary" disabled={selected === null}>Use {name ?? 'an aspect'} for classes</Button>
		</footer>
	</form>
</section>

<ConfirmDialog
	open={confirming}
	title="Use {name} for classes?"
	message="{linkCount} {linkCount === 1 ? 'todo or rule is' : 'todos and rules are'} linked to classes. Changing the aspect removes those links, their types and revised dates. The todos stay."
	confirmLabel="Remove {linkCount} {linkCount === 1 ? 'link' : 'links'} and change"
	onconfirm={() => {
		confirming = false;
		confirmed = true;
		form.requestSubmit();
	}}
	oncancel={() => (confirming = false)}
/>

<style>
	.prompt {
		padding: var(--space-5);
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
	}

	h2 {
		margin-bottom: var(--space-1);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	p {
		margin-bottom: var(--space-4);
		color: var(--ink-2);
	}

	ul {
		margin: 0 0 var(--space-4);
		padding: 0;
		list-style: none;
	}

	label {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		height: var(--row-height);
		padding: 0 var(--space-2);
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	label:has(:checked) {
		background: var(--paper);
	}

	label:has(:focus-visible) {
		box-shadow: var(--ring-focus);
	}

	.hit {
		position: absolute;
		inset: 0;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}

	.tick {
		display: none;
		width: var(--icon-md);
		height: var(--icon-md);
		margin-left: auto;
		fill: none;
		stroke: var(--accent);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	label:has(:checked) .tick {
		display: block;
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
	}
</style>
