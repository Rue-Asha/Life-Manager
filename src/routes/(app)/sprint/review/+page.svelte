<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/shell/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import { weekLabel } from '$lib/components/todo/format';
	import { copy } from '$lib/copy';
	import type { Id, ReviewDecision, Todo } from '$lib/types';

	let { data, form } = $props();

	const LABELS: Record<ReviewDecision, string> = { carry: 'Carry over', backlog: 'Back to backlog', drop: 'Drop' };
	const VERBS: Record<ReviewDecision, string> = { carry: 'Carry', backlog: 'return', drop: 'drop' };
	const KINDS = ['carry', 'backlog', 'drop'] as const;

	// A recurring instance in the backlog makes no sense (scope.md), so it is carried or dropped.
	const choices = (todo: Todo): ReviewDecision[] => (todo.recurring ? ['carry', 'drop'] : ['carry', 'backlog']);

	let decisions = $state<Record<Id, ReviewDecision>>({});
	const decisionOf = (todo: Todo) => decisions[todo.id] ?? 'carry';
	const counts = $derived({
		carry: data.open.filter((t) => decisionOf(t) === 'carry').length,
		backlog: data.open.filter((t) => decisionOf(t) === 'backlog').length,
		drop: data.open.filter((t) => decisionOf(t) === 'drop').length
	});

	const closeLabel = $derived.by(() => {
		const parts = KINDS.filter((d) => counts[d] > 0).map((d) => `${VERBS[d]} ${counts[d]}`);
		if (parts.length === 0) return 'Close sprint';
		const text = parts.join(', ') + ' and close';
		return text[0].toUpperCase() + text.slice(1);
	});

	const all = $derived(data.open.length + data.done.length);
	const lede = $derived(
		all === 0
			? 'Nothing was planned this week.'
			: data.open.length === 0
				? copy.review.allDone(all)
				: 'Open todos carry over into next week unless you send them back.'
	);
	const summary = $derived(
		data.open.length > 0
			? `${data.open.length} open: ${counts.carry} carry over${counts.backlog ? `, ${counts.backlog} back to backlog` : ''}${counts.drop ? `, ${counts.drop} dropped` : ''}. Nothing changes until you close. Closing opens Plan your week.`
			: 'Closing opens Plan your week.'
	);
	const short = $derived(data.open.length > 0 ? `${data.open.length} open · ${data.done.length} done` : `${data.done.length} done`);
	const closeError = $derived(form?.error && !form.field ? copy.errors.closeSprint : null);

	const byAspect = (todos: Todo[]) =>
		data.aspects
			.map((aspect) => ({ aspect, todos: todos.filter((t) => t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0);
	const aspectOf = (todo: Todo) => data.aspects.find((a) => a.id === todo.aspectId)!;
</script>

<svelte:head>
	<title>Review your sprint · Life Manager</title>
</svelte:head>

<div class="screen-head">
	<div class="screen-lead">
		<ul class="kicker"><li>Sprint</li><li>{weekLabel(data.sprint.weekStart!)}</li></ul>
		<h1>Review your <em class="accent-word">sprint</em></h1>
		<p class="lede">{lede}</p>
	</div>
	<ul class="screen-facts" data-surface="inverse" aria-label="Closing the sprint">
		<li class="facts-caption">Closing</li>
		<li><span class="n">{data.done.length}</span><span class="fact-name">done</span></li>
		{#if data.open.length > 0}
			<li><span class="n">{counts.carry}</span><span class="fact-name">carry over</span></li>
			<li><span class="n">{counts.backlog}</span><span class="fact-name">back to backlog</span></li>
			<li><span class="n">{counts.drop}</span><span class="fact-name">dropped</span></li>
		{/if}
	</ul>
</div>

<div class="screen-body hr-body" data-settle>
	{#if data.done.length > 0}
		<details class="card hr-done" aria-label="Done todos">
			<summary>
				<span class="hr-done-title">Done <span class="hr-count">{data.done.length}</span></span>
				<span class="hr-done-more"><span class="hr-show">Show</span><span class="hr-hide">Hide</span><Icon name="chevron" size={16} /></span>
			</summary>
			<ul class="hr-done-list">
				{#each data.done as todo (todo.id)}
					<li class="hr-done-row">
						<span class="hr-tick" aria-hidden="true"><Icon name="check" size={12} /></span>
						<ul class="bare"><TodoRow {todo} aspect={aspectOf(todo)} today={data.today} context="planning" readonly /></ul>
					</li>
				{/each}
			</ul>
		</details>
	{/if}

	<form class="hr-form" method="POST" action="?/close" use:enhance>
		{#each byAspect(data.open) as { aspect, todos } (aspect.id)}
			<section class="card hr-group" aria-labelledby="group-{aspect.id}">
				<div class="hr-group-head">
					<span class="nav-tile" data-color={aspect.color} aria-hidden="true"><Icon aspect={aspect.icon} size={16} /></span>
					<h2 id="group-{aspect.id}" data-user>{aspect.name}</h2>
					<span class="hr-count">{todos.length} open</span>
				</div>
				<div class="hr-list">
					{#each todos as todo (todo.id)}
						<div class="hr-item">
							<ul class="bare"><TodoRow {todo} {aspect} today={data.today} context="planning" /></ul>
							<div class="hr-opts" role="radiogroup" aria-label={todo.title}>
								{#each choices(todo) as decision (decision)}
									<label>
										<input
											type="radio"
											name="decision-{todo.id}"
											value={decision}
											checked={decisionOf(todo) === decision}
											onchange={() => (decisions[todo.id] = decision)}
										/>
										<span>{LABELS[decision]}</span>
									</label>
								{/each}
							</div>
							{#if form?.field === `decision-${todo.id}`}
								<p class="hr-alert" role="alert"><Icon name="alert" size={14} />This todo can’t go there.</p>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/each}

		<p class="card hr-summary" id="hr-summary">{#if data.open.length > 0}<strong>{closeLabel}</strong>{/if}{summary}</p>
		<section class="card hr-close" aria-label="Close" aria-describedby="hr-summary">
			<p class="hr-full">{summary}</p>
			<p class="hr-short" aria-hidden="true">{short}</p>
			<!-- Phones: the bar says "Close sprint" with the short count; the generated sentence ends the list (Rue, wave 11). -->
			<Button variant="primary" arrow aria-describedby={closeError ? 'close-error' : undefined}
				><span class="hr-label">{closeLabel}</span><span class="hr-label-short">Close sprint</span></Button
			>
			{#if closeError}
				<p class="hr-alert" role="alert" id="close-error"><Icon name="alert" size={14} />{closeError}</p>
			{/if}
		</section>
	</form>
</div>

<style>
	/* The Closing card sizes to its facts under the title on phones, as the signed small key-facts cards do. */
	@media (max-width: 767px) {
		.screen-head > .screen-facts {
			justify-self: start;
		}
	}
	.hr-body {
		align-content: start;
	}
	.hr-form {
		display: grid;
		gap: var(--space-4);
		min-inline-size: 0;
	}
	.bare {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.hr-count {
		flex: none;
		font-size: var(--type-caption-size);
		font-weight: var(--weight-semibold);
		font-variant-numeric: var(--numeric-figures);
		color: var(--ink-secondary);
	}

	.card.hr-done {
		display: block;
		padding: var(--space-1) var(--space-4);
	}
	.hr-done summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		min-block-size: var(--target-touch);
		list-style: none;
		cursor: pointer;
	}
	.hr-done summary::-webkit-details-marker {
		display: none;
	}
	.hr-done-title {
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
		font-weight: var(--type-title-weight);
	}
	.hr-done-more {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1-5);
		font-size: var(--type-caption-size);
		color: var(--ink-secondary);
	}
	.hr-done-more > :global(svg) {
		transition: transform var(--motion-quick) var(--ease-out);
	}
	.hr-done[open] .hr-done-more > :global(svg) {
		transform: rotate(180deg);
	}
	.hr-hide,
	.hr-done[open] .hr-show {
		display: none;
	}
	.hr-done[open] .hr-hide {
		display: inline;
	}
	.hr-done summary:focus-visible {
		outline-offset: var(--space-0-5);
		border-radius: var(--radius-panel);
	}
	.hr-done-list {
		display: grid;
		gap: var(--space-1-5);
		margin: 0 0 var(--space-3);
		padding: 0;
		list-style: none;
	}
	.hr-done-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-0-5) var(--space-3);
		border-radius: var(--radius-panel);
		background: var(--surface-sunken);
		color: var(--ink-secondary);
	}
	.hr-done-row .bare {
		flex: 1;
		min-inline-size: 0;
	}
	.hr-tick {
		display: grid;
		place-items: center;
		flex: none;
		inline-size: var(--space-5);
		block-size: var(--space-5);
		border-radius: var(--radius-round);
		background: var(--surface-inverse);
		color: var(--ink-on-inverse);
	}

	.hr-group {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-4);
		min-inline-size: 0;
	}
	.hr-group-head {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-inline-size: 0;
	}
	.hr-group-head .nav-tile {
		inline-size: var(--space-6);
		block-size: var(--space-6);
	}
	.hr-group-head h2 {
		flex: 1;
		min-inline-size: 0;
		font-family: var(--font-ui);
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
		font-weight: var(--type-title-weight);
		overflow-wrap: anywhere;
	}
	.hr-list {
		display: grid;
		gap: var(--space-1-5);
		min-inline-size: 0;
	}
	.hr-item {
		display: grid;
		gap: var(--space-2);
		padding: var(--space-0-5) var(--space-3) var(--space-3) var(--space-1);
		border-radius: var(--radius-panel);
		background: var(--surface-sunken);
		min-inline-size: 0;
	}
	.hr-item > .hr-opts {
		margin-inline-start: var(--space-2);
	}
	/* Review titles as signed (the plan's row title): body size, medium. */
	.hr-item :global(.title) {
		font-size: var(--type-body-size);
		line-height: var(--type-body-line);
		font-weight: var(--weight-medium);
	}
	.hr-opts {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-0-5);
		inline-size: fit-content;
		max-inline-size: 100%;
		padding: var(--space-1);
		border-radius: var(--radius-pill);
		background: var(--surface-raised);
		box-shadow: var(--ring-hairline);
		min-inline-size: 0;
	}
	.hr-opts label {
		position: relative;
		display: inline-flex;
	}
	.hr-opts input {
		position: absolute;
		inset: 0;
		inline-size: 100%;
		block-size: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	.hr-opts label > span {
		display: inline-flex;
		align-items: center;
		min-block-size: max(var(--control-height-s), var(--target));
		padding: 0 var(--space-4);
		border-radius: var(--radius-pill);
		font-size: var(--type-label-size);
		font-weight: var(--type-label-weight);
		white-space: nowrap;
		transition:
			background-color var(--motion-quick) var(--ease-out),
			color var(--motion-quick) var(--ease-out);
	}
	.hr-opts label:has(input:checked) > span {
		background: var(--surface-inverse);
		color: var(--ink-on-inverse);
	}
	.hr-opts label:has(input:focus-visible) > span {
		outline: var(--focus-width) solid var(--focus-ring);
		outline-offset: calc(-1 * var(--focus-width));
	}
	@media (hover: hover) {
		.hr-opts label:not(:has(input:checked)):hover > span {
			background: var(--surface-tint);
		}
	}

	.hr-alert {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0;
		padding: var(--space-1-5) var(--space-3);
		border-radius: var(--radius-item);
		background: var(--danger-soft);
		box-shadow: var(--ring-danger);
		color: var(--danger);
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
		font-weight: var(--weight-semibold);
	}
	.hr-alert > :global(svg) {
		flex: none;
	}

	.hr-close {
		display: grid;
		gap: var(--space-3);
		justify-items: start;
		padding: var(--space-4);
	}
	.hr-full,
	.hr-summary {
		margin: 0;
		font-size: var(--type-caption-size);
		line-height: var(--type-caption-line);
		color: var(--ink-secondary);
		overflow-wrap: anywhere;
	}
	.hr-summary {
		display: none;
		padding: var(--space-4);
	}
	.hr-label-short {
		display: none;
	}
	.hr-short {
		display: none;
		margin: 0;
		font-size: var(--type-body-s-size);
		line-height: var(--type-body-s-line);
		font-weight: var(--weight-semibold);
		font-variant-numeric: var(--numeric-figures);
		white-space: nowrap;
	}
	@media (max-width: 767px) {
		/* the full summary ends the list; the bar that sticks above the pill bar holds only the short count and the button */
		:global(:root:has(.hr-close)) {
			scroll-padding-block-end: 9rem;
		}
		.hr-summary {
			display: block;
		}
		.hr-full {
			display: none;
		}
		.hr-short {
			display: block;
		}
		.hr-close {
			position: sticky;
			inset-block-end: calc(max(var(--space-3), env(safe-area-inset-bottom)) + var(--target-touch) + var(--space-2) * 2 + var(--space-3));
			z-index: 2;
			grid-template-columns: auto minmax(0, 1fr);
			align-items: center;
			gap: var(--space-3);
			padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
			border-radius: var(--radius-pill);
			box-shadow: var(--elevation-card);
			animation: hr-bar-in var(--motion-glide) var(--ease-out) both;
		}
		.hr-close :global(.btn) {
			justify-self: end;
		}
		.hr-label {
			display: none;
		}
		.hr-label-short {
			display: inline;
		}
		.hr-summary > strong {
			display: block;
			margin-block-end: var(--space-1);
			color: var(--ink);
			font-weight: var(--weight-semibold);
		}
		.hr-close > .hr-alert {
			grid-column: 1 / -1;
		}
	}
	@keyframes hr-bar-in {
		from {
			opacity: 0;
			transform: translateY(var(--settle-rise));
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.hr-done-more > :global(svg),
		.hr-opts label > span {
			transition: none;
		}
		.hr-close {
			animation-name: fp-fade-in;
		}
	}
</style>
