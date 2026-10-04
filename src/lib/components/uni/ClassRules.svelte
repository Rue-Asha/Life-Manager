<script lang="ts">
	import { WEEKDAYS } from '../recurring/RuleForm.svelte';
	import { GLYPHS } from '../projects/glyphs';
	import { UI_ICONS } from '../ui/icons';
	import type { RecurringRule } from '$lib/types';

	let { rules }: { rules: RecurringRule[] } = $props();

	const uid = $props.id();

	function cadence(rule: RecurringRule): string {
		if (rule.weekdays.length === 7) return 'Daily';
		return `Weekly, ${WEEKDAYS.filter((d) => rule.weekdays.includes(d.value)).map((d) => d.short).join(', ')}`;
	}
</script>

<section data-testid="class-rules" aria-labelledby="{uid}-h">
	<div class="head">
		<h2 id="{uid}-h">Recurring</h2>
		<a href="/recurring">
			Edit in Recurring<svg viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS['chevron-right']} /></svg>
		</a>
	</div>
	{#if rules.length}
		<ul>
			{#each rules as rule (rule.id)}
				<li>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.repeat} /></svg>
					<span class="title">{rule.title}</span>
					{#if rule.type}<span class="type">{rule.type}</span>{/if}
					<span class="when">{cadence(rule)}</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">No recurring rules for this class.</p>
	{/if}
</section>

<style>
	section {
		margin-top: var(--space-8);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-2);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--line);
	}

	h2 {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
	}

	a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--accent);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: var(--row-height);
		border-bottom: 1px solid var(--line);
	}

	li:last-child {
		border-bottom: 0;
	}

	li > svg {
		color: var(--ink-3);
	}

	.title {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.type {
		padding: 1px 5px;
		border-radius: var(--radius-xs);
		background: var(--paper-sunk);
		color: var(--ink-2);
		font-size: 11px;
		font-weight: var(--weight-semibold);
		letter-spacing: 0.04em;
		line-height: 16px;
	}

	.when {
		margin-left: auto;
		color: var(--ink-3);
		font-size: var(--text-sm);
		white-space: nowrap;
	}

	.empty {
		padding: var(--space-3) 0;
		color: var(--ink-3);
	}
</style>
