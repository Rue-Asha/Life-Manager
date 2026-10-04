<script lang="ts" module>
	// Lucide glyphs (ISC licence) the Uni overview needs beyond UI_ICONS and the project glyphs.
	export const UNI_GLYPHS = {
		dots: 'M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
		lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z M7 11V7a5 5 0 0 1 10 0v4',
		archive:
			'M3 3h18a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8 M10 12h4'
	} as const;
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import type { IsoDate, SemesterView } from '$lib/types';
	import { uniMessage } from '$lib/uni';
	import { GLYPHS } from '../projects/glyphs';
	import Button from '../ui/Button.svelte';
	import ConfirmDialog from '../ui/ConfirmDialog.svelte';
	import { UI_ICONS } from '../ui/icons';
	import ClassCard from './ClassCard.svelte';
	import ClassForm from './ClassForm.svelte';
	import GradeLine from './GradeLine.svelte';

	let {
		semester,
		counts,
		today
	}: { semester: SemesterView; counts: { classes: number; todos: number; openTodos: number }; today: IsoDate } = $props();

	const archived = $derived(semester.archivedAt !== null);
	const uid = $props.id();
	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : word.endsWith('s') ? 'es' : 's'}`;

	let expanded = $state(false);
	let menuOpen = $state(false);
	let renaming = $state(false);
	let adding = $state(false);
	let confirm = $state<'archive' | 'delete' | null>(null);
	let action = $state<'archive' | 'unarchive' | 'deleteSemester'>('archive');
	let renameError = $state<{ error: string; field?: string } | null>(null);
	let classError = $state<{ error: string; field?: string } | undefined>();
	let form = $state<HTMLFormElement>();
	let wrap = $state<HTMLElement>();

	async function toggleMenu() {
		menuOpen = !menuOpen;
		await tick();
		if (menuOpen) wrap?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
	}

	function closeMenu(e: PointerEvent | KeyboardEvent) {
		if (!menuOpen) return;
		if (e instanceof KeyboardEvent ? e.key === 'Escape' : !wrap?.contains(e.target as Node)) menuOpen = false;
	}

	async function submit(next: typeof action) {
		confirm = null;
		action = next;
		await tick();
		form?.requestSubmit();
	}

	function pick(item: 'rename' | 'archive' | 'unarchive' | 'delete') {
		menuOpen = false;
		if (item === 'rename') {
			renameError = null;
			renaming = true;
		} else if (item === 'unarchive') submit('unarchive');
		// Both warnings are UI steps; the actions themselves don't refuse.
		else if (item === 'archive') counts.openTodos > 0 ? (confirm = 'archive') : submit('archive');
		else confirm = 'delete';
	}

	function newClass() {
		classError = undefined;
		adding = true;
	}
</script>

<svelte:window onpointerdown={closeMenu} onkeydown={closeMenu} />

<section class="sem" class:archived data-testid="semester-section">
	<div class="head" data-testid="grade-summary">
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
						renaming = false;
						await update();
					}}
			>
				<input type="hidden" name="id" value={semester.id} />
				<label class="visually-hidden" for="{uid}-name">Semester name</label>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					id="{uid}-name"
					name="name"
					value={semester.name}
					autocomplete="off"
					autofocus
					aria-invalid={renameError ? true : undefined}
					aria-describedby={renameError ? `${uid}-name-error` : undefined}
				/>
				<Button type="button" variant="quiet" onclick={() => (renaming = false)}>Cancel</Button>
				<Button type="submit" variant="primary">Save</Button>
				{#if renameError}
					<p class="error" id="{uid}-name-error" role="alert">{uniMessage(renameError.error, renameError.field)}</p>
				{/if}
			</form>
		{:else if archived}
			<h3 class="toggle">
				<button type="button" aria-expanded={expanded} onclick={() => (expanded = !expanded)}>
					<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS['chevron-right']} /></svg>{semester.name}
				</button>
			</h3>
		{:else}
			<h2>{semester.name}</h2>
		{/if}
		{#if !renaming}
			<GradeLine grades={semester.grades} />
			<div class="menu-wrap" bind:this={wrap}>
				<button
					type="button"
					class="icon-btn"
					aria-label="Semester actions"
					aria-haspopup="menu"
					aria-expanded={menuOpen}
					aria-controls="{uid}-menu"
					onclick={toggleMenu}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UNI_GLYPHS.dots} /></svg>
				</button>
				{#if menuOpen}
					<ul id="{uid}-menu" class="menu" role="menu" aria-label="Semester actions">
						{#if archived}
							<li role="none">
								<button type="button" role="menuitem" onclick={() => pick('unarchive')}>
									<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UNI_GLYPHS.archive} /></svg>Unarchive
								</button>
							</li>
						{:else}
							<li role="none">
								<button type="button" role="menuitem" onclick={() => pick('rename')}>
									<svg viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS.pen} /></svg>Rename
								</button>
							</li>
							<li role="none">
								<button type="button" role="menuitem" onclick={() => pick('archive')}>
									<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UNI_GLYPHS.archive} /></svg>Archive
								</button>
							</li>
						{/if}
						<li role="none">
							<button type="button" role="menuitem" onclick={() => pick('delete')}>
								<svg viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS.trash} /></svg>Delete
							</button>
						</li>
					</ul>
				{/if}
			</div>
		{/if}
	</div>

	{#if adding}
		<form
			class="class-form"
			method="POST"
			action="?/createClass"
			novalidate
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'failure') {
						classError = result.data as { error: string; field?: string };
						return;
					}
					adding = false;
					await update();
				}}
		>
			<input type="hidden" name="semesterId" value={semester.id} />
			<ClassForm error={classError} />
			{#if classError && (!classError.field || classError.field === 'semesterId')}
				<p class="error" role="alert">{uniMessage(classError.error)}</p>
			{/if}
			<footer>
				<Button type="button" variant="quiet" onclick={() => (adding = false)}>Cancel</Button>
				<Button type="submit" variant="primary">Add class</Button>
			</footer>
		</form>
	{/if}

	{#if !archived || expanded}
		{#if archived}
			<p class="ro">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UNI_GLYPHS.lock} /></svg>Read-only.
				<button type="button" onclick={() => submit('unarchive')}>Unarchive</button>
			</p>
		{/if}
		{#if semester.classes.length === 0 && !archived}
			{#if !adding}
				<p class="inline-empty" data-testid="class-empty">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['graduation-cap']} /></svg>No classes yet.
					<button type="button" onclick={newClass}>New class</button>
				</p>
			{/if}
		{:else if semester.classes.length > 0}
			<ul class="cards" data-testid="class-grid">
				{#each semester.classes as cls (cls.id)}
					<li><ClassCard {cls} {today} /></li>
				{/each}
				{#if !archived && !adding}
					<li>
						<button type="button" class="add-tile" onclick={newClass}>
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>New class
						</button>
					</li>
				{/if}
			</ul>
		{/if}
	{/if}
</section>

<form method="POST" action="?/{action}" hidden bind:this={form} use:enhance>
	<input type="hidden" name="id" value={semester.id} />
</form>

<ConfirmDialog
	open={confirm === 'archive'}
	title="Archive {semester.name}?"
	message="{plural(counts.openTodos, 'class todo')} {counts.openTodos === 1 ? 'is' : 'are'} still open. Archiving marks them done, and the semester becomes read-only. You can unarchive it later."
	confirmLabel="Mark {counts.openTodos} done and archive"
	onconfirm={() => submit('archive')}
	oncancel={() => (confirm = null)}
/>

<ConfirmDialog
	open={confirm === 'delete'}
	title="Delete {semester.name}?"
	message={counts.classes === 0
		? "It has no classes. This can't be undone."
		: `This deletes ${plural(counts.classes, 'class')} and ${plural(counts.todos, 'todo')}, done ones included, and their recurring rules. This can't be undone.`}
	confirmLabel="Delete semester"
	onconfirm={() => submit('deleteSemester')}
	oncancel={() => (confirm = null)}
