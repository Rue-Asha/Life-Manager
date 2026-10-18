<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import ListGroup from '$lib/components/ui/ListGroup.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import type { SyncState } from '$lib/server/proton/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const LABELS: Record<SyncState, string> = {
		off: 'Off',
		idle: 'Up to date',
		syncing: 'Syncing…',
		relogin: 'Re-login needed',
		error: 'Error'
	};

	const status = $derived(data.status);
	const attention = $derived(status.state === 'relogin' || status.state === 'error');

	$effect(() => {
		if (status.state !== 'syncing') return;
		const timer = setInterval(() => void invalidateAll(), 2000);
		return () => clearInterval(timer);
	});
</script>

<svelte:head>
	<title>Proton sync · Life Manager</title>
</svelte:head>

<PageHeader title="Proton sync" subtitle="Planned todos, recurring rules and exams, pushed to Proton Calendar." />

{#if status.state === 'off'}
	<p class="card" data-testid="sync-off">
		Sync is off. Set <code>PROTON_CLI</code> to the path of the proton binary and restart the app to turn it on.
		<code>PROTON_PROFILE</code> picks the login profile and defaults to <code>default</code>.
	</p>
{:else}
	<ListGroup>
		<div class="row">
			<span>State</span>
			<b class:attention data-testid="sync-state">{LABELS[status.state]}</b>
		</div>
		<div class="row">
			<span>Last sync</span>
			<span class="num" data-testid="sync-last">{data.lastSync ?? 'Never'}</span>
		</div>
		<div class="row">
			<span>Pending changes</span>
			<span class="num" data-testid="sync-pending">{data.pending}</span>
		</div>
	</ListGroup>

	{#if status.lastError}
		<p class="card error" data-testid="sync-last-error">{status.lastError}</p>
	{/if}

	{#if status.state === 'relogin'}
		<div class="card">
			<p>Run this on the server, then press Sync now:</p>
			<code class="command" data-testid="sync-login-command">proton account login --profile {status.profile}</code>
		</div>
	{/if}

	{#if data.failed.length > 0}
		<h2>Failed items</h2>
		<div data-testid="sync-failed">
			<ListGroup>
				{#each data.failed as item (item.key)}
					<div class="row failed" data-testid="sync-failed-item">
						<span class="label">{item.label}</span>
						<span class="detail">{item.error}</span>
					</div>
				{/each}
			</ListGroup>
		</div>
	{/if}

	<form class="actions" method="POST" use:enhance>
		<Button variant="primary" formaction="?/syncNow" disabled={status.state === 'syncing'}>Sync now</Button>
		<Button formaction="?/resyncAll" disabled={status.state === 'syncing'}>Resync all</Button>
	</form>

	<p class="note" data-testid="sync-note">
		Sync only writes to Proton. Renaming or recolouring an aspect doesn't change its Proton calendar, and edits made in
		Proton aren't read back; Resync all restores this app's state.
	</p>
{/if}

<style>
	.card {
		margin: 0 0 var(--space-4);
		padding: var(--space-4);
		border-radius: var(--radius-group);
		background: var(--surface);
		box-shadow: var(--shadow-card);
		color: var(--ink-2);
		overflow-wrap: anywhere;
	}

	.card p {
		margin: 0 0 var(--space-2);
	}

	.error {
		color: var(--overdue);
	}

	.row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-4);
		min-height: 52px;
		padding: var(--space-3) var(--space-4);
	}

	.row b {
		font-weight: var(--weight-semibold);
	}

	.attention {
		color: var(--overdue);
	}

	.failed {
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-1);
	}

	.label {
		overflow-wrap: anywhere;
		font-weight: var(--weight-medium);
	}

	.detail {
		overflow-wrap: anywhere;
		color: var(--overdue);
		font-size: var(--text-sm);
	}

	h2 {
		margin: var(--space-6) 0 var(--space-2);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	.command {
		display: block;
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--canvas);
		color: var(--ink);
		overflow-wrap: anywhere;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: var(--space-5) 0 var(--space-4);
	}

	.note {
		color: var(--ink-3);
		font-size: var(--text-sm);
	}
</style>
