<!--
	Notes with "Edit notes": the rendered Markdown swaps for a raw Markdown field that takes focus. Rendered notes are what Rue wrote:
	selectable, wrapped, never truncated; collapsed they clip at a fixed height with a fade behind "Show more", and every line stays in the
	page. Posts to the page's `notes` action; `bare` draws it without its own card (inside the side panel). Without `editable` (an
	archived class) there is no edit control. Shared by the Project, Uni and Class pages.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { copy } from '$lib/copy';
	import Field from '../field/Field.svelte';
	import Button from './Button.svelte';

	let {
		id,
		html,
		text,
		empty,
		editable = true,
		bare = false
	}: { id?: string; html: string; text: string; empty: string; editable?: boolean; bare?: boolean } = $props();

	const uid = $props.id();
	const hid = $derived(id ? `${id}-h` : `${uid}-h`);
	let editing = $state(false);
	let draft = $state('');
	let clip = $state<HTMLElement>();
	let more = $state(false);
	let over = $state(false);

	$effect(() => {
		html;
		editing;
		more;
		if (clip && !more) over = clip.scrollHeight > clip.clientHeight + 1;
	});

	async function edit() {
		draft = text;
		editing = true;
		await tick();
		document.getElementById(`${uid}-t`)?.focus({ preventScroll: true });
	}
</script>

<section class={bare ? 'notes-bare' : 'card notes-card'} aria-labelledby={hid}>
	<div class="card-head">
		<svelte:element this={bare ? 'h3' : 'h2'} id={hid} class:sub={bare}>{copy.notes.title}</svelte:element>
		{#if editable && !editing}<Button size="s" type="button" onclick={edit}>{copy.notes.edit}</Button>{/if}
	</div>
	{#if editing}
		<form
			method="POST"
			action="?/notes"
			class="stack"
			aria-label={copy.notes.edit}
			use:enhance={() =>
				async ({ result, update }) => {
					// A reset would put the old text back into the field before it unmounts.
					await update({ reset: false });
					if (result.type === 'success') editing = false;
				}}
		>
			<Field label={copy.notes.field} id="{uid}-t" name="notes" multiline rows={12} data-user bind:value={draft} />
			<div class="tail">
				<Button variant="primary" type="submit">{copy.notes.save}</Button>
				<Button type="button" onclick={() => (editing = false)}>{copy.notes.cancel}</Button>
			</div>
		</form>
	{:else}
		<div class="clip" class:capped={!more} class:fade={over && !more} id="{uid}-c" bind:this={clip}>
			{#if html}
				<div class="rendered" role="group" aria-label={copy.notes.rendered} data-user>{@html html}</div>
			{:else}
				<p class="empty">{empty}</p>
			{/if}
		</div>
		{#if over || more}
			<div class="more"><Button variant="quiet" size="s" type="button" aria-expanded={more} aria-controls="{uid}-c" onclick={() => (more = !more)}>{more ? copy.notes.showLess : copy.notes.showMore}</Button></div>
		{/if}
	{/if}
</section>

<style>
	.notes-card {
		display: grid;
		gap: var(--space-4);
		align-content: start;
		padding: var(--space-5);
		min-inline-size: 0;
	}
	.notes-bare,
	.stack {
		display: grid;
		gap: var(--space-2);
		min-inline-size: 0;
	}
	.notes-card > :global(.card-head) {
		align-items: center;
	}
	.sub {
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
	}
	.tail {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		justify-content: flex-start;
	}
	.clip {
		min-inline-size: 0;
	}
	.capped {
		max-block-size: 16rem;
		overflow: hidden;
	}
	.fade {
		-webkit-mask-image: linear-gradient(var(--ink) calc(100% - var(--space-12)), transparent);
		mask-image: linear-gradient(var(--ink) calc(100% - var(--space-12)), transparent);
	}
	.empty {
		margin: 0;
		color: var(--ink-secondary);
		overflow-wrap: anywhere;
	}
	.more {
		justify-self: start;
	}
	.rendered {
		display: grid;
		gap: var(--space-3);
		min-inline-size: 0;
		max-inline-size: var(--measure);
		font-size: var(--type-body-size);
		line-height: var(--type-body-line);
		overflow-wrap: anywhere;
	}
	.rendered :global(p),
	.rendered :global(ul),
	.rendered :global(ol),
	.rendered :global(blockquote),
	.rendered :global(pre) {
		margin: 0;
		font-size: var(--type-body-size);
		line-height: var(--type-body-line);
	}
	.rendered :global(h1),
	.rendered :global(h2),
	.rendered :global(h3),
	.rendered :global(h4) {
		margin: 0;
		font-family: var(--font-ui);
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
		font-weight: var(--weight-regular);
		overflow-wrap: anywhere;
	}
	.rendered :global(ul),
	.rendered :global(ol) {
		padding-inline-start: var(--space-5);
	}
	.rendered :global(a) {
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 0.25em;
		overflow-wrap: anywhere;
	}
	.rendered :global(pre) {
		overflow-x: auto;
		padding: var(--space-3);
		border-radius: var(--radius-panel);
		background: var(--surface-sunken);
		font-family: var(--font-mono);
		font-size: var(--type-body-s-size);
	}
	.rendered :global(code) {
		font-family: var(--font-mono);
		font-size: var(--type-body-s-size);
	}
</style>
