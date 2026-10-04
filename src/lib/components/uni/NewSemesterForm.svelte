<script lang="ts">
	import { enhance } from '$app/forms';
	import { uniMessage } from '$lib/uni';
	import Button from '../ui/Button.svelte';

	let { oncancel, onsaved }: { oncancel: () => void; onsaved: () => void } = $props();

	const id = $props.id();
	let failure = $state<{ error: string; field?: string } | null>(null);
</script>

<form
	method="POST"
	action="?/createSemester"
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
		<label for="{id}-name">Semester name</label>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			id="{id}-name"
			name="name"
			placeholder="WS 26/27"
			autocomplete="off"
			autofocus
			aria-invalid={failure ? true : undefined}
			aria-describedby={failure ? `${id}-name-error` : undefined}
		/>
		{#if failure}
			<p class="error" id="{id}-name-error" role="alert">{uniMessage(failure.error, failure.field)}</p>
		{/if}
	</div>
	<footer>
		<Button type="button" variant="quiet" onclick={oncancel}>Cancel</Button>
		<Button type="submit" variant="primary">Add semester</Button>
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

	.error {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--ink);
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
	}
</style>
