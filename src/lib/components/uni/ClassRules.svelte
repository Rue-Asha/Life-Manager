<!-- The class's recurring rules, in the "Recurring" side panel: title, type tag and cadence, with a link on to /recurring. -->
<script lang="ts">
	import type { RecurringRule } from '$lib/types';
	import { WEEKDAYS } from '../recurring/RuleForm.svelte';
	import Button from '../button/Button.svelte';
	import ClassTag from './ClassTag.svelte';
	import './uni.css';

	let { rules }: { rules: RecurringRule[] } = $props();

	function cadence(rule: RecurringRule): string {
		if (rule.weekdays.length === 7) return 'Daily';
		return `Weekly, ${WEEKDAYS.filter((d) => rule.weekdays.includes(d.value)).map((d) => d.short).join(', ')}`;
	}
</script>

{#if rules.length}
	<ul class="u-rows">
		{#each rules as rule (rule.id)}
			<li class="u-row static" aria-label={rule.title}>
				<div class="main">
					<span class="text">
						<span class="title" data-user>{rule.title}</span>
						<span class="facts meta">{#if rule.type}<ClassTag type={rule.type} />{/if}<span>{cadence(rule)}</span></span>
					</span>
				</div>
			</li>
		{/each}
	</ul>
{:else}
	<p class="u-note">No recurring rules for this class.</p>
{/if}
<div class="u-tail"><Button size="s" href="/recurring">Edit in Recurring</Button></div>
