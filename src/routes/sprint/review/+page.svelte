<script lang="ts">
	import { enhance } from '$app/forms';
	import AspectIcon from '$lib/components/ui/AspectIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import { weekLabel } from '$lib/components/todo/format';
	import type { Id, ReviewDecision, Todo } from '$lib/types';

	let { data, form } = $props();

	const LABELS: Record<ReviewDecision, string> = { carry: 'Carry over', backlog: 'Back to backlog', drop: 'Drop' };
	const VERBS: Record<ReviewDecision, string> = { carry: 'Carry', backlog: 'return', drop: 'drop' };

	// A recurring instance in the backlog makes no sense (scope.md), so it is carried or dropped.
	const choices = (todo: Todo): ReviewDecision[] => (todo.recurring ? ['carry', 'drop'] : ['carry', 'backlog']);

	let decisions = $state<Record<Id, ReviewDecision>>({});
	const decisionOf = (todo: Todo) => decisions[todo.id] ?? 'carry';

	const closeLabel = $derived.by(() => {
		const parts = (['carry', 'backlog', 'drop'] as const)
			.map((d) => ({ d, n: data.open.filter((t) => decisionOf(t) === d).length }))
			.filter(({ n }) => n > 0)
			.map(({ d, n }) => `${VERBS[d]} ${n}`);
		if (parts.length === 0) return 'Close sprint';
		const text = parts.join(', ') + ' and close';
		return text[0].toUpperCase() + text.slice(1);
	});

	const byAspect = (todos: Todo[]) =>
		data.aspects
			.map((aspect) => ({ aspect, todos: todos.filter((t) => t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0);
	const aspectOf = (todo: Todo) => data.aspects.find((a) => a.id === todo.aspectId)!;
</script>

<svelte:head>
	<title>Review your sprint · Life Manager</title>
</svelte:head>

<PageHeader title="Review your sprint" icon="flag">
	<span class="week num">{weekLabel(data.sprint.weekStart!)}</span>
</PageHeader>

{#if data.open.length === 0}
	<p class="reward">
		{data.done.length > 0 ? `All ${data.done.length} done. Nice week.` : 'Nothing was planned this week.'}
	</p>
{:else}
	<p class="rule">Open todos carry over into next week unless you send them back.</p>
{/if}

{#if data.done.length > 0}
	<details class="done" data-testid="review-done">
		<summary>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['chevron-left']} /></svg>
			Done <span class="count num">{data.done.length}</span>
		</summary>
		<ul>
			{#each data.done as todo (todo.id)}
				<TodoRow {todo} aspect={aspectOf(todo)} today={data.today} context="planning" />
			{/each}
		</ul>
	</details>
{/if}

{#each byAspect(data.open) as { aspect, todos } (aspect.id)}
	<section class="group" aria-labelledby="group-{aspect.id}">
		<h2 id="group-{aspect.id}">
			<AspectIcon icon={aspect.icon} color={aspect.color} />{aspect.name}
			<span class="count num">{todos.length}</span>
		</h2>
		{#each todos as todo (todo.id)}
			<div class="item">
				<ul><TodoRow {todo} {aspect} today={data.today} context="planning" /></ul>
				<div class="segment" role="radiogroup" aria-label={todo.title}>
					{#each choices(todo) as decision (decision)}
						<label>
							<input
								type="radio"
								form="review-form"
								name="decision-{todo.id}"
								value={decision}
								checked={decisionOf(todo) === decision}
								onchange={() => (decisions[todo.id] = decision)}
							/>
							{LABELS[decision]}
						</label>
					{/each}
				</div>
			</div>
			{#if form?.field === `decision-${todo.id}`}
				<p class="error" role="alert">This todo can’t go there.</p>
			{/if}
		{/each}
	</section>
{/each}

<form id="review-form" class="close" method="POST" action="?/close" use:enhance>
	{#if form?.error && !form.field}
		<p class="error" role="alert">That didn’t work. Reload and try again.</p>
	{/if}
	<Button variant="primary">{closeLabel}</Button>
</form>

<style>
	.week {
		color: var(--ink-2);
		font-weight: var(--weight-medium);
	}

	.rule,
	.reward {
		margin-bottom: var(--space-6);
		color: var(--ink-2);
	}

	.reward {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-title);
		color: var(--ink);
	}

	.done {
		margin-bottom: var(--space-7);
	}

	summary {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: var(--row-height);
		border-bottom: 1px solid var(--line);
		color: var(--ink-2);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		list-style: none;
		cursor: pointer;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary svg {
		width: var(--icon-md);
		height: var(--icon-md);
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		transform: rotate(180deg);
		transition: transform var(--dur-base) var(--ease-out);
	}

	.done[open] summary svg {
		transform: rotate(270deg);
	}

	.count {
		margin-left: auto;
		color: var(--ink-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
	}

	.group + .group {
		margin-top: var(--space-7);
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--line);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.item {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		padding-bottom: var(--space-2);
	}

	.segment {
		display: inline-flex;
		justify-self: start;
		padding: var(--space-0);
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
	}

	.segment label {
		position: relative;
		display: inline-flex;
		align-items: center;
		height: 30px;
		padding: 0 var(--space-3);
		border-radius: var(--radius-sm);
		color: var(--ink-2);
		font-size: var(--text-sm);
		white-space: nowrap;
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-out),
			color var(--dur-fast) var(--ease-out);
	}

	.segment input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.segment label:has(:checked) {
		background: var(--paper);
		box-shadow: 0 0 0 1px var(--line);
		color: var(--ink);
		font-weight: var(--weight-medium);
	}

	.segment label:has(:focus-visible) {
		box-shadow: var(--ring-focus);
	}

	.error {
		color: var(--ink);
		font-size: var(--text-sm);
	}

	.close {
		position: sticky;
		bottom: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--space-2);
		margin-top: var(--space-7);
		padding: var(--space-3) 0 var(--space-4);
		border-top: 1px solid var(--line);
		background: var(--paper);
	}

	.close .error {
		width: 100%;
	}

	.close :global(.btn) {
		flex: 1 1 100%;
	}

	@media (min-width: 768px) {
		.item {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: start;
			gap: var(--space-3);
			padding-bottom: 0;
		}

		.segment {
			margin-top: var(--space-1);
		}

		.close :global(.btn) {
			flex: none;
		}
	}
</style>
