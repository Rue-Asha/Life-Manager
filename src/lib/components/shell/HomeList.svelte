<script lang="ts">
	import { page } from '$app/state';
	import { UI_ICONS } from '../ui/icons';
	import { NAV_ITEMS, navCount, syncNeedsAttention, type NavData } from './Sidebar.svelte';

	const nav = $derived(page.data.nav as NavData);
</script>

<nav aria-label="Lists">
	<ul>
		{#each NAV_ITEMS as item (item.href)}
			{@const count = item.count ? navCount(nav, item.count) : null}
			<li class:aspects={item.href === '/aspects'}>
				<a href={item.href}>
					<svg viewBox="0 0 24 24" aria-hidden="true" class:today={item.href === '/'}>
						<path d={UI_ICONS[item.icon]} />
					</svg>
					{item.label}
					{#if count && count.n > 0}<span class="count num" class:late={count.late} aria-hidden="true">{count.n}</span>{/if}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<div class="sync">
	<a href="/sync" data-testid="sync-link">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['refresh-cw']} /></svg>
		Proton sync
		{#if syncNeedsAttention(nav)}<span class="marker" data-testid="sync-marker" role="img" aria-label="Needs attention"></span>{/if}
	</a>
</div>

<style>
	/* iOS-style grouped list: one white card, inset hairlines between rows. */
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		border-radius: var(--radius-group);
		background: var(--surface);
		box-shadow: var(--shadow-card);
		overflow: clip;
	}

	.sync {
		margin-top: var(--space-5);
		overflow: clip;
		border-radius: var(--radius-group);
		background: var(--surface);
		box-shadow: var(--shadow-card);
	}

	.marker {
		width: 10px;
		height: 10px;
		margin-left: auto;
		border-radius: 50%;
		background: var(--overdue);
	}

	li + li {
		position: relative;
	}

	li + li::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		left: calc(var(--space-4) + var(--icon-md) + var(--space-3));
		border-top: 1px solid var(--line);
	}

	/* Aspects are the setup list, so a band of canvas sets them apart from the six lists. */
	.aspects {
		border-top: var(--space-2) solid var(--canvas);
	}

	.aspects::before {
		display: none;
	}

	a {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 52px;
		padding: 0 var(--space-4);
		color: var(--ink);
		font-size: var(--text-lg);
		text-decoration: none;
	}

	a:hover {
		background: var(--hover);
	}

	.count {
		margin-left: auto;
		color: var(--ink-3);
		font-size: var(--text-md);
	}

	.count.late {
		color: var(--overdue);
		font-weight: var(--weight-semibold);
	}

	svg {
		width: var(--icon-md);
		height: var(--icon-md);
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		color: var(--ink-2);
	}

	.today {
		color: var(--accent);
	}
</style>
