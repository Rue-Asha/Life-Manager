<script lang="ts">
	import type { Aspect, AspectProgress, Id, Todo } from '$lib/types';

	let {
		backlog,
		testid = 'backlog-rail'
	}: {
		backlog: Todo[];
		aspects: Aspect[];
		progress?: Record<Id, AspectProgress>;
		canAdd: boolean;
		addAction: string;
		addLabel?: string;
		onreturn?: (id: Id) => void;
		testid?: string;
	} = $props();
</script>

<ul data-testid={testid}>
	{#each backlog as todo (todo.id)}
		<li>{todo.title}</li>
	{/each}
</ul>
