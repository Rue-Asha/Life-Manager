<!--
	A class todo's revised date in its meta line: ClassTag, "Not revised" / "Revised today" / "Revised 3 days ago", then "Mark revised today" (hidden once
	revised today) and "Clear" (once revised). Posts to the class page's `revised` action; an empty date clears it. Without controls (`readonly`, an
	archived class) only the type and the date are shown.
-->
<script lang="ts">
	import { copy } from '$lib/copy';
	import type { Snippet } from 'svelte';
	import { enhance, type SubmitFunction } from '$app/forms';
	import { revisedLabel } from '$lib/uni';
	import type { IsoDate, Todo } from '$lib/types';
	import Button from '../button/Button.svelte';
	import Icon from '../shell/Icon.svelte';
	import ClassTag from './ClassTag.svelte';

	let { todo, today, readonly = false, due }: { todo: Todo; today: IsoDate; readonly?: boolean; due?: Snippet } = $props();

	const revisedToday = $derived(todo.revisedAt === today);
	const submit: SubmitFunction = () => async ({ update }) => update({ reset: false });
</script>

{#if todo.type}<ClassTag type={todo.type} />{/if}
<span>{revisedLabel(todo.revisedAt, today)}</span>
{@render due?.()}
{#if !readonly}
	<span class="rev">
		{#if !revisedToday}
			<form method="POST" action="?/revised" use:enhance={submit}>
				<input type="hidden" name="todoId" value={todo.id} />
				<input type="hidden" name="date" value={today} />
				<Button size="s" type="submit" label={copy.revised.actionFor(todo.title)}><Icon name="check" size={16} />{copy.revised.action}</Button>
			</form>
		{/if}
		{#if todo.revisedAt}
			<form method="POST" action="?/revised" use:enhance={submit}>
				<input type="hidden" name="todoId" value={todo.id} />
				<input type="hidden" name="date" value="" />
				<Button variant="quiet" size="s" type="submit" label={copy.revised.clearFor(todo.title)}><Icon name="close" size={16} />{copy.revised.clear}</Button>
			</form>
		{/if}
	</span>
{/if}

<style>
	.rev {
		display: flex;
		flex-basis: 100%;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: center;
		margin-block-start: var(--space-1-5);
	}
	form {
		display: contents;
	}
</style>
