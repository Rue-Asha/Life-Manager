<script lang="ts">
	import { enhance } from '$app/forms';
	import RuleForm, { WEEKDAYS } from '$lib/components/recurring/RuleForm.svelte';
	import ClassTag from '$lib/components/uni/ClassTag.svelte';
	import '$lib/components/recurring/recurring.css';
	import Icon from '$lib/components/shell/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import { flip } from 'svelte/animate';
	import { copy } from '$lib/copy';
	import { fadeOut, flipOpts, settle } from '$lib/motion';
	import { slotLabel } from '$lib/slot';
	import type { RecurringRule } from '$lib/types';

	let { data } = $props();

	let formOpen = $state(false);
	let formKey = $state(0);
	let editing = $state<RecurringRule | null>(null);
	let deleting = $state<RecurringRule | null>(null);
	let deleteForm: HTMLFormElement;

	const aspectById = $derived(new Map(data.aspects.map((a) => [a.id, a])));
	const classById = $derived(new Map(data.classes.map((c) => [c.id, c])));
	const perWeek = $derived(data.rules.reduce((n, r) => n + r.weekdays.length, 0));
	const FORM = 'rule-form';

	function openForm(rule: RecurringRule | null) {
		editing = rule;
		formKey++;
		formOpen = true;
	}
</script>

<svelte:head>
	<title>Recurring · Life Manager</title>
</svelte:head>

<div class="screen-head">
	<div class="screen-lead">
		<ul class="kicker"><li>Life</li><li>Weekly rules</li></ul>
		<h1><em class="accent-word">Recurring</em></h1>
		<p class="lede">Each rule adds a todo on its days when a sprint starts.</p>
		{#if data.rules.length}
			<div class="hr-head-action">
				<Button type="button" aria-haspopup="dialog" onclick={() => openForm(null)}><Icon name="plus" size={18} />New rule</Button>
			</div>
		{/if}
	</div>
	{#if data.rules.length}
		<ul class="screen-facts" data-surface="inverse" aria-label="Weekly rules">
			<li class="facts-caption">Weekly rules</li>
			<li><span class="n">{data.rules.length}</span><span>Rules</span></li>
			<li><span class="n">{perWeek}</span><span>Todos a week</span></li>
		</ul>
	{/if}
</div>

<div class="screen-body" data-settle>
	<section class="card hr-panel" aria-label="Rules">
		{#if data.rules.length}
			<ul class="hr-stack hr-rules">
				{#each data.rules as rule (rule.id)}
					{@const aspect = aspectById.get(rule.aspectId)!}
					{@const classRef = rule.classId === null ? undefined : classById.get(rule.classId)}
					<li class="row interactive" id="rule-{rule.id}" aria-label={rule.title} in:settle out:fadeOut animate:flip={flipOpts()}>
						<button type="button" class="main" aria-haspopup="dialog" data-press onclick={() => openForm(rule)}>
							<span class="leading"><span class="nav-tile" data-color={aspect.color} aria-hidden="true"><Icon aspect={aspect.icon} size={16} /></span></span>
							<span class="text">
								<span class="title hr-clamp2" data-user>{rule.title}</span>
								<span class="hr-facts meta"><span data-user>{aspect.name}</span>{#if classRef}<span class="hr-clamp2" data-user>{classRef.name}</span>{#if rule.type}<ClassTag type={rule.type} />{/if}{/if}</span>
								<span class="hr-tags">
									{#if rule.weekdays.length === 7}<span class="hr-tag">Daily</span>{:else}{#each WEEKDAYS.filter((d) => rule.weekdays.includes(d.value)) as day (day.value)}<span class="hr-tag" title={day.long}>{day.short}</span>{/each}{/if}
								</span>
								<span class="hr-facts meta">
									{#if rule.startTime}<span>{slotLabel(rule.startTime, rule.endTime)}</span>{/if}
									{#if rule.checklist.length}<span>{rule.checklist.length} checklist {rule.checklist.length === 1 ? 'item' : 'items'}</span>{/if}
									{#if rule.priority}<span>P{rule.priority}</span>{/if}
								</span>
							</span>
							<span class="leading" aria-hidden="true"><Icon name="chevron-right" /></span>
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<EmptyState heading="h2" title={copy.empty.recurring.heading} body={copy.empty.recurring.body}>
				{#snippet action()}<Button variant="primary" arrow aria-haspopup="dialog" onclick={() => openForm(null)}>New rule</Button>{/snippet}
			</EmptyState>
		{/if}
	</section>
</div>

{#snippet footer()}
	{#if editing}
		<Button variant="danger" class="hr-delete" onclick={() => ((formOpen = false), (deleting = editing))}><Icon name="trash" />Delete rule</Button>
	{/if}
	<Button onclick={() => (formOpen = false)}>Cancel</Button>
	<Button variant="primary" type="submit" form={FORM}>{editing ? 'Save rule' : 'Add rule'}</Button>
{/snippet}

<Sheet open={formOpen} title={editing ? 'Edit rule' : 'New rule'} onclose={() => (formOpen = false)} actions={footer}>
	{#key formKey}
		<RuleForm aspects={data.aspects} rule={editing} formId={FORM} onsaved={() => (formOpen = false)} />
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
