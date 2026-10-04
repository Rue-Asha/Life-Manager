<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { UI_ICONS } from '../ui/icons';
	import { revisedLabel } from '$lib/uni';
	import type { IsoDate, Todo } from '$lib/types';

	// Posts to the class page's `revised` action; an empty date clears it.
	let { todo, today, readonly = false }: { todo: Todo; today: IsoDate; readonly?: boolean } = $props();

	// Lucide "history" (ISC licence, https://lucide.dev).
	const HISTORY = 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5 M12 7v5l4 2';

	const revisedToday = $derived(todo.revisedAt === today);
	const submit: SubmitFunction = () => async ({ update }) => update({ reset: false });
</script>

<span class="rev" class:today={revisedToday} data-testid="revised">
	{#if todo.revisedAt}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={revisedToday ? UI_ICONS.check : HISTORY} /></svg>
	{/if}{revisedLabel(todo.revisedAt, today)}
</span>
{#if !readonly}
	{#if !revisedToday}
		<form method="POST" action="?/revised" use:enhance={submit}>
			<input type="hidden" name="todoId" value={todo.id} />
			<input type="hidden" name="date" value={today} />
			<button class="mark" aria-label="Revised today: {todo.title}">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={HISTORY} /></svg>Revised today
			</button>
		</form>
	{/if}
	{#if todo.revisedAt}
		<form method="POST" action="?/revised" use:enhance={submit}>
			<input type="hidden" name="todoId" value={todo.id} />
			<input type="hidden" name="date" value="" />
			<button class="clear" aria-label="Clear revised date: {todo.title}" title="Clear revised date">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.x} /></svg>
			</button>
		</form>
	{/if}
{/if}

<style>
	form {
		display: contents;
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

	.rev {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	.rev.today {
		color: var(--accent);
		font-weight: var(--weight-medium);
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: 24px;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--paper);
		color: var(--ink-2);
		font-size: var(--text-sm);
		cursor: pointer;
	}

	button:hover {
		background: var(--paper-hover);
		color: var(--ink);
	}

	.mark {
		padding: 0 var(--space-2);
	}

	.clear {
		justify-content: center;
		width: 24px;
		padding: 0;
		border-color: transparent;
		background: none;
	}
</style>
