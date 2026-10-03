<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '../ui/Button.svelte';
	import { GLYPHS } from './glyphs';

	let { html, notes }: { html: string; notes: string } = $props();

	let editing = $state(false);
	const uid = $props.id();
</script>

<section data-testid="project-notes" aria-labelledby="{uid}-h">
	<div class="head">
		<h2 id="{uid}-h">Notes</h2>
		{#if !editing}
			<button type="button" class="edit" aria-label="Edit notes" onclick={() => (editing = true)}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS.pen} /></svg>Edit
			</button>
		{/if}
	</div>

	{#if editing}
		<form
			method="POST"
			action="?/notes"
			use:enhance={() =>
				async ({ result, update }) => {
					// A reset would put the old text back into the textarea before it unmounts.
					await update({ reset: false });
					if (result.type === 'success') editing = false;
				}}
		>
			<label class="visually-hidden" for="{uid}-notes">Notes</label>
			<!-- svelte-ignore a11y_autofocus -->
			<textarea id="{uid}-notes" name="notes" rows="12" value={notes} autofocus></textarea>
			<footer>
				<Button type="button" variant="quiet" onclick={() => (editing = false)}>Cancel</Button>
				<Button variant="primary">Save</Button>
			</footer>
		</form>
	{:else if html}
		<div class="notes">{@html html}</div>
	{:else}
		<p class="empty">
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS.pen} /></svg>
			No notes yet. Write down the plan, decisions or change requests.
		</p>
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
		margin-bottom: var(--space-3);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--line);
	}

	h2 {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
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

	.edit {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: 28px;
		padding: 0 var(--space-2);
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--ink-2);
		font-size: var(--text-sm);
		cursor: pointer;
	}

	.edit:hover {
		background: var(--paper-hover);
		color: var(--ink);
	}

	.notes {
		max-width: 62ch;
		line-height: 1.55;
		overflow-wrap: anywhere;
	}

	.notes :global(h1),
	.notes :global(h2),
	.notes :global(h3),
	.notes :global(h4) {
		margin: var(--space-5) 0 var(--space-1);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
	}

	.notes > :global(:first-child) {
		margin-top: 0;
	}

	.notes :global(p),
	.notes :global(ul),
	.notes :global(ol),
	.notes :global(pre),
	.notes :global(blockquote) {
		margin: 0 0 var(--space-3);
	}

	.notes :global(ul),
	.notes :global(ol) {
		padding-left: var(--space-5);
	}

	.notes :global(li) {
		margin-bottom: var(--space-1);
	}

	.notes :global(code) {
		padding: 1px 5px;
		border-radius: var(--radius-xs);
		background: var(--paper-sunk);
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 0.92em;
	}

	.notes :global(pre) {
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
		overflow-x: auto;
	}

	.notes :global(pre code) {
		padding: 0;
		background: none;
	}

	.notes :global(blockquote) {
		padding-left: var(--space-3);
		border-left: 2px solid var(--line-strong);
		color: var(--ink-2);
	}

	.notes :global(a) {
		color: var(--accent);
	}

	.empty {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
		color: var(--ink-3);
	}

	textarea {
		display: block;
		width: 100%;
		padding: var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--paper);
		line-height: 1.55;
		resize: vertical;
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		margin-top: var(--space-3);
	}
</style>
