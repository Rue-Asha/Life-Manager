<script lang="ts" module>
	import type { Status } from '$lib/types';

	export const STATUS_LABELS: Record<Status, string> = { todo: 'To do', doing: 'Doing', done: 'Done' };
</script>

<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Id } from '$lib/types';
	import { submit } from './form';

	let { todoId, status }: { todoId: Id; status: Status } = $props();
</script>

<form method="POST" action="/todos?/setStatus" use:enhance={submit()}>
	<input type="hidden" name="id" value={todoId} />
	<label class="pill" data-status={status}>
		<i aria-hidden="true"></i>
		<span class="visually-hidden">Status</span>
		<select name="status" value={status} onchange={(e) => e.currentTarget.form?.requestSubmit()}>
			{#each Object.entries(STATUS_LABELS) as [value, label] (value)}
				<option {value}>{label}</option>
			{/each}
		</select>
	</label>
</form>

<style>
	.pill {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: 24px;
		padding: 0 var(--space-2);
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		color: var(--ink-2);
		font-size: var(--text-sm);
	}

	.pill:focus-within {
		box-shadow: var(--ring-focus);
	}

	/* The glyph reads like the checkbox it sits beside: empty ring, half, filled. */
	i {
		width: 9px;
		height: 9px;
		border: 1.5px solid currentColor;
		border-radius: var(--radius-pill);
	}

	[data-status='doing'] {
		background: var(--paper-sunk);
		border-color: var(--paper-sunk);
		color: var(--ink);
	}

	[data-status='doing'] i {
		background: linear-gradient(90deg, currentColor 50%, transparent 50%);
	}

	[data-status='done'] {
		color: var(--ink-3);
	}

	[data-status='done'] i {
		background: currentColor;
	}

	select {
		appearance: none;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font-size: inherit;
		cursor: pointer;
	}

	select:focus-visible {
		box-shadow: none;
	}
</style>
