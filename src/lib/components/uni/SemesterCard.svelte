<!--
	A semester with its classes. Active: a card with the actions menu (Rename, Archive, Delete), New class and the empty copy. `readOnly` (an archived
	semester, shown inside the Archived group): "Read-only.", the menu offers Unarchive and Delete, and no New class. Archiving asks first only when
	class todos are open; it is not destructive, so it confirms on the filled primary. "New class" opens the sheet; renaming happens in place.
-->
<script lang="ts">
	import { copy } from '$lib/copy';
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import type { IsoDate, SemesterView } from '$lib/types';
	import { examCountdown, formatAverage, uniMessage } from '$lib/uni';
	import type { MenuItem } from '../menu/Menu.svelte';
	import PopMenu from '../menu/PopMenu.svelte';
	import Field from '../field/Field.svelte';
	import Icon from '../shell/Icon.svelte';
	import Button from '../button/Button.svelte';
	import ConfirmDialog from '../ui/ConfirmDialog.svelte';
	import Sheet from '../ui/Sheet.svelte';
	import ClassForm from './ClassForm.svelte';
	import { nextDueText, plural } from './format';
	import './uni.css';

	let {
		semester,
		counts,
		today,
		readOnly = false
	}: { semester: SemesterView; counts: { classes: number; todos: number; openTodos: number }; today: IsoDate; readOnly?: boolean } = $props();

	const uid = $props.id();
	let renaming = $state(false);
	let renameError = $state<{ error: string; field?: string } | null>(null);
	let renameValue = $state('');
	let adding = $state(false);
	let classError = $state<{ error: string; field?: string; fields?: Record<string, string> } | undefined>();
	let confirm = $state<'archive' | 'delete' | null>(null);
	let action = $state<'archive' | 'unarchive' | 'deleteSemester'>('archive');
	let form = $state<HTMLFormElement>();

	const average = $derived(formatAverage(semester.grades.average));
	const short = $derived(semester.name.length > 40 ? `${semester.name.slice(0, 40)}…` : semester.name);
	const items = $derived<MenuItem[]>(
		readOnly
			? [{ label: 'Unarchive', value: 'unarchive' }, { label: 'Delete', value: 'delete', danger: true, separator: true }]
			: [
					{ label: 'Rename', value: 'rename' },
					{ label: 'Archive', value: 'archive' },
					{ label: 'Delete', value: 'delete', danger: true, separator: true }
				]
	);

	async function submit(next: typeof action) {
		confirm = null;
		action = next;
		await tick();
		form?.requestSubmit();
	}

	async function pick(item: MenuItem) {
		if (item.value === 'rename') {
			renameError = null;
			renameValue = semester.name;
			renaming = true;
			await tick();
			document.getElementById(`${uid}-n`)?.focus();
		} else if (item.value === 'unarchive') submit('unarchive');
		// Both warnings are UI steps; the actions themselves don't refuse.
		else if (item.value === 'archive') counts.openTodos > 0 ? (confirm = 'archive') : submit('archive');
		else confirm = 'delete';
	}

	function endRename() {
		renaming = false;
		tick().then(() => document.getElementById(`${uid}-m`)?.focus());
	}

	function newClass() {
		classError = undefined;
		adding = true;
	}

	const FORM = $derived(`${uid}-class-form`);
</script>

