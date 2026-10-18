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
	<!-- The glyph shows the status; the native select lies over it, invisible, so it keeps the platform
	     menu on touch and the name "Status: Doing" for everyone else. -->
	<label class="glyph" data-status={status} title="Status: {STATUS_LABELS[status]}">
		<svg viewBox="0 0 16 16" aria-hidden="true">
			{#if status === 'done'}
				<circle cx="8" cy="8" r="7" class="fill" /><path d="m5 8.2 2 2 4-4.2" class="tick" />
			{:else}
				<circle cx="8" cy="8" r="6" class="ring" />
				{#if status === 'doing'}<path d="M8 4a4 4 0 0 1 0 8Z" class="fill" />{/if}
			{/if}
		</svg>
		<span class="visually-hidden">Status: {STATUS_LABELS[status]}</span>
		<select name="status" value={status} onchange={(e) => e.currentTarget.form?.requestSubmit()}>
			{#each Object.entries(STATUS_LABELS) as [value, label] (value)}
				<option {value}>{label}</option>
			{/each}
		</select>
	</label>
</form>

<style>
	.glyph {
		position: relative;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 6px;
		color: var(--ink-3);
	}

	.glyph:hover {
		background: var(--sunk);
		color: var(--ink-2);
	}

	.glyph:focus-within {
		box-shadow: var(--ring-focus);
	}

	[data-status='doing'] {
		color: var(--accent);
	}

	[data-status='done'] {
		color: var(--line-strong);
	}

	svg {
		width: 16px;
		height: 16px;
	}

	.ring {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
	}

	.fill {
		fill: currentColor;
	}

	.tick {
		fill: none;
		stroke: var(--surface);
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	select {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}
</style>
