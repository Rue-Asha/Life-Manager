<!--
	Proton sync: the state card (state, last sync, pending changes, the last error, the re-login command with a copy control, Sync now and
	Resync all), the failed items under their next step, and the "How sync works" panel (a right column from 1280 px, a card under the
	state below). Off shows only its notice. While Syncing the buttons are disabled and the page polls every 2 seconds.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Split from '$lib/components/ui/Split.svelte';
	import '$lib/components/projects/projects.css';
	import Icon from '$lib/components/shell/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { copy } from '$lib/copy';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const uid = $props.id();
	const status = $derived(data.status);
	const attention = $derived(status.state === 'relogin' || status.state === 'error');
	const busy = $derived(status.state === 'syncing');
	const never = $derived(data.lastSync === null);
	const command = $derived(`proton account login --profile ${status.profile}`);
	const failedCount = $derived(data.failed.length);
	const offParts = copy.sync.offBody.split(/(PROTON_CLI|PROTON_PROFILE)/);

	let copied = $state(false);
	let copiedTimer: ReturnType<typeof setTimeout>;
	let errorOpen = $state(false);
	let opened = $state<string[]>([]);
	const flip = (key: string) => (opened = opened.includes(key) ? opened.filter((k) => k !== key) : [...opened, key]);

	async function copyCommand() {
		await navigator.clipboard.writeText(command);
		copied = true;
		clearTimeout(copiedTimer);
		copiedTimer = setTimeout(() => (copied = false), 2000);
	}

	$effect(() => {
		if (status.state !== 'syncing') return;
		const timer = setInterval(() => void invalidateAll(), 2000);
		return () => clearInterval(timer);
	});
</script>

<svelte:head>
	<title>Proton sync · Life Manager</title>
</svelte:head>

