<script lang="ts">
	import { flip } from 'svelte/animate';
	import { dropZone } from '$lib/dnd';
	import { copy } from '$lib/copy';
	import { flipOpts, receive, send } from '$lib/motion';
	import type { Aspect, Id, IsoDate, Todo } from '$lib/types';
	import Icon from '../shell/Icon.svelte';
	import EmptyState from '../ui/EmptyState.svelte';
	import SprintCard from './SprintCard.svelte';

	let {
		todos,
		aspects,
		today,
		sprintDays,
		onadd
	}: {
		todos: Todo[];
		aspects: Aspect[];
		today: IsoDate;
		sprintDays: IsoDate[];
		onadd?: (id: Id) => void;
	} = $props();

	const groups = $derived(
		aspects
			.map((aspect) => ({ aspect, todos: todos.filter((t) => t.aspectId === aspect.id) }))
			.filter((g) => g.todos.length > 0)
	);
</script>

<div
	class="hs-groups"
	role="group"
	aria-label="Sprint todos"
	use:dropZone={{ accepts: (p) => !!onadd && p.from === 'backlog', ondrop: (p) => onadd?.(p.id) }}
>
	{#each groups as { aspect, todos } (aspect.id)}
		{@const done = todos.filter((t) => t.status === 'done').length}
		<section class="card hs-group" aria-labelledby="group-{aspect.id}">
			<div class="hs-group-head">
				<span class="nav-tile" data-color={aspect.color} aria-hidden="true"><Icon aspect={aspect.icon} size={16} /></span>
				<h2 id="group-{aspect.id}" data-user>{aspect.name}</h2>
				<span class="hs-count"><span class="sr-only">Done </span>{done} / {todos.length}</span>
			</div>
			<div class="hs-list">
				<!-- Global: the first todo of an aspect arrives with its group and should still travel in. -->
				{#each todos as todo (todo.id)}
					<div in:receive|global={{ key: todo.id }} out:send|global={{ key: todo.id }} animate:flip={flipOpts()}>
						<SprintCard {todo} {aspect} {today} {sprintDays} variant="row" named={false} />
					</div>
				{/each}
			</div>
		</section>
	{:else}
		<EmptyState title={copy.empty.sprint.heading} body={copy.empty.sprint.body} href="/backlog" actionLabel={copy.openBacklog} />
	{/each}
	<p class="hs-dropnote" aria-hidden="true">{copy.sprintViews.dropToSprint}</p>
</div>
