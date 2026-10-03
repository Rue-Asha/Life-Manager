<script lang="ts">
	import { enhance } from '$app/forms';
	import { ASPECT_COLORS } from '../../aspect-style';
	import type { Aspect } from '../../types';
	import AspectIcon from '../ui/AspectIcon.svelte';
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

	const ERRORS: Record<string, string> = {
		'only-aspect-in-use': 'It is your only aspect and still has todos or rules.',
		'target-required': 'Pick the aspect that receives them.',
		'not-found': 'That aspect no longer exists.'
	};

	let form = $state<HTMLFormElement>();
	let error = $state<string>();

	const moved = $derived(usage.todos + usage.rules);

	function plural(n: number, word: string) {
		return `${n} ${word}${n === 1 ? '' : 's'}`;
	}

	const message = $derived.by(() => {
		if (!aspect) return '';
		if (moved === 0) return `${aspect.name} has no todos or recurring rules.`;
		const parts = [usage.todos && plural(usage.todos, 'todo'), usage.rules && plural(usage.rules, 'recurring rule')];
		return `${aspect.name} has ${parts.filter(Boolean).join(' and ')}. Which aspect should they move to?`;
	});
</script>

<ConfirmDialog
	open={aspect !== null}
	title={aspect ? `Delete ${aspect.name}?` : ''}
	{message}
	confirmLabel={moved === 0 ? 'Delete aspect' : `Move ${moved} and delete`}
	onconfirm={() => form?.requestSubmit()}
	oncancel={onclose}
>
	{#if aspect}
		<form
			bind:this={form}
			method="POST"
			action="?/delete"
			use:enhance={() => {
				error = undefined;
				return async ({ result, update }) => {
					if (result.type === 'failure') {
						error = ERRORS[String(result.data?.error)];
						return;
					}
					await update({ reset: false });
					onclose();
				};
			}}
		>
			<input type="hidden" name="id" value={aspect.id} />
			{#if moved > 0}
				<fieldset>
					<legend class="visually-hidden">Move to</legend>
					{#each targets as target, i (target.id)}
						<label class="target">
							<span class="tile" style:background={ASPECT_COLORS[target.color].tint}>
								<AspectIcon icon={target.icon} color={target.color} size="sm" />
							</span>
							{target.name}
							<input type="radio" name="targetId" value={target.id} checked={i === 0} />
						</label>
					{/each}
				</fieldset>
			{/if}
			{#if error}<p class="error">{error}</p>{/if}
		</form>
	{/if}
</ConfirmDialog>

<style>
	fieldset {
		margin: var(--space-4) 0 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}

	.target {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: var(--row-height);
		padding: 0 var(--space-3);
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.target:hover {
		background: var(--paper-hover);
	}

	.target:has(:checked) {
		background: var(--paper-sunk);
		font-weight: var(--weight-medium);
	}

	.target:has(:focus-visible) {
		box-shadow: var(--ring-focus);
	}

	/* The radio covers the row, so the whole row is the tap target. */
	input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}

	.tile {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
	}

	.error {
		margin-top: var(--space-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}
</style>
