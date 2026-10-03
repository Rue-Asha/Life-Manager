<script lang="ts">
	import { tick } from 'svelte';
	import { enhance, type SubmitFunction } from '$app/forms';
	import { ASPECT_COLORS } from '$lib/aspect-style';
	import AspectForm from '$lib/components/aspects/AspectForm.svelte';
	import DeleteAspectDialog from '$lib/components/aspects/DeleteAspectDialog.svelte';
	import AspectIcon from '$lib/components/ui/AspectIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import { UI_ICONS } from '$lib/components/ui/icons';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Row = (typeof data.aspects)[number];

	let editing = $state<Row | 'new' | null>(null);
	let deleting = $state<Row | null>(null);
	let error = $state<string>();
	let menuFor = $state<Row['id'] | null>(null);
	let menuEl = $state<HTMLElement>();

	async function toggleMenu(aspect: Row) {
		menuFor = menuFor === aspect.id ? null : aspect.id;
		await tick();
		menuEl?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
	}

	function closeMenu(e: PointerEvent | KeyboardEvent) {
		if (menuFor === null) return;
		if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menuEl?.parentElement?.contains(e.target as Node)) menuFor = null;
	}

	function open(target: Row | 'new') {
		error = undefined;
		menuFor = null;
		editing = target;
	}

	const save: SubmitFunction = () => {
		return async ({ result, update }) => {
			if (result.type === 'failure') {
				error = result.data?.error;
				return;
			}
			// A form reset would clear the radios' bound colour before the sheet closes.
			await update({ reset: false });
			editing = null;
		};
	};

	function locked(aspect: Row) {
		return data.aspects.length === 1 && aspect.usage.todos + aspect.usage.rules > 0;
	}

	function todoCount(n: number) {
		return n === 0 ? 'No todos' : n === 1 ? '1 todo' : `${n} todos`;
	}
</script>

<svelte:head>
	<title>Aspects · Life Manager</title>
</svelte:head>

<svelte:window onpointerdown={closeMenu} onkeydown={closeMenu} />

<PageHeader title="Aspects" icon="layers">
	<Button variant="primary" onclick={() => open('new')}>
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>
		New aspect
	</Button>
</PageHeader>