{#snippet actions()}
	<PopMenu name="Semester actions" {items} onselect={pick}>
		{#snippet icon(item)}{#if item.danger}<Icon name="trash" size={16} />{/if}{/snippet}
		{#snippet trigger(attrs)}
			<Button variant="quiet" icon label="Semester actions: {semester.name}" id="{uid}-m" {...attrs}><Icon name="more" size={20} /></Button>
		{/snippet}
	</PopMenu>
{/snippet}

{#snippet classRow(cls: SemesterView['classes'][number])}
	{@const exam = examCountdown(cls.examAt, today)}
	{@const due = cls.nextDue && cls.openTodos ? nextDueText(cls.nextDue, today) : null}
	<li class="u-row" aria-label={cls.name}>
		<a class="main" href="/uni/classes/{cls.id}" data-press>
			<span class="leading"><span class="nav-tile" data-color={cls.color} aria-hidden="true"><Icon aspect={cls.icon} size={16} /></span></span>
			<span class="text">
				<span class="title u-clamp2" data-user>{cls.name}</span>
				{#if cls.lecturer}<span class="meta u-clamp2" data-user>{cls.lecturer}</span>{/if}
				<span class="facts meta">
					{#if cls.grade}<span class="u-tag" aria-label="Grade {cls.grade}">{cls.grade === 'passed' ? 'Passed' : cls.grade}</span>{/if}
					<span>{cls.openTodos ? `${cls.openTodos} open` : 'No open todos'}</span>
					{#if due}<span class:u-late={due.late}>{due.text}</span>{/if}
					{#if exam}<span>{exam}</span>{/if}
				</span>
			</span>
			<span class="trail" aria-hidden="true"><Icon name="chevron-right" /></span>
		</a>
	</li>
{/snippet}

{#snippet inner()}
	{#if semester.classes.length}
		<ul class="u-rows" aria-label="Classes">{#each semester.classes as cls (cls.id)}{@render classRow(cls)}{/each}</ul>
		{#if !readOnly}<div class="u-tail"><Button size="s" aria-haspopup="dialog" onclick={newClass}><Icon name="plus" size={16} />New class</Button></div>{/if}
	{:else}
		<div class="u-empty">
			<h3 class="title">{copy.empty.classes.heading}</h3>
			{#if !readOnly}<div><Button aria-haspopup="dialog" onclick={newClass}><Icon name="plus" size={16} />New class</Button></div>{/if}
		</div>
	{/if}
{/snippet}

{#if readOnly}
	<div class="u-stack">
		<div class="u-cluster end">
			<p class="u-note"><strong>{copy.uni.readOnly}</strong> Average {average} · {semester.grades.earnedEcts} ECTS</p>
			<div class="act">{@render actions()}</div>
		</div>
		{@render inner()}
	</div>
{:else}
	<section class="card u-panel" aria-label="Semester {semester.name}">
		{#if renaming}
			<form
				class="rename"
				method="POST"
				action="?/renameSemester"
				novalidate
				use:enhance={() =>
					async ({ result, update }) => {
						if (result.type === 'failure') {
							renameError = result.data as { error: string; field?: string };
							return;
						}
						await update();
						endRename();
					}}
			>
				<input type="hidden" name="id" value={semester.id} />
				<div class="grow"><Field label="Semester name" hideLabel id="{uid}-n" name="name" autocomplete="off" data-user error={renameError ? uniMessage(renameError.error, renameError.field) : undefined} bind:value={renameValue} /></div>
				<Button variant="primary" type="submit">Save</Button>
				<Button onclick={endRename}>Cancel</Button>
			</form>
		{:else}
			<div class="card-head sem-head">
				<div class="sem-title">
					<h2 data-user>{semester.name}</h2>
					<span class="card-note">Average {average} · {semester.grades.earnedEcts} ECTS</span>
				</div>
				<div class="act">{@render actions()}</div>
			</div>
		{/if}
		{@render inner()}
	</section>
{/if}

<form method="POST" action="?/{action}" hidden bind:this={form} use:enhance>
	<input type="hidden" name="id" value={semester.id} />
</form>

{#snippet classFoot()}
	<Button onclick={() => (adding = false)}>Cancel</Button>
	<Button variant="primary" type="submit" form={FORM}>Add class</Button>
{/snippet}

<Sheet open={adding} title="New class" kicker={short} onclose={() => (adding = false)} actions={classFoot}>
	{#if adding}
		<form
			id={FORM}
			method="POST"
			action="?/createClass"
			aria-label="New class"
			novalidate
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'failure') {
						classError = result.data as { error: string; field?: string; fields?: Record<string, string> };
						return;
					}
					adding = false;
					await update();
				}}
		>
			<input type="hidden" name="semesterId" value={semester.id} />
			<ClassForm error={classError} />
			{#if classError && (!classError.field || classError.field === 'semesterId')}
				<p class="u-note" role="alert">{uniMessage(classError.error)}</p>
			{/if}
		</form>
	{/if}
</Sheet>

<ConfirmDialog
	open={confirm === 'archive'}
	title="Archive {short}?"
	message="{plural(counts.openTodos, 'class todo')} {counts.openTodos === 1 ? 'is' : 'are'} still open. Archiving marks them done, and the semester becomes read-only. You can unarchive it later."
	confirmLabel="Mark {counts.openTodos} done and archive"
	onconfirm={() => submit('archive')}
	oncancel={() => (confirm = null)}
/>

<ConfirmDialog
	open={confirm === 'delete'}
	title="Delete {short}?"
	message={counts.classes === 0
		? 'It has no classes. This can’t be undone.'
		: `This deletes ${plural(counts.classes, 'class')} and ${plural(counts.todos, 'todo')}, done ones included, and their recurring rules. This can’t be undone.`}
	confirmLabel="Delete semester"
	onconfirm={() => submit('deleteSemester')}
	oncancel={() => (confirm = null)}
/>

<style>
	.sem-head {
		align-items: flex-start;
		flex-wrap: nowrap;
	}
	.sem-title {
		display: grid;
		gap: var(--space-1);
		min-inline-size: 0;
	}
	/* a semester is a group of classes: its name is a group head in the UI face, like the aspect groups on Today and Sprint, not a display title */
	.sem-title h2 {
		overflow-wrap: anywhere;
		font-family: var(--font-ui);
		font-size: var(--type-title-size);
		line-height: var(--type-title-line);
		font-weight: var(--weight-semibold);
		letter-spacing: normal;
	}
	.act {
		position: relative;
		flex: none;
	}
	.rename {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: flex-start;
	}
	.rename .grow {
		flex: 1 0 100%;
		min-inline-size: 0;
	}
	.u-empty {
		display: grid;
		justify-items: start;
		gap: var(--space-2);
		padding-block: var(--space-8);
	}
	.u-empty > div {
		margin-block-start: var(--space-3);
	}
	.u-empty .title {
		font-family: var(--font-display);
		font-weight: var(--weight-display);
		font-size: var(--type-display-s-size);
		line-height: var(--type-display-s-line);
		letter-spacing: var(--type-display-s-tracking);
		text-wrap: balance;
	}
</style>
