<!-- "New semester" on the sheet: one name field; an empty name says "Give it a name." and keeps the sheet open. -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { uniMessage } from '$lib/uni';
	import Button from '../button/Button.svelte';
	import Field from '../field/Field.svelte';
	import Sheet from '../ui/Sheet.svelte';

	let { open, onclose }: { open: boolean; onclose: () => void } = $props();

	const FORM = $props.id();
	let name = $state('');
	let failure = $state<{ error: string; field?: string } | null>(null);

	$effect(() => {
		if (open) {
			name = '';
			failure = null;
		}
	});
</script>

{#snippet foot()}
	<Button onclick={onclose}>Cancel</Button>
	<Button variant="primary" type="submit" form={FORM}>Add semester</Button>
{/snippet}

<Sheet {open} title="New semester" {onclose} actions={foot}>
	{#if open}
		<form
			id={FORM}
			method="POST"
			action="?/createSemester"
			aria-label="New semester"
			novalidate
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'failure') {
						failure = result.data as { error: string; field?: string };
						return;
					}
					await update();
					onclose();
				}}
		>
			<Field label="Semester name" name="name" placeholder="WS 26/27" autocomplete="off" autofocus data-user error={failure ? uniMessage(failure.error, failure.field) : undefined} bind:value={name} />
		</form>
	{/if}
</Sheet>
