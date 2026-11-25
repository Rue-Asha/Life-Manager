<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { dropZone } from '$lib/dnd';
	import { arrive, flipOpts, leave } from '$lib/motion';
	import { copy } from '$lib/copy';
	import type { Aspect, Id, IsoDate, Placement, Status, Todo } from '$lib/types';
	import { pill } from '../shell/pill';
	import { STATUS_LABELS } from '../todo/StatusControl.svelte';
	import { submit } from '../todo/form';
	import Button from '../ui/Button.svelte';
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
		onadd?: (id: Id, placement: Placement) => void;
	} = $props();

	const STATUSES: Status[] = ['todo', 'doing', 'done'];
	const PLACEHOLDERS: Record<Status, string> = {
		todo: 'Nothing left to start',
		doing: 'Nothing in progress',
		done: 'Nothing done yet'
	};

	const aspectOf = (todo: Todo) => aspects.find((a) => a.id === todo.aspectId)!;

	// A dropped card sits in its new column while the move saves, instead of springing back.
	let moved = $state<{ id: Id; status: Status } | null>(null);
	let moveForm = $state<HTMLFormElement>();
	const statusOf = (todo: Todo) => (moved?.id === todo.id ? moved.status : todo.status);

	// Below 768 px one column is shown at a time.
	let shown = $state<Status>('todo');

	async function drop(id: Id, status: Status) {
		if (todos.find((t) => t.id === id)?.status === status) return;
		moved = { id, status };
		await tick();
		moveForm?.requestSubmit();
	}

	const settle = () => (moved = null);
</script>

<form
	bind:this={moveForm}
	method="POST"
	action="/todos?/setStatus"
	hidden
	use:enhance={submit({ onsuccess: settle, onerror: settle })}
>
	<input type="hidden" name="id" value={moved?.id} />
	<input type="hidden" name="status" value={moved?.status} />
</form>

<section class="card hs-board">
	<div class="hs-colswitch" role="group" aria-label="Column">
		<ul data-pill use:pill>
			{#each STATUSES as status (status)}
				<li>
					<Button variant="quiet" size="s" type="button" data-press aria-pressed={shown === status} onclick={() => (shown = status)}>
						{STATUS_LABELS[status]}<span class="hs-count">{todos.filter((t) => statusOf(t) === status).length}</span>
					</Button>
				</li>
			{/each}
		</ul>
	</div>
	<div class="hs-cols">
		{#each STATUSES as status (status)}
			{@const cards = todos.filter((t) => statusOf(t) === status)}
			<section
				class="hs-col"
				data-col={status}
				data-show={shown === status ? '' : undefined}
				use:dropZone={{
					accepts: (p) => p.from === 'sprint' || !!onadd,
					ondrop: (p) => (p.from === 'sprint' ? drop(p.id, status) : onadd?.(p.id, { status }))
				}}
				aria-labelledby="column-{status}"
			>
				<header class="hs-col-head"><h2 id="column-{status}">{STATUS_LABELS[status]}</h2><span class="hs-col-n">{cards.length}</span></header>
				<div class="hs-col-body">
					{#each cards as todo (todo.id)}
						<div in:arrive={{ key: todo.id }} out:leave={{ key: todo.id }} animate:flip={flipOpts()}>
							<SprintCard {todo} aspect={aspectOf(todo)} {today} {sprintDays} variant="card" />
						</div>
					{:else}
						<p class="hs-col-empty">{PLACEHOLDERS[status]}</p>
					{/each}
					<p class="hs-dropnote" aria-hidden="true">{copy.sprintViews.dropToStatus(STATUS_LABELS[status])}</p>
				</div>
			</section>
		{/each}
	</div>
</section>
