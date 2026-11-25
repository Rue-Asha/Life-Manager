<script lang="ts" module>
	import type { Status } from '$lib/types';

	export const STATUS_LABELS: Record<Status, string> = { todo: 'To do', doing: 'Doing', done: 'Done' };
</script>

<!--
	A sprint row's status as a glyph (empty ring To do, half disc Doing, filled disc with a check Done) that opens the status menu on the
	menu primitive; its name is "Status: <label>". The glyph changes at once, the post follows. `small` is the week chip's glyph.
-->
<script lang="ts">
	import type { Id, IsoDate } from '$lib/types';
	import type { MenuItem } from '../menu/Menu.svelte';
	import PopMenu from '../menu/PopMenu.svelte';
	import { UI_ICONS } from '../ui/icons';
	import { dayItems, runItem, statusItems } from './DayPicker.svelte';

	// With `sprintDays` the menu also holds the Day group and the way back to the backlog (a week chip has no "More actions").
	let {
		todoId,
		status,
		small = false,
		day = null,
		sprintDays,
		recurring = false,
		onremove = () => {},
		onerror = () => {}
	}: {
		todoId: Id;
		status: Status;
		small?: boolean;
		day?: IsoDate | null;
		sprintDays?: IsoDate[];
		recurring?: boolean;
		onremove?: () => void;
		onerror?: (message: string) => void;
	} = $props();

	let pending = $state<Status | null>(null);
	$effect(() => {
		void status;
		pending = null;
	});
	const shown = $derived(pending ?? status);

	const items = $derived([...statusItems(shown, false).map((i, n) => ({ ...i, group: n === 0 ? 'Status' : undefined })), ...(sprintDays ? dayItems(day, sprintDays, recurring) : [])]);

	function choose(item: MenuItem) {
		if (item.value?.startsWith('status:')) {
			const value = item.value.slice(7) as Status;
			if (value === shown) return;
			pending = value;
			runItem(todoId, item, { onremove, onerror: (m) => ((pending = null), onerror(m)) });
		} else runItem(todoId, item, { onremove, onerror });
	}
</script>

<PopMenu name={sprintDays ? 'Status and day' : 'Status'} {items} radio onselect={choose}>
	{#snippet trigger(attrs)}
		<button type="button" class="glyph" class:small data-press="round" data-status={shown} aria-label="Status: {STATUS_LABELS[shown]}" {...attrs}>
			<span>
				{#if shown === 'done'}
					<svg viewBox="0 0 24 24" width={small ? 12 : 14} height={small ? 12 : 14} fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={UI_ICONS.check} /></svg>
				{/if}
			</span>
		</button>
	{/snippet}
</PopMenu>

<style>
	.glyph {
		display: grid;
		place-items: center;
		flex: none;
		inline-size: max(var(--control-height), var(--target));
		block-size: max(var(--control-height), var(--target));
		padding: 0;
		border: 0;
		border-radius: var(--radius-round);
		background: none;
		color: var(--ink);
	}
	.glyph > span {
		display: grid;
		place-items: center;
		inline-size: var(--space-6);
		block-size: var(--space-6);
		border-radius: var(--radius-round);
		box-shadow: var(--ring-control);
		background: var(--surface-raised);
	}
	/* Doing is a half-filled disc: a shape between the empty ring and the filled Done, never a tint alone. */
	.glyph[data-status='doing'] > span {
		background: linear-gradient(90deg, var(--ink) 50%, var(--surface-raised) 50%);
	}
	.glyph[data-status='done'] > span {
		background: var(--surface-inverse);
		box-shadow: none;
		color: var(--ink-on-inverse);
	}
	.glyph.small {
		inline-size: max(var(--space-7), var(--target));
		block-size: max(var(--space-7), var(--target));
	}
	.glyph.small > span {
		inline-size: var(--space-5);
		block-size: var(--space-5);
	}
</style>
