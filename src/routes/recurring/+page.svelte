<script lang="ts">
	import { enhance } from '$app/forms';
	import RuleForm, { WEEKDAYS } from '../../lib/components/recurring/RuleForm.svelte';
	import ClassBadge from '../../lib/components/uni/ClassBadge.svelte';
	import AspectTag from '../../lib/components/ui/AspectTag.svelte';
	import Button from '../../lib/components/ui/Button.svelte';
	import ConfirmDialog from '../../lib/components/ui/ConfirmDialog.svelte';
	import EmptyState from '../../lib/components/ui/EmptyState.svelte';
	import { UI_ICONS } from '../../lib/components/ui/icons';
	import PageHeader from '../../lib/components/ui/PageHeader.svelte';
	import Sheet from '../../lib/components/ui/Sheet.svelte';
	import type { RecurringRule } from '../../lib/types';

	let { data } = $props();

	let formOpen = $state(false);
	let formKey = $state(0);
	let editing = $state<RecurringRule | null>(null);
	let deleting = $state<RecurringRule | null>(null);
	let deleteForm: HTMLFormElement;

	const aspectById = $derived(new Map(data.aspects.map((a) => [a.id, a])));
	const classById = $derived(new Map(data.classes.map((c) => [c.id, c])));

	function openForm(rule: RecurringRule | null) {
		editing = rule;
		formKey++;
		formOpen = true;
	}
</script>

<svelte:head>
	<title>Recurring · Life Manager</title>
</svelte:head>

<PageHeader title="Recurring" icon="repeat">
	<Button type="button" variant="primary" onclick={() => openForm(null)}>
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>New rule
	</Button>
</PageHeader>
<p class="sub">Each rule adds a todo on its days when a sprint starts.</p>

{#if data.rules.length}
	<ul class="rules">
		{#each data.rules as rule (rule.id)}
			{@const aspect = aspectById.get(rule.aspectId)!}
			{@const classRef = rule.classId === null ? undefined : classById.get(rule.classId)}
			<li data-testid="rule-row" data-rule-id={rule.id}>
				<button type="button" class="row" onclick={() => openForm(rule)}>
					<span class="title">{rule.title}</span>
					<span class="meta">
						<span data-testid="rule-aspect">
							<AspectTag name={aspect.name} color={aspect.color} icon={aspect.icon} />
						</span>
						{#if classRef}<span class="class"><ClassBadge {classRef} type={rule.type} href={false} /></span>{/if}
						{#each WEEKDAYS.filter((d) => rule.weekdays.includes(d.value)) as day (day.value)}
							<span class="day" data-testid="rule-weekday" title={day.long}>{day.short}</span>
						{/each}
					</span>
					<span class="end">
						{#if rule.checklist.length}
							<span class="count num">
								<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS['list-checks']} /></svg>
								{rule.checklist.length}
								<span class="visually-hidden">checklist items</span>
							</span>
						{/if}
						{#if rule.priority}
							<span class="prio" data-p={rule.priority}>
								<i></i><i></i><i></i><span class="visually-hidden">Priority {rule.priority}</span>
							</span>
						{/if}
					</span>
				</button>
			</li>
		{/each}
	</ul>
{:else}
	<EmptyState message="No recurring rules yet. Add one for anything you do every week." />
{/if}

<Sheet open={formOpen} title={editing ? 'Edit rule' : 'New rule'} onclose={() => (formOpen = false)}>
	{#key formKey}
		<RuleForm
			aspects={data.aspects}
			rule={editing}
			oncancel={() => (formOpen = false)}
			onsaved={() => (formOpen = false)}
			ondelete={() => {
				formOpen = false;
				deleting = editing;
			}}
		/>
	{/key}
</Sheet>

<ConfirmDialog
	open={deleting !== null}
	title="Delete “{deleting?.title ?? ''}”?"
	message="It stops repeating. Todos it already added to a sprint stay."
	confirmLabel="Delete rule"
	onconfirm={() => deleteForm.requestSubmit()}
	oncancel={() => (deleting = null)}
/>

<form
	method="POST"
	action="?/delete"
	hidden
	bind:this={deleteForm}
	use:enhance={() =>
		async ({ update }) => {
			deleting = null;
			await update();
		}}
>
	<input type="hidden" name="id" value={deleting?.id ?? ''} />
</form>

<style>
	.sub {
		margin: calc(-1 * var(--space-4)) 0 var(--space-6);
		color: var(--ink-3);
	}

	.rules {
		margin: 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid var(--line);
	}

	li {
		border-bottom: 1px solid var(--line);
	}

	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: start;
		column-gap: var(--space-3);
		row-gap: var(--space-2);
		width: calc(100% + 2 * var(--space-2));
		min-height: var(--row-height);
		margin: var(--space-1) calc(-1 * var(--space-2));
		padding: var(--space-3) var(--space-2);
		border: 0;
		border-radius: var(--radius-md);
		background: none;
		text-align: left;
		cursor: pointer;
		transition: background-color var(--dur-fast) var(--ease-out);
	}

	.row:hover {
		background: var(--paper-hover);
	}

	.title {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: var(--leading-snug);
	}

	.meta {
		grid-column: 1;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-1);
	}

	.meta > span:first-child,
	.class {
		margin-right: var(--space-1);
	}

	.day {
		display: inline-flex;
		align-items: center;
		height: 26px;
		padding: 0 var(--space-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		color: var(--ink-2);
		font-size: var(--text-sm);
	}

	.end {
		grid-column: 2;
		grid-row: 1;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding-top: 1px;
		font-size: var(--text-sm);
		color: var(--ink-3);
	}

	.count {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	.prio {
		display: inline-flex;
		align-items: flex-end;
		gap: 2px;
		height: 12px;
	}

	.prio i {
		display: block;
		width: 3px;
		border-radius: 1px;
		background: var(--line-strong);
	}

	.prio i:nth-child(1) {
		height: 5px;
	}

	.prio i:nth-child(2) {
		height: 8px;
	}

	.prio i:nth-child(3) {
		height: 12px;
	}

	.prio[data-p='1'] i,
	.prio[data-p='2'] i:nth-child(-n + 2),
	.prio[data-p='3'] i:nth-child(1) {
		background: var(--ink-2);
	}

	svg {
		width: var(--icon-sm);
		height: var(--icon-sm);
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
