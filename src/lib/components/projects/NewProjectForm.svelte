<script lang="ts">
	import { enhance } from '$app/forms';
	import { PROJECT_MESSAGES } from '$lib/projects';
	import Button from '../ui/Button.svelte';

	let { oncancel, onsaved }: { oncancel: () => void; onsaved: () => void } = $props();

	const id = $props.id();
	let failure = $state<{ error: string; field?: string } | null>(null);
	const fieldError = (field: string) => (failure?.field === field ? failure : null);
	const describe = (field: string) => (fieldError(field) ? `${id}-${field}-error` : undefined);
</script>

<form
	method="POST"
	action="?/create"
	novalidate
	use:enhance={() =>
		async ({ result, update }) => {
			if (result.type === 'failure') {
				failure = result.data as { error: string; field?: string };
				return;
			}
			onsaved();
			await update();
		}}
>
	<div class="field">
		<label for="{id}-name">Name</label>
		<input
			id="{id}-name"
			name="name"
			autocomplete="off"
			aria-invalid={fieldError('name') ? true : undefined}
			aria-describedby={describe('name')}
		/>
		{#if fieldError('name')}
			<p class="error" id="{id}-name-error" role="alert">{PROJECT_MESSAGES[failure!.error] ?? failure!.error}</p>
		{/if}
	</div>
	<div class="field">
		<label for="{id}-description">Description</label>
		<input id="{id}-description" name="description" placeholder="One line about it" autocomplete="off" />
	</div>
	<div class="field">
		<label for="{id}-repo">Repository URL</label>
		<input
			id="{id}-repo"
			name="repoUrl"
			placeholder="https://github.com/…"
			autocomplete="off"
			aria-invalid={fieldError('repoUrl') ? true : undefined}
			aria-describedby={describe('repoUrl')}
		/>
		{#if fieldError('repoUrl')}
			<p class="error" id="{id}-repoUrl-error" role="alert">{PROJECT_MESSAGES[failure!.error] ?? failure!.error}</p>
		{/if}
	</div>
	<div class="field">
		<label for="{id}-tags">Tags</label>
		<input id="{id}-tags" name="tags" placeholder="SvelteKit, SQLite" autocomplete="off" />
		<p class="hint">Separate with commas.</p>
	</div>
	<footer>
		<Button type="button" variant="quiet" onclick={oncancel}>Cancel</Button>
		<Button type="submit" variant="primary">Add project</Button>
	</footer>
</form>

<style>
	form {
		display: grid;
		gap: var(--space-3);
		margin-bottom: var(--space-6);
		padding: var(--space-5);
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
	}

	.field {
		display: grid;
		gap: var(--space-1);
	}

	label {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--ink-2);
	}

	input {
		min-height: var(--control-height);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--paper);
	}

	input::placeholder {
		color: var(--ink-3);
	}

	input[aria-invalid='true'] {
		border-color: var(--ink);
		box-shadow: inset 0 0 0 1px var(--ink);
	}

	.error,
	.hint {
		margin: 0;
		font-size: var(--text-sm);
	}

	.error {
		color: var(--ink);
	}

	.hint {
		color: var(--ink-2);
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}
</style>
