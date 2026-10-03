<script lang="ts">
	import { page } from '$app/state';
	import { UI_ICONS } from '../ui/icons';
	import { NAV_ITEMS, navCount, type NavData } from './Sidebar.svelte';

	const nav = $derived(page.data.nav as NavData);
</script>

<nav aria-label="Lists">
	<ul>
		{#each NAV_ITEMS as item (item.href)}
			{@const count = navCount(nav, item.count)}
			<li class:aspects={item.href === '/aspects'}>
				<a href={item.href}>
					<svg viewBox="0 0 24 24" aria-hidden="true" class:today={item.href === '/'}>
						<path d={UI_ICONS[item.icon]} />
					</svg>
					{item.label}
					{#if count.n > 0}<span class="count num" class:late={count.late} aria-hidden="true">{count.n}</span>{/if}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* Aspects are the setup list, so a hairline sets them apart from the five lists. */
	.aspects {
		margin-top: var(--space-2);
		padding-top: var(--space-2);
		border-top: 1px solid var(--line);
	}

	a {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: var(--row-height);
		padding: 0 var(--space-3);
		margin: 0 calc(-1 * var(--space-3));
		border-radius: var(--radius-md);
		color: var(--ink);
		font-size: var(--text-lg);
		text-decoration: none;
	}

	a:hover {
		background: var(--paper-hover);
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
