<!--
	"Delete <name>?" on the confirm pattern. An aspect with todos or rules asks where they go: the count in the message and on the confirm is
	the todo count the row shows, the recurring rules get their own sentence, and no receiver is preselected. An empty aspect has no target.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { copy } from '../../copy';
	import type { Aspect } from '../../types';
	import Select from '../select/Select.svelte';
	import ConfirmDialog from '../ui/ConfirmDialog.svelte';

	let {
		aspect,
		usage,
		targets,
		onclose
	}: {
		aspect: Aspect | null;
		usage: { todos: number; rules: number };
		targets: Aspect[];
		onclose: () => void;
	} = $props();

	const ERRORS = copy.aspects.errors;

	let form = $state<HTMLFormElement>();
	let error = $state<string>();
	let target = $state('');

	const used = $derived(usage.todos + usage.rules > 0);
	$effect(() => {
		if (aspect) {
			target = '';
			error = undefined;
		}
	});

	const ruleNote = $derived(usage.rules > 0 && usage.todos > 0 ? copy.aspects.rulesMove(usage.rules) : '');
	const message = $derived.by(() => {
		if (!aspect) return '';
		if (!used) return copy.aspects.noUsage(aspect.name);
		if (usage.todos === 0) return copy.aspects.rulesOnly(aspect.name, usage.rules);
		return copy.aspects.todos(aspect.name, usage.todos) + ruleNote;
	});
	const confirmLabel = $derived(!used ? copy.aspects.deleteEmpty : usage.todos > 0 ? copy.aspects.moveAndDelete(usage.todos) : copy.aspects.moveRulesAndDelete(usage.rules));
</script>

<ConfirmDialog open={aspect !== null} title={aspect ? copy.aspects.deleteTitle(aspect.name) : ''} {message} {confirmLabel} onconfirm={() => form?.requestSubmit()} oncancel={onclose}>
	{#if aspect}
		<form
			bind:this={form}
			method="POST"
			action="?/delete"
			use:enhance={({ cancel }) => {
				error = undefined;
				if (used && !target) {
					error = 'target-required';
					return cancel();
				}
				return async ({ result, update }) => {
					if (result.type === 'failure') {
						error = String(result.data?.error);
						return;
					}
					await update({ reset: false });
					onclose();
				};
			}}
		>
			<input type="hidden" name="id" value={aspect.id} />
			{#if used}
				<Select label={copy.aspects.moveTo} name="targetId" placeholder={copy.aspects.chooseAspect} bind:value={target} error={error ? (ERRORS[error] ?? error) : undefined}>
					{#each targets as t (t.id)}
						<option value={String(t.id)}>{t.name}</option>
					{/each}
				</Select>
			{:else if error}
				<p class="error" role="alert">{ERRORS[error] ?? error}</p>
			{/if}
		</form>
	{/if}
</ConfirmDialog>

<style>
	.error {
		margin: 0;
		color: var(--danger);
		font-size: var(--type-body-s-size);
	}
</style>