<ul>
	{#each data.aspects as aspect (aspect.id)}
		{@const progress = data.progress?.[aspect.id]}
		<li data-testid="aspect-card">
			<span class="tile" style:background={ASPECT_COLORS[aspect.color].tint}>
				<AspectIcon icon={aspect.icon} color={aspect.color} />
			</span>
			<a class="name" href="/aspects/{aspect.id}">{aspect.name}</a>
			<span class="stats">
				{#if progress}
					<ProgressBar done={progress.done} total={progress.total} color={aspect.color} />
				{:else if data.progress}
					<span>Not in this sprint</span>
				{/if}
				<span class="num" data-testid="backlog-count">{data.backlogCounts[aspect.id] ?? 0} in backlog</span>
			</span>
			<span class="count num">{todoCount(aspect.usage.todos)}</span>
			<div class="actions">
				<button
					type="button"
					class="more"
					aria-label="Actions for {aspect.name}"
					aria-haspopup="menu"
					aria-expanded={menuFor === aspect.id}
					onclick={() => toggleMenu(aspect)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
					</svg>
				</button>
				{#if menuFor === aspect.id}
					<div class="menu" role="menu" aria-label="Actions for {aspect.name}" bind:this={menuEl}>
						<button type="button" role="menuitem" onclick={() => open(aspect)}>Edit</button>
						<button
							type="button"
							role="menuitem"
							disabled={locked(aspect)}
							onclick={() => {
								deleting = aspect;
								menuFor = null;
							}}
						>
							Delete
						</button>
					</div>
				{/if}
			</div>
		</li>
	{/each}
</ul>

<Sheet
	open={editing !== null}
	title={editing === 'new' ? 'New aspect' : 'Edit aspect'}
	onclose={() => (editing = null)}
>
	{#if editing}
		{@const current = editing === 'new' ? null : editing}
		<form method="POST" action={current ? '?/update' : '?/create'} use:enhance={save}>
			{#if current}<input type="hidden" name="id" value={current.id} />{/if}
			<AspectForm
				name={current?.name}
				color={current?.color ?? 'tangerine'}
				icon={current?.icon}
				{error}
			/>
			{#if current && locked(current)}
				<p class="locked" id="locked-note">
					This is your only aspect and it still has todos or rules. Add another aspect to move them to
					first.
				</p>
			{/if}
			<footer>
				{#if current}
					<span class="start">
						<Button
							type="button"
							variant="quiet"
							disabled={locked(current)}
							aria-describedby={locked(current) ? 'locked-note' : undefined}
							onclick={() => {
								deleting = current;
								editing = null;
							}}
						>
							Delete aspect
						</Button>
					</span>
				{/if}
				<Button type="button" variant="quiet" onclick={() => (editing = null)}>Cancel</Button>
				<Button variant="primary">{current ? 'Save' : 'Create aspect'}</Button>
			</footer>
		</form>
	{/if}
</Sheet>

<DeleteAspectDialog
	aspect={deleting}
	usage={deleting?.usage ?? { todos: 0, rules: 0 }}
	targets={data.aspects.filter((a) => a.id !== deleting?.id)}
	onclose={() => (deleting = null)}
/>

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li + li::before {
		content: '';
		position: absolute;
		top: 0;
		right: var(--space-3);
		left: var(--space-3);
		border-top: 1px solid var(--line);
	}

	/* The whole row opens the aspect page; the menu button sits above the stretched link. */
	li {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 56px;
		margin: 0 calc(-1 * var(--space-3));
		padding: 0 var(--space-3);
		border-radius: var(--radius-md);
	}

	li:hover {
		background: var(--paper-hover);
	}

	.name::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}

	.actions {
		position: relative;
		z-index: 1;
	}

	.more {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		padding: 0;
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--ink-3);
		cursor: pointer;
	}

	.more:hover,
	.more[aria-expanded='true'] {
		background: var(--paper-sunk);
		color: var(--ink);
	}

	.more svg {
		fill: currentColor;
		stroke: none;
	}

	.menu {
		position: absolute;
		top: calc(100% + var(--space-1));
		right: 0;
		z-index: 2;
		min-width: 160px;
		padding: var(--space-1);
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--paper);
		box-shadow: var(--shadow-float);
	}

	.menu [role='menuitem'] {
		display: block;
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--ink);
		font: inherit;
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
	}

	.menu [role='menuitem']:hover:not(:disabled),
	.menu [role='menuitem']:focus-visible {
		background: var(--paper-hover);
		outline: none;
	}

	.menu [role='menuitem']:disabled {
		color: var(--ink-3);
		cursor: default;
	}

	.stats {
		display: none;
	}

	/* Wide screens: the short list becomes a grid of cards; one aspect stays one card at the left. */
	@media (min-width: 1024px) {
		ul {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			gap: var(--space-3);
		}

		li + li::before {
			content: none;
		}

		li {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr);
			grid-template-areas:
				'tile actions'
				'name name'
				'stats stats'
				'count count';
			align-items: center;
			row-gap: var(--space-1);
			margin: 0;
			padding: var(--space-4);
			border: 1px solid var(--line);
			border-radius: var(--radius-lg);
		}

		.tile {
			grid-area: tile;
			margin-bottom: var(--space-3);
		}

		.actions {
			grid-area: actions;
			justify-self: end;
			align-self: start;
		}

		.name {
			grid-area: name;
		}

		.stats {
			grid-area: stats;
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: var(--space-1) var(--space-3);
			color: var(--ink-3);
			font-size: var(--text-sm);
		}

		.count {
			grid-area: count;
		}
	}

	.tile {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		flex: none;
		border-radius: var(--radius-md);
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		color: var(--ink);
		font-size: var(--text-lg);
		text-decoration: none;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.count {
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.locked {
		margin-top: var(--space-4);
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.start {
		margin-right: auto;
	}

	footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-2);
		margin-top: var(--space-6);
	}
</style>
