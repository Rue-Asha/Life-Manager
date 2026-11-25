<!--
	"This week": the open class todos in the active sprint, six to a page. Each row shows the title, the class name, the type tag (letters, glyph and
	fill; an untyped todo reads OTH) and the due text; an overdue row says "Overdue · <date>" in the danger colour. Rows are not tinted and not links.
-->
<script lang="ts">
	import type { ClassRef, IsoDate, SprintClassTodo } from '$lib/types';
	import { clampPage, pageCount, PAGE_SIZE } from '$lib/uni';
	import Button from '../button/Button.svelte';
	import ClassTag from './ClassTag.svelte';
	import { weekDueText } from './format';
	import './uni.css';

	let { todos, classes, today }: { todos: SprintClassTodo[]; classes: ClassRef[]; today: IsoDate } = $props();

	const refs = $derived(new Map(classes.map((c) => [c.id, c])));
	let requested = $state(1);
	// Deriving through the clamp keeps the page in range when the list shrinks.
	const page = $derived(clampPage(requested, todos.length));
	const pages = $derived(pageCount(todos.length));
	const shown = $derived(todos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
</script>

<section class="card u-panel" aria-labelledby="uni-week">
	<div class="card-head"><h2 id="uni-week">This week</h2>{#if todos.length}<span class="card-note">{todos.length}</span>{/if}</div>
	{#if todos.length === 0}
		<p class="u-note">Nothing in this week's sprint</p>
	{:else}
		<ul class="u-rows">
			{#each shown as t (t.id)}
				{@const ref = refs.get(t.classId)}
				{@const due = t.dueDate ? weekDueText(t.dueDate, today) : null}
				<li class="u-row static" aria-label={t.title}>
					<div class="main">
						<span class="text">
							<span class="title u-clamp2" data-user>{t.title}</span>
							<span class="facts meta">
								{#if ref}<span class="u-clamp2" data-user>{ref.name}</span>{/if}
								<ClassTag type={t.type ?? 'OTH'} />
								{#if due}<span class:u-late={due.late}>{due.text}</span>{/if}
							</span>
						</span>
					</div>
				</li>
			{/each}
		</ul>
		{#if pages > 1}
			<div class="u-cluster end" role="group" aria-label="Pages">
				<Button size="s" disabled={page === 1} onclick={() => (requested = page - 1)}>Previous</Button>
				<span class="u-note">Page {page} of {pages}</span>
				<Button size="s" disabled={page === pages} onclick={() => (requested = page + 1)}>Next</Button>
			</div>
		{/if}
	{/if}
</section>