{#snippet body()}
	<section class="card pj-panel" aria-labelledby="{uid}-h">
		<div class="card-head" role="group" aria-label="State">
			<h2 id="{uid}-h">{copy.sync.states[status.state]}{#if status.state === 'idle' && failedCount}{' · '}{copy.sync.itemsFailed(failedCount)}{/if}</h2>
			{#if attention}<span class="needs"><span class="mark" role="img" aria-label={copy.sync.needsAttention}><Icon name="alert" size={18} /></span>{copy.sync.needsAttention}</span>{/if}
			{#if busy}<span class="busy" role="status"><i class="spin" aria-hidden="true"></i>{copy.sync.refreshing}</span>{/if}
		</div>
		<dl class="pj-kv">
			<div role="group" aria-label={copy.sync.lastSync}><dt>{copy.sync.lastSync}</dt><dd class="num">{data.lastSync ?? copy.sync.never}</dd></div>
			<div role="group" aria-label={copy.sync.pendingChanges}><dt>{copy.sync.pendingChanges}</dt><dd class="num">{data.pending}</dd></div>
		</dl>
		{#if status.lastError}
			<div class="alertbox" role="alert">
				<Icon name="alert" size={16} />
				<div class="alert-text">
					<p id="{uid}-err" class:clamp={!errorOpen} data-user>{status.lastError}</p>
					{#if status.lastError.length > 140}<button type="button" class="more" aria-expanded={errorOpen} aria-controls="{uid}-err" data-press onclick={() => (errorOpen = !errorOpen)}>{errorOpen ? copy.sync.hideDetails : copy.sync.showDetails}</button>{/if}
				</div>
			</div>
		{/if}
		{#if status.state === 'relogin'}
			<div class="pj-stack-s">
				<p id="{uid}-cmd">{copy.sync.reloginRun}</p>
				<div class="cmd">
					<code aria-describedby="{uid}-cmd" data-user>{command}</code>
					<Button size="s" type="button" label={copy.sync.copyCommand} onclick={copyCommand}>
						{#if copied}<Icon name="check" size={16} />{:else}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" /></svg>{/if}
						<span aria-live="polite">{copied ? copy.sync.copied : copy.sync.copy}</span>
					</Button>
				</div>
			</div>
		{/if}
		<form class="pj-tail" method="POST" use:enhance>
			<Button variant="primary" type="submit" formaction="?/syncNow" disabled={busy}>{copy.sync.syncNow}</Button>
			<Button type="submit" formaction="?/resyncAll" disabled={busy}>{copy.sync.resyncAll}</Button>
		</form>
		<p class="pj-quiet">{copy.sync.resyncNote}</p>
		{#if status.state === 'relogin'}<p class="pj-quiet">{copy.sync.reloginNote}</p>{/if}
		{#if status.state === 'error'}<p class="pj-quiet">{copy.sync.errorNote}</p>{/if}
		{#if busy}<p class="pj-quiet">{copy.sync.busyNote}</p>{/if}
	</section>
	{#if failedCount}
		<section class="card pj-panel" aria-labelledby="{uid}-failed">
			<div class="card-head"><h2 id="{uid}-failed">{copy.sync.failedItems}</h2><span class="card-note num">{failedCount}</span></div>
			<p class="next" id="{uid}-next">{copy.sync.failedNextStep}</p>
			<ul class="pj-stack" aria-label={copy.sync.failedItems} aria-describedby="{uid}-next">
				{#each data.failed as item (item.key)}
					<li class="failed" role="group" aria-label={item.label}>
						<span class="whole" data-user>{item.label}</span>
						<span class="pj-meta" class:clamp={!opened.includes(item.key)} id="{uid}-f-{item.key}" data-user>{item.error}</span>
						{#if item.error.length > 90}<button type="button" class="more" aria-expanded={opened.includes(item.key)} aria-controls="{uid}-f-{item.key}" data-press onclick={() => flip(item.key)}>{opened.includes(item.key) ? copy.sync.hideDetails : copy.sync.showDetails}</button>{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/snippet}

<div class="screen-head">
	<div class="screen-lead">
		<ul class="kicker">{#each copy.sync.kicker as k (k)}<li>{k}</li>{/each}</ul>
		<h1>Proton <em class="accent-word">sync</em></h1>
		<p class="lede">{copy.sync.lede}</p>
	</div>
	{#if status.state !== 'off'}
		<ul class="screen-facts" data-surface="inverse" aria-label={copy.sync.factsCaption}>
			<li class="facts-caption">{copy.sync.factsCaption}</li>
			<li><span class="n">{data.pending.toLocaleString('en-GB')}</span><span>{copy.sync.pending}</span></li>
			<li><span class="n">{failedCount.toLocaleString('en-GB')}</span><span>{copy.sync.failedItemsFact(failedCount)}</span></li>
		</ul>
	{/if}
</div>

<div class="screen-body" data-settle>
	{#if status.state === 'off'}
		<section class="card pj-panel" role="status" aria-labelledby="{uid}-h">
			<div class="card-head"><h2 id="{uid}-h">{copy.sync.states.off}</h2></div>
			<p class="off-copy">{#each offParts as part, i (i)}{#if part === 'PROTON_CLI' || part === 'PROTON_PROFILE'}<code>{part}</code>{:else}{part}{/if}{/each}</p>
		</section>
	{:else}
		<Split id="{uid}-sy" label={copy.sync.howLabel}>
			{#snippet main()}
				{@render body()}
			{/snippet}
			{#snippet side()}
				<p class="how">{failedCount > 0 && status.state === 'idle' ? `${copy.sync.failedHow} ` : ''}{copy.sync.how}</p>
			{/snippet}
		</Split>
	{/if}
</div>

<style>
	.off-copy {
		margin: 0;
		max-inline-size: var(--measure);
		overflow-wrap: anywhere;
	}
	.how {
		margin: 0;
		overflow-wrap: anywhere;
	}
	code {
		font-family: var(--font-mono);
		font-size: var(--type-body-s-size);
		overflow-wrap: anywhere;
	}
	.needs {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1-5);
		color: var(--danger);
		font-weight: var(--weight-semibold);
		font-size: var(--type-caption-size);
	}
	.busy {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--ink-secondary);
		font-size: var(--type-caption-size);
	}
	.spin {
		flex: none;
		inline-size: var(--space-3-5);
		block-size: var(--space-3-5);
		border-radius: var(--radius-round);
		border: var(--stroke-strong) solid var(--hairline);
		border-block-start-color: var(--ink);
		animation: spin var(--motion-spin) var(--ease-spin) infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spin {
			animation: pulse calc(var(--motion-spin) * 2) var(--ease-in-out) infinite alternate;
			border-color: var(--ink);
		}
		@keyframes pulse {
			to {
				opacity: var(--spinner-pulse-opacity);
			}
		}
	}
	.alertbox {
		display: flex;
		gap: var(--space-2-5);
		align-items: flex-start;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-panel);
		background: var(--danger-soft);
		box-shadow: var(--ring-danger);
		color: var(--danger);
	}
	.alertbox > :global(svg) {
		flex: none;
		margin-block-start: var(--space-0-5);
	}
	.alertbox p {
		margin: 0;
		min-inline-size: 0;
		overflow-wrap: anywhere;
		font-size: var(--type-body-s-size);
	}
	.alert-text {
		display: grid;
		justify-items: start;
		gap: var(--space-1);
		min-inline-size: 0;
		flex: 1;
	}
	.clamp {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		overflow-wrap: anywhere;
	}
	.failed {
		display: grid;
		justify-items: start;
		gap: var(--space-0-5);
		min-inline-size: 0;
		padding: var(--space-3) var(--space-2);
	}
	.failed + .failed {
		box-shadow: var(--rule-above);
	}
	/* a failed item's label is the only way to tell it apart, so it wraps in full instead of cutting off */
	.whole {
		display: block;
		overflow-wrap: anywhere;
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
		font-weight: var(--type-title-weight);
	}
	.next {
		margin: 0;
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
		color: var(--ink-secondary);
	}
	.more {
		display: inline-flex;
		align-items: center;
		min-block-size: max(var(--control-height-s), var(--target));
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		font-size: var(--type-caption-size);
		font-weight: var(--weight-semibold);
		text-decoration: underline;
		text-underline-offset: var(--space-0-5);
		cursor: pointer;
		transition: opacity var(--motion-quick) var(--ease-out);
	}
	.more:active {
		opacity: var(--disabled-opacity);
	}
	.more:focus-visible {
		outline: var(--focus-width) solid var(--focus-ring);
		outline-offset: var(--focus-offset);
	}
	.cmd {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: center;
	}
	.cmd code {
		flex: 1 1 14rem;
		min-inline-size: 0;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-panel);
		background: var(--surface-sunken);
	}
</style>
