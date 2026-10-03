<script lang="ts">
	import AspectIcon from '$lib/components/ui/AspectIcon.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import QuickAdd from '$lib/components/todo/QuickAdd.svelte';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';

	let { data } = $props();

	let adding = $state(false);

	const groups = $derived(
		data.aspects
			.map((aspect) => ({ aspect, todos: data.todos.filter((t) => t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0)
	);
</script>

<svelte:head>
	<title>Backlog · Life Manager</title>
</svelte:head>

<PageHeader title="Backlog" icon="inbox" />

{#if data.phase === 'review-required'}
	<p class="review" data-testid="review-note">
		This week’s sprint is over, so nothing can join it. <a href="/sprint/review">Review the sprint</a>
	</p>
{/if}

<div class="quick">
	<QuickAdd
		aspects={data.aspects}
		target={{ kind: 'backlog' }}
		defaultAspectId={data.aspectId ?? undefined}
		bind:open={adding}
	/>
</div>

{#if data.aspects.length > 1}
	<nav class="filter" aria-label="Filter by aspect">
		<a href="/backlog" aria-current={data.aspectId === null}>All</a>
		{#each data.aspects as aspect (aspect.id)}
			<a href="/backlog?aspect={aspect.id}" aria-current={data.aspectId === aspect.id}>
				<AspectIcon icon={aspect.icon} color={aspect.color} size="sm" />{aspect.name}
			</a>
		{/each}
	</nav>
{/if}

{#if groups.length === 0}
	{@const filtered = data.aspects.find((a) => a.id === data.aspectId)}
	<p class="empty" data-testid="empty-state">
		{filtered ? `Nothing for ${filtered.name} in the backlog.` : 'Your backlog is empty.'}
		<button type="button" onclick={() => (adding = true)}>Add a todo</button>
		{filtered ? 'to it.' : 'to start planning.'}
	</p>
{/if}

{#each groups as { aspect, todos } (aspect.id)}
	<section class="group" data-testid="aspect-group-{aspect.id}" aria-labelledby="group-{aspect.id}">
		<h2 id="group-{aspect.id}">
			<AspectIcon icon={aspect.icon} color={aspect.color} />{aspect.name}
			<span class="count num">{todos.length}</span>
		</h2>
		<ul>
			{#each todos as todo (todo.id)}
				<TodoRow {todo} {aspect} today={data.today} context="backlog" sprintDays={data.sprintDays ?? undefined} />
			{/each}
		</ul>
	</section>
{/each}

<style>
	.quick {
		margin-bottom: var(--space-5);
	}

	.review {
		margin-bottom: var(--space-5);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
		color: var(--ink-2);
		font-size: var(--text-sm);
	}

	.review a {
		color: var(--accent);
		font-weight: var(--weight-medium);
		text-decoration: none;
	}

	.review a:hover {
		text-decoration: underline;
	}

	.filter {
		display: flex;
		gap: var(--space-2);
		margin: 0 calc(-1 * var(--gutter)) var(--space-7);
		padding: 0 var(--gutter);
		overflow-x: auto;
		scrollbar-width: none;
	}

	.filter a {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: var(--space-1);
		height: 30px;
		padding: 0 var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		color: var(--ink-2);
		font-size: var(--text-sm);
		text-decoration: none;
	}

	.filter a:has(:global(svg)) {
		padding-left: var(--space-2);
	}

	.filter a:hover {
		color: var(--ink);
	}

	.filter a[aria-current='true'] {
		border-color: var(--ink);
		background: var(--ink);
		color: var(--paper);
	}

	.empty {
		padding: var(--space-8) var(--space-4);
		color: var(--ink-3);
		text-align: center;
	}

	.empty button {
		padding: 0;
		border: 0;
		background: none;
		color: var(--accent);
		font-weight: var(--weight-medium);
		cursor: pointer;
	}

	.empty button:hover {
		text-decoration: underline;
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

	.count {
		margin-left: auto;
		color: var(--ink-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
