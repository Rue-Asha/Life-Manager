<!--
	The IT aspect choice. `card` is the one-time prompt that replaces the overview before the first use; `sheet` is "Change the IT aspect"
	(a Sheet opened from the side panel). The chosen row is charcoal with a check, and the submit names it. When links would be lost, the
	sheet closes and "Change the IT aspect?" asks first; the choice posts from a hidden form so it outlives the sheet.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { copy } from '$lib/copy';
	import type { Aspect, Id } from '$lib/types';
	import Icon from '../shell/Icon.svelte';
	import Button from '../ui/Button.svelte';
	import ConfirmDialog from '../ui/ConfirmDialog.svelte';
	import Sheet from '../ui/Sheet.svelte';

	let {
		aspects,
		current = null,
		linkCount,
		mode,
		open = false,
		onclose = () => {},
		onsaved
	}: { aspects: Aspect[]; current?: Id | null; linkCount: number; mode: 'card' | 'sheet'; open?: boolean; onclose?: () => void; onsaved?: () => void } = $props();

	const uid = $props.id();
	let selected = $state<Id | null>(untrack(() => current ?? aspects.find((a) => a.name.toLowerCase() === 'it')?.id ?? null));
	$effect(() => {
		if (mode === 'sheet' && open) selected = current ?? aspects.find((a) => a.name.toLowerCase() === 'it')?.id ?? null;
	});
	let confirming = $state(false);
	let form = $state<HTMLFormElement>();

	const name = $derived(aspects.find((a) => a.id === selected)?.name);
	const dropsLinks = $derived(current !== null && selected !== current && linkCount > 0);

	function apply() {
		if (selected === null) return;
		if (mode === 'sheet') onclose();
		if (dropsLinks) confirming = true;
		else form?.requestSubmit();
	}
</script>

{#snippet options()}
	<fieldset class="pj-fieldset">
		<legend class="sr-only">{copy.projects.aspects}</legend>
		<ul class="pj-opts">
			{#each aspects as a (a.id)}
				<li>
					<label class="pj-opt" data-color={a.color}>
						<input type="radio" name="aspectId" value={a.id} bind:group={selected} />
						<span class="pj-opt-main">
							<span class="nav-tile" data-color={a.color} aria-hidden="true"><Icon aspect={a.icon} size={16} /></span>
							<span class="pj-opt-name" data-user>{a.name}</span>
							<span class="check" aria-hidden="true"><Icon name="check" /></span>
						</span>
					</label>
				</li>
			{/each}
		</ul>
	</fieldset>
{/snippet}

<form hidden method="POST" action="?/setItAspect" bind:this={form} use:enhance={() => async ({ update }) => { await update(); onsaved?.(); }}>
	<input type="hidden" name="aspectId" value={selected ?? ''} />
</form>

{#if mode === 'card'}
	<section class="card pj-panel" aria-labelledby="{uid}-h">
		<div class="pj-stack-s">
			<h2 id="{uid}-h" class="pj-card-title">{current === null ? copy.projects.promptAsk : copy.projects.promptChange}</h2>
			<p class="pj-quiet">{copy.projects.promptLede}</p>
		</div>
		{@render options()}
		<div class="pj-tail">
			<Button variant="primary" type="button" disabled={selected === null} onclick={apply}>
				<span>{copy.projects.useBefore} <span class="name" data-user>{name ?? copy.projects.anAspect}</span> {copy.projects.useAfter}</span>
			</Button>
		</div>
	</section>
{:else}
	<Sheet {open} title={copy.projects.promptChange} {onclose}>
		<section class="pj-form" aria-label={copy.projects.promptChange}>
			<p class="pj-quiet">{copy.projects.promptLede}</p>
			{@render options()}
		</section>
		{#snippet actions()}
			<Button type="button" onclick={onclose}>{copy.projects.cancel}</Button>
			<Button variant="primary" type="button" disabled={selected === null} onclick={apply}>{copy.projects.use(name ?? copy.projects.anAspect)}</Button>
		{/snippet}
	</Sheet>
{/if}

<ConfirmDialog
	open={confirming}
	title={copy.projects.confirmTitle}
	message={copy.projects.confirmMessage(linkCount)}
	confirmLabel={copy.projects.confirm}
	onconfirm={() => {
		confirming = false;
		form?.requestSubmit();
	}}
	oncancel={() => (confirming = false)}
/>

<style>
	.name {
		overflow-wrap: anywhere;
	}
	.pj-tail :global(.btn) {
		white-space: normal;
		text-align: start;
		block-size: auto;
		padding-block: var(--space-2);
	}
</style>
