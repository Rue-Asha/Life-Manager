<!--
	Class page: the breadcrumb, the class title with its actions menu, the open / planned / done counts as the key-facts card (from 768 px), then in the
	main column the Details card, the notes and the class todos (Open, Planned, a collapsed Done) with their type and revised date; the class's
	recurring rules sit in the "Recurring" panel (a right column from 1280 px, a card below the main column under it). A class of an archived
	semester is read-only; only Delete stays.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { flip } from 'svelte/animate';
	import { copy } from '$lib/copy';
	import AspectTitle from '$lib/components/aspects/AspectTitle.svelte';
	import Button from '$lib/components/button/Button.svelte';
	import Field from '$lib/components/field/Field.svelte';
	import type { MenuItem } from '$lib/components/menu/Menu.svelte';
	import PopMenu from '$lib/components/menu/PopMenu.svelte';
	import Icon from '$lib/components/shell/Icon.svelte';
	import TodoRow from '$lib/components/todo/TodoRow.svelte';
	import { planError, submit, type ActionError } from '$lib/components/todo/form';
	import { dateLabel } from '$lib/components/todo/format';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import ClassForm from '$lib/components/uni/ClassForm.svelte';
	import ClassRules from '$lib/components/uni/ClassRules.svelte';
	import ClassTag from '$lib/components/uni/ClassTag.svelte';
	import Disclosure from '$lib/components/ui/Disclosure.svelte';
	import NotesCard from '$lib/components/ui/NotesCard.svelte';
	import RevisedControl from '$lib/components/uni/RevisedControl.svelte';
	import { plural } from '$lib/components/uni/format';
	import '$lib/components/uni/uni.css';
	import { arrive, flipOpts, leave } from '$lib/motion';
	import { examCountdown } from '$lib/uni';
	import type { Todo } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cls = $derived(data.cls);
	const archived = $derived(cls.semester.archivedAt !== null);
	const uid = $props.id();

	let editing = $state(false);
	let deleting = $state(false);
	let showDone = $state(false);
	let deleteForm = $state<HTMLFormElement>();
	let error = $state<{ error: string; field?: string; fields?: Record<string, string> }>();

	const examDay = $derived(cls.examAt?.slice(0, 10) ?? null);
	const examTime = $derived(cls.examAt?.slice(11, 16) ?? '');
	const countdown = $derived(examCountdown(cls.examAt, data.today)?.replace(/^Exam /, '') ?? null);
	const grade = $derived(cls.grade === 'passed' ? 'Passed' : (cls.grade ?? 'No grade yet'));
	const linkLabel = (l: { label: string; url: string }) => l.label || l.url.replace(/^https?:\/\//, '');
	const total = $derived(data.todos.open.length + data.todos.planned.length + data.todos.done.length);
	const deleteMessage = $derived.by(() => {
		const parts = [
			data.counts.todos ? plural(data.counts.todos, 'todo') : '',
			data.rules.length ? plural(data.rules.length, 'recurring rule') : ''
		].filter(Boolean);
		return `${parts.length ? `This deletes its ${parts.join(' and ')}.` : 'It has no todos or recurring rules.'} This can’t be undone.`;
	});
	const shortName = $derived(cls.name.length > 40 ? `${cls.name.slice(0, 40)}…` : cls.name);

	const menu: MenuItem[] = [{ label: 'Delete class', value: 'delete', danger: true }];

	let title = $state('');
	let type = $state('OTH');
	let addError = $state<string | null>(null);
	function addFailed(e: ActionError) {
		addError = e.error === 'required' ? copy.quickAdd.missingTitle : (planError(e) ?? copy.errors.addTodo);
	}
	function added() {
		title = '';
		type = 'OTH';
		addError = null;
	}

	const groups = $derived([
		{ key: 'Open', context: 'backlog' as const, list: data.todos.open },
		{ key: 'Planned', context: 'sprint' as const, list: data.todos.planned }
	]);
	const FORM = $derived(`${uid}-edit`);
</script>

<svelte:head>
	<title>{cls.name} · Life Manager</title>
</svelte:head>

{#snippet extra(todo: Todo, due?: Snippet)}
	<RevisedControl {todo} today={data.today} readonly={archived} {due} />
{/snippet}

{#snippet todoList(list: Todo[], context: 'backlog' | 'sprint')}
	<div class="todolist" role="list">
		{#each list as todo (todo.id)}
			<div class="trow" role="none" in:arrive={{ key: todo.id }} out:leave={{ key: todo.id }} animate:flip={flipOpts()}>
				<TodoRow {todo} aspect={data.aspects.find((a) => a.id === todo.aspectId) ?? data.aspects[0]} today={data.today} {context} sprintDays={data.sprintDays ?? undefined} flat={context === 'sprint'} indent={context === 'backlog' && !archived} planMenu={context === 'backlog'} {extra} readonly={archived} deletable={archived} />
			</div>
		{/each}
	</div>
{/snippet}

<div class="screen-head">
	<div class="screen-lead u-lead">
		<ol class="kicker"><li><a href="/uni">Uni</a></li><li aria-current="page">Class</li></ol>
		<div class="u-title-row">
			<span class="nav-tile" data-testid="class-tile" data-color={cls.color} aria-hidden="true"><Icon aspect={cls.icon} size={22} /></span>
			<AspectTitle name={cls.name} />
			<span class="u-title-trail">
				<PopMenu name="Class actions" items={menu} onselect={() => (deleting = true)}>
					{#snippet icon(item)}{#if item.danger}<Icon name="trash" size={16} />{/if}{/snippet}
					{#snippet trigger(attrs)}
						<Button variant="quiet" icon label="Class actions" {...attrs}><Icon name="more" size={20} /></Button>
					{/snippet}
				</PopMenu>
			</span>
		</div>
		<p class="lede" data-user>{cls.semester.name}</p>
		{#if archived}
			<div class="u-banner" role="status"><span class="mark" aria-hidden="true"><Icon name="alert" size={18} /></span><p>{cls.semester.name} is archived. This class is read-only.</p></div>
		{/if}
	</div>
	<ul class="screen-facts wide-only" data-surface="inverse">
		<li class="facts-caption">Class todos</li>
		<li><span class="n">{data.todos.open.length}</span><span>Open</span></li>
		<li><span class="n">{data.todos.planned.length}</span><span>Planned</span></li>
		<li><span class="n">{data.todos.done.length}</span><span>Done</span></li>
	</ul>
</div>

<div class="screen-body" data-settle>
	<div class="u-split">
		<div class="u-main">
			<section class="card u-panel" aria-labelledby="{uid}-details">
				<div class="card-head">
					<h2 id="{uid}-details">Details</h2>
					{#if !archived}<Button size="s" aria-haspopup="dialog" onclick={() => ((error = undefined), (editing = true))}>Edit details</Button>{/if}
				</div>
				<dl class="u-kv">
					{#if cls.lecturer}<div><dt>Lecturer</dt><dd data-user>{cls.lecturer}</dd></div>{/if}
					{#if cls.room}<div><dt>Room</dt><dd data-user>{cls.room}</dd></div>{/if}
					{#if cls.ects !== null}<div><dt>ECTS</dt><dd>{cls.ects} ECTS</dd></div>{/if}
					{#if cls.links.length}
						<div>
							<dt>Links</dt>
							<dd class="u-cluster">{#each cls.links as link, i (i)}<a class="u-ext" href={link.url} target="_blank" rel="noopener noreferrer" data-user>{linkLabel(link)}</a>{/each}</dd>
						</div>
					{/if}
					{#if examDay}
						<div>
							<dt>Exam</dt>
							<dd>{dateLabel(examDay)} {examDay.slice(0, 4)}{examTime ? `, ${examTime}` : ''}{#if cls.examRoom}{' · '}<span data-user>{cls.examRoom}</span>{/if}{#if countdown}{' · '}{countdown}{/if}</dd>
						</div>
					{/if}
					<div><dt>Grade</dt><dd>{grade}</dd></div>
				</dl>
			</section>

			<NotesCard id="{uid}-notes" html={data.notesHtml} text={cls.notes} empty={copy.class.notesEmpty} editable={!archived} />

			<section class="card u-panel" aria-labelledby="{uid}-todos">
				<div class="card-head"><h2 id="{uid}-todos">Todos</h2></div>
				{#if !archived && data.uniAspectId !== null}
					<form class="u-stack" method="POST" action="/todos?/create" aria-label="Add todo" use:enhance={submit({ onerror: addFailed, onsuccess: added })}>
						<input type="hidden" name="aspectId" value={data.uniAspectId} />
						<input type="hidden" name="classId" value={cls.id} />
						<input type="hidden" name="priority" value="0" />
						<input type="hidden" name="target" value="backlog" />
						<Field label={copy.class.newTodoTitle} name="title" placeholder={copy.class.newTodoPlaceholder} autocomplete="off" enterkeyhint="done" data-user error={addError ?? undefined} bind:value={title} />
						<fieldset class="u-fieldset">
							<legend>Type</legend>
							<div class="u-picks">
								{#each ['LEC', 'EXC', 'OTH'] as t (t)}
									<label class="u-pick"><input type="radio" name="type" value={t} checked={type === t} onchange={() => (type = t)} /><span><ClassTag type={t as 'LEC' | 'EXC' | 'OTH'} bare /><Icon name="check" size={14} /></span></label>
								{/each}
							</div>
						</fieldset>
						<div class="u-tail"><Button variant="primary" type="submit">Add</Button></div>
						<p class="u-note">{copy.class.goesToBacklog}</p>
					</form>
				{/if}
				{#if total === 0}
					<p class="u-empty-body">{copy.class.noTodos}{#if !archived}{' '}{copy.class.addOneAbove}{/if}</p>
				{:else}
					{#each groups as g (g.key)}
						{#if g.list.length}
							<section role="group" aria-labelledby="{uid}-{g.key}" class="u-stack">
								<div class="card-head"><h3 class="group-h" id="{uid}-{g.key}">{g.key}</h3><span class="card-note">{g.list.length}</span></div>
								{@render todoList(g.list, g.context)}
							</section>
						{/if}
					{/each}
					{#if data.todos.done.length}
						<Disclosure id="{uid}-done" label="Done" count={data.todos.done.length} name="Done" role="group" bind:open={showDone}>
							{@render todoList(data.todos.done, 'sprint')}
						</Disclosure>
					{/if}
				{/if}
			</section>
		</div>

		<aside class="card u-side" aria-label="Recurring">
			<h2 class="ruled">Recurring</h2>
			<ClassRules rules={data.rules} />
		</aside>
	</div>
</div>

<form method="POST" action="?/delete" hidden bind:this={deleteForm} use:enhance></form>

<ConfirmDialog
	open={deleting}
	title="Delete {shortName}?"
	message={deleteMessage}
	confirmLabel="Delete class"
	onconfirm={() => deleteForm?.requestSubmit()}
	oncancel={() => (deleting = false)}
/>

{#snippet foot()}
	<Button onclick={() => (editing = false)}>Cancel</Button>
	<Button variant="primary" type="submit" form={FORM}>Save</Button>
{/snippet}

<Sheet open={editing} title="Edit details" onclose={() => (editing = false)} actions={foot}>
	{#if editing}
		<form
			id={FORM}
			method="POST"
			action="?/update"
			aria-label="Edit details"
			novalidate
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'failure') {
						error = result.data as unknown as { error: string; field?: string; fields?: Record<string, string> };
						return;
					}
					await update({ reset: false });
					editing = false;
				}}
		>
			<ClassForm {cls} {error} />
		</form>
	{/if}
</Sheet>

<style>
	.group-h {
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
	}
	.todolist {
		display: grid;
		margin: 0;
		padding: 0;
	}
	.trow {
		position: relative;
	}
	.trow > :global(.row) {
		align-items: flex-start;
	}
	.u-empty-body {
		margin: 0;
		padding-block: var(--space-8);
		font-size: var(--type-body-size);
		line-height: var(--type-body-line);
		color: var(--ink-secondary);
	}
	.trow + .trow::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		border-top: var(--stroke-hairline) solid var(--hairline);
		pointer-events: none;
	}
</style>
