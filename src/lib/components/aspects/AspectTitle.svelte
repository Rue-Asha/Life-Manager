<!--
	The display h1 of the aspect page. A long name is clamped (word-boundary cut, accent on the last whole short word) and "Show full title"
	opens it whole; the full name also stays in title="". Names with very long words hyphenate under lang="de".
-->
<script lang="ts">
	import { copy } from '../../copy';
	import Button from '../ui/Button.svelte';
	import { titleParts } from './title';

	let { name, userText = true }: { name: string; userText?: boolean } = $props();
	let open = $state(false);
	const t = $derived(titleParts(name, open ? Infinity : 44));
	const lang = $derived(/\S{20,}/.test(name) ? 'de' : 'en');
	const full = $derived(titleParts(name).cut);
	const uid = $props.id();
</script>

<div class="long-title">
	<h1 id="{uid}-t" data-user={userText ? '' : undefined} class:open class:whole-word={t.cut && !t.lead} {lang} title={name}>{#if t.lead}{t.lead}{#if t.accent}{' '}{/if}{/if}{#if t.accent}<em class="accent-word">{t.accent}</em>{/if}{t.tail}</h1>
	{#if full}<Button variant="quiet" size="s" aria-expanded={open} aria-controls="{uid}-t" onclick={() => (open = !open)}>{open ? copy.aspects.showLess : copy.aspects.showFullTitle}</Button>{/if}
</div>

<style>
	.long-title {
		display: grid;
		justify-items: start;
		gap: var(--space-1);
		min-inline-size: 0;
		max-inline-size: 100%;
	}
	.long-title > :global(.btn) {
		margin-inline-start: calc(-1 * var(--space-3));
	}
	.long-title > h1 {
		max-inline-size: 100%;
		overflow-wrap: anywhere;
	}
	.long-title > h1.open {
		display: block;
		-webkit-line-clamp: unset;
		line-clamp: unset;
		overflow: visible;
	}
	/* a lone compound clamped at three lines breaks between letters, so the clamp's ellipsis never follows a hyphen ("-…") */
	.long-title > h1.whole-word:not(.open) {
		hyphens: manual;
	}
</style>