/>

<style>
	.head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 30px;
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--line);
	}

	h2,
	h3 {
		min-width: 0;
		margin-right: auto;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
		overflow-wrap: anywhere;
	}

	h3 {
		font-size: var(--text-md);
		color: var(--ink-2);
	}

	.toggle button {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.toggle button:hover {
		color: var(--ink);
	}

	.chev {
		color: var(--ink-3);
	}

	[aria-expanded='true'] .chev {
		transform: rotate(90deg);
	}

	.rename {
		display: flex;
		flex: 1;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}

	.rename input[name='name'] {
		flex: 1;
		min-width: 0;
	}

	input {
		min-height: var(--control-height);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--paper);
	}

	input[aria-invalid='true'] {
		border-color: var(--ink);
		box-shadow: inset 0 0 0 1px var(--ink);
	}

	.error {
		flex-basis: 100%;
		margin: 0;
		color: var(--ink);
		font-size: var(--text-sm);
	}

	.menu-wrap {
		position: relative;
		flex: none;
	}

	.icon-btn {
		display: inline-grid;
		place-items: center;
		width: 30px;
		height: 30px;
		padding: 0;
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--ink-3);
		cursor: pointer;
	}

	.icon-btn:hover {
		background: var(--paper-hover);
		color: var(--ink);
	}

	.icon-btn svg {
		width: var(--icon-md);
		height: var(--icon-md);
		stroke-width: 2;
	}

	.menu {
		position: absolute;
		z-index: 2;
		top: calc(100% + var(--space-1));
		right: 0;
		min-width: 200px;
		margin: 0;
		padding: var(--space-1);
		border-radius: var(--radius-md);
		background: var(--paper);
		box-shadow: var(--shadow-pop);
		list-style: none;
	}

	.menu button {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		height: var(--control-height);
		padding: 0 var(--space-3);
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		text-align: left;
		cursor: pointer;
	}

	.menu button:hover {
		background: var(--paper-hover);
	}

	.class-form {
		display: grid;
		gap: var(--space-4);
		margin-top: var(--space-4);
		padding: var(--space-5);
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-3);
		margin: 0;
		padding: var(--space-4) 0 0;
		list-style: none;
	}

	.cards li {
		min-width: 0;
	}

	.add-tile {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: 100%;
		height: 100%;
		min-height: 56px;
		border: 1px dashed var(--line-strong);
		border-radius: var(--radius-md);
		background: none;
		color: var(--ink-2);
		cursor: pointer;
	}

	.add-tile:hover {
		background: var(--paper-hover);
		color: var(--ink);
	}

	.inline-empty {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-top: var(--space-4);
		padding: var(--space-4);
		border-radius: var(--radius-md);
		background: var(--paper-sunk);
		color: var(--ink-3);
	}

	.inline-empty button,
	.ro button {
		padding: 0;
		border: 0;
		background: none;
		color: var(--accent);
		font-weight: var(--weight-medium);
		cursor: pointer;
	}

	.inline-empty button {
		margin-left: auto;
		white-space: nowrap;
	}

	.inline-empty button:hover,
	.ro button:hover {
		text-decoration: underline;
	}

	.ro {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin-top: var(--space-2);
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.inline-empty svg {
		width: var(--icon-md);
		height: var(--icon-md);
	}

	@media (min-width: 768px) {
		.add-tile {
			min-height: 128px;
		}
	}
</style>
