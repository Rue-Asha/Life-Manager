<!--
	The four fields of New project and Edit details, on the Field primitive. The page puts them in a sheet; a failed save keeps what was
	typed (`values`) and draws the alert under the field it belongs to.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { copy } from '$lib/copy';
	import Field from '../field/Field.svelte';

	let {
		values,
		failure
	}: {
		values?: { name: string; description: string; repoUrl: string; tags: string };
		failure?: { error: string; field?: string } | null;
	} = $props();

	let name = $state(untrack(() => values?.name ?? ''));
	let description = $state(untrack(() => values?.description ?? ''));
	let repoUrl = $state(untrack(() => values?.repoUrl ?? ''));
	let tags = $state(untrack(() => values?.tags ?? ''));
	$effect(() => {
		name = values?.name ?? '';
		description = values?.description ?? '';
		repoUrl = values?.repoUrl ?? '';
		tags = values?.tags ?? '';
	});

	const error = (field: string) => (failure?.field === field ? (copy.projects.errors[failure.error] ?? failure.error) : undefined);
</script>

<div class="pj-form">
	<!-- svelte-ignore a11y_autofocus -->
	<Field label={copy.projects.name} name="name" autocomplete="off" autofocus data-user error={error('name')} bind:value={name} />
	<Field label={copy.projects.description} name="description" placeholder={copy.projects.descriptionHint} autocomplete="off" data-user bind:value={description} />
	<Field label={copy.projects.repo} name="repoUrl" inputmode="url" autocapitalize="none" autocorrect="off" placeholder={copy.projects.repoHint} autocomplete="off" data-user error={error('repoUrl')} bind:value={repoUrl} />
	<Field label={copy.projects.tags} name="tags" autocapitalize="none" placeholder={copy.projects.tagsHint} autocomplete="off" data-user hint={copy.projects.tagsNote} bind:value={tags} />
</div>
