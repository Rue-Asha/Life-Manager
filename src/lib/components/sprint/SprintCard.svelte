<script lang="ts">
	import type { Aspect, IsoDate, Todo } from '$lib/types';
	import TodoRow from '../todo/TodoRow.svelte';
	import AspectTag from '../ui/AspectTag.svelte';

	let {
		todo,
		aspect,
		today,
		sprintDays
	}: { todo: Todo; aspect: Aspect; today: IsoDate; sprintDays: IsoDate[] } = $props();
</script>

<div class="card">
	<ul><TodoRow {todo} {aspect} {today} context="sprint" {sprintDays} /></ul>
	<span class="tag"><AspectTag name={aspect.name} color={aspect.color} icon={aspect.icon} /></span>
</div>

<style>
	.card {
		padding: var(--space-1) var(--space-3) var(--space-3);
		border-radius: var(--radius-md);
		background: var(--paper);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tag {
		display: block;
		margin-top: var(--space-1);
	}

	/* The row opened into its editor card; the tag would hang below it. */
	.card:has(:global(.expanded)) .tag {
		display: none;
	}
</style>
