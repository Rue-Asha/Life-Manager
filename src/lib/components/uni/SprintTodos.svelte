<script lang="ts" module>
	import { dateLabel, daysFrom } from '../todo/format';
	import type { IsoDate } from '$lib/types';

	// "Yesterday", "Today", "Tomorrow", else "Fri 9 Oct"; shared with the class card's next due date.
	export function dueText(date: IsoDate, today: IsoDate): string {
		const n = daysFrom(today, date);
		if (n === -1) return 'Yesterday';
		if (n === 0) return 'Today';
		if (n === 1) return 'Tomorrow';
		return dateLabel(date);
	}
</script>

<script lang="ts">
	import type { ClassRef, SprintClassTodo } from '$lib/types';
	import { clampPage, pageCount, PAGE_SIZE } from '$lib/uni';
	import Button from '../ui/Button.svelte';
	import ClassBadge from './ClassBadge.svelte';

	let { todos, classes, today }: { todos: SprintClassTodo[]; classes: ClassRef[]; today: IsoDate } = $props();

	const refs = $derived(new Map(classes.map((c) => [c.id, c])));

	let requested = $state(1);
	// Deriving through the clamp keeps the page in range when the list shrinks.
	const page = $derived(clampPage(requested, todos.length));
	const pages = $derived(pageCount(todos.length));
	const shown = $derived(todos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
</script>

<section class="sprint-todos" data-testid="sprint-todos" aria-labelledby="sprint-todos-title">
	<h2 id="sprint-todos-title">
		This week{#if todos.length}<span class="count num" data-testid="sprint-todos-count">{todos.length}</span>{/if}
	</h2>
	{#if todos.length === 0}
		<p class="empty" data-testid="sprint-todos-empty">Nothing in this week's sprint</p>
	{:else}
		<ul>
			{#each shown as t (t.id)}
				{@const ref = refs.get(t.classId)}
				{@const late = t.dueDate !== null && t.dueDate < today}
				<li data-testid="sprint-todo-row" data-type={t.type ?? 'OTH'}>
					<div class="main">
						<span class="title">{t.title}</span>
						{#if ref}<span class="meta"><ClassBadge classRef={ref} type={t.type} /></span>{/if}
					</div>
					{#if t.dueDate}
						<div class="date num" class:late>
							{dueText(t.dueDate, today)}
							{#if late}<small>Overdue</small>{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
		{#if pages > 1}
			<div class="pager" data-testid="sprint-pager">
				<Button type="button" data-testid="sprint-prev" disabled={page === 1} onclick={() => (requested = page - 1)}>Previous</Button>
				<span class="num" data-testid="sprint-page">Page {page} of {pages}</span>
				<Button type="button" data-testid="sprint-next" disabled={page === pages} onclick={() => (requested = page + 1)}>Next</Button>
			</div>
		{/if}
	{/if}
</section>

<style>
	h2 {
		display: flex;
		align-items: baseline;
		margin-bottom: var(--space-3);
		color: var(--ink-2);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}

	.count {
		margin-left: auto;
		color: var(--ink-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
	}

	ul {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		column-gap: var(--space-3);
		padding: 10px 14px;
		border: 1px solid var(--oth-line);
		border-radius: 12px;
		background: var(--oth-tint);
	}

	li[data-type='LEC'] {
		border-color: var(--lec-line);
		background: var(--lec-tint);
	}

	li[data-type='EXC'] {
		border-color: var(--exc-line);
		background: var(--exc-tint);
	}

	.main {
		min-width: 0;
	}

	.title {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: var(--leading-snug);
	}

	.meta {
		display: flex;
		min-width: 0;
		margin-top: var(--space-0);
	}

	.date {
		padding-top: 1px;
		color: var(--ink-2);
		font-size: var(--text-sm);
		text-align: right;
		white-space: nowrap;
	}

	.date.late {
		color: var(--overdue);
		font-weight: var(--weight-medium);
	}

	small {
		display: block;
		font-size: var(--text-xs);
		font-weight: var(--weight-regular);
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: var(--space-3);
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.empty {
		padding: var(--space-3) 0;
		color: var(--ink-3);
		font-size: var(--text-sm);
	}
</style>
