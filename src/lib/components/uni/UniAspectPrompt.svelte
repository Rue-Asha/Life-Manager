<!--
	Which aspect holds the uni todos. Before the first choice it is a card that replaces the whole hub ("Which aspect holds your uni todos?",
	"Use <aspect> for classes"); once an aspect is set, "Change" opens the same list on a sheet ("Change the Uni aspect"). Changing it while class
	links exist asks first and names the count. The chosen row is charcoal with a check mark; the post goes through one hidden form.
-->
<script lang="ts">
	import { copy } from '$lib/copy';
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import type { Aspect, Id } from '$lib/types';
	import Button from '../button/Button.svelte';
	import Icon from '../shell/Icon.svelte';
	import ConfirmDialog from '../ui/ConfirmDialog.svelte';
	import Sheet from '../ui/Sheet.svelte';
	import './uni.css';

	let {
		aspects,
		current = null,
		linkCount,
		open = false,
		onclose
	}: { aspects: Aspect[]; current?: Id | null; linkCount: number; open?: boolean; onclose?: () => void } = $props();

	// svelte-ignore state_referenced_locally
	let selected = $state<Id | null>(current ?? aspects.find((a) => a.name.toLowerCase() === 'uni')?.id ?? null);
	let confirming = $state(false);
	let form = $state<HTMLFormElement>();
	const uid = $props.id();

	$effect(() => {
		if (open && current !== null) selected = current;
	});

	const name = $derived(aspects.find((a) => a.id === selected)?.name);
	const dropsLinks = $derived(current !== null && selected !== current && linkCount > 0);
	const label = $derived(`Use ${name ?? 'an aspect'} for classes`);

	async function post() {
		confirming = false;
		await tick();
		form?.requestSubmit();
	}

	function go() {
		if (dropsLinks) {
			onclose?.();
			confirming = true;
		} else post();
	}
</script>

{#snippet options()}
	<fieldset class="u-fieldset">
		<legend class="sr-only">Aspects</legend>
		<div class="u-stack opts">
			{#each aspects as aspect (aspect.id)}
				<label class="u-opt">
					<input type="radio" name="{uid}-aspect" value={aspect.id} bind:group={selected} />
					<span class="main">
						<span class="nav-tile" data-color={aspect.color} aria-hidden="true"><Icon aspect={aspect.icon} size={16} /></span>
						<span class="text u-clamp2" data-user>{aspect.name}</span>
						<span class="check" aria-hidden="true"><Icon name="check" /></span>
					</span>
				</label>
			{/each}
		</div>
	</fieldset>
{/snippet}

{#if current === null}
	<section class="card u-panel" aria-labelledby="{uid}-h">
		<div class="u-stack-s">
			<h2 id="{uid}-h" class="ask">Which aspect holds your uni todos?</h2>
			<p class="u-note">Todos of this aspect can be linked to a class. You can change it later.</p>
		</div>
		{@render options()}
		<div class="u-tail"><Button variant="primary" disabled={selected === null} onclick={go}>{label}</Button></div>
	</section>
{/if}

{#snippet foot()}
	<Button onclick={() => onclose?.()}>Cancel</Button>
	<Button variant="primary" disabled={selected === null} onclick={go}>{label}</Button>
{/snippet}

{#if current !== null}
	<Sheet {open} title={copy.uni.changeAspectTitle} onclose={() => onclose?.()} actions={foot}>
		<div class="u-stack">
			<p class="u-note">Todos of this aspect can be linked to a class. You can change it later.</p>
			{@render options()}
		</div>
	</Sheet>
{/if}

<form method="POST" action="?/setUniAspect" hidden bind:this={form} use:enhance={() => async ({ update }) => { await update(); onclose?.(); }}>
	<input type="hidden" name="aspectId" value={selected ?? ''} />
</form>

<ConfirmDialog
	open={confirming}
	title="Use {name} for classes?"
	message="{linkCount} {linkCount === 1 ? 'todo or rule is' : 'todos and rules are'} linked to classes. Changing the aspect removes those links, their types and revised dates. The todos stay."
	confirmLabel="Remove {linkCount} {linkCount === 1 ? 'link' : 'links'} and change"
	onconfirm={post}
	oncancel={() => (confirming = false)}
/>

<style>
	.opts {
		gap: var(--space-4);
	}
	.ask {
		font-size: var(--type-display-m-size);
		line-height: var(--type-display-m-line);
		letter-spacing: var(--type-display-m-tracking);
		overflow-wrap: anywhere;
		text-wrap: balance;
	}
</style>
