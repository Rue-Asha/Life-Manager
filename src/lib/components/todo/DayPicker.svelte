<script lang="ts" module>
	import type { MenuItem } from '../menu/Menu.svelte';
	import type { Id, IsoDate, Status } from '$lib/types';
	import { dayLabel } from './format';
	import { planError, type ActionError } from './form';
	import { postTodo } from './post';

	const STATUSES: [Status, string][] = [
		['todo', 'To do'],
		['doing', 'Doing'],
		['done', 'Done']
	];

	export const statusItems = (status: Status, group = true): MenuItem[] =>
		STATUSES.map(([value, label], i) => ({ label, value: `status:${value}`, checked: value === status, radio: true, group: group && i === 0 ? 'Status' : undefined }));

	// The Day group and the way back to the backlog: what drag does on a sprint row, for touch and keyboard.
	export function dayItems(day: IsoDate | null, sprintDays: IsoDate[], recurring: boolean): MenuItem[] {
		const days = [{ id: '', label: 'Unscheduled' }, ...sprintDays.map((d) => ({ id: d, label: dayLabel(d) }))];
		return [
			...days.map((d, i) => ({ label: d.label, value: `day:${d.id}`, checked: d.id === (day ?? ''), radio: true, group: i === 0 ? 'Day' : undefined })),
			{ label: recurring ? 'Remove from sprint' : 'Move to backlog', value: 'back', radio: false, separator: true }
		];
	}

	// Runs a chosen item against the todo; a refusal comes back as the sentence to show.
	export async function runItem(
		todoId: Id,
		item: MenuItem,
		handlers: { onremove: () => void; onerror: (message: string) => void; status?: Status }
	): Promise<void> {
		const [kind, value = ''] = (item.value ?? '').split(/:(.*)/s);
		let error: ActionError | null = null;
		if (kind === 'back') {
			if (handlers.onremove && item.label === 'Remove from sprint') return handlers.onremove();
			error = await postTodo('moveToBacklog', { id: String(todoId) });
		} else if (kind === 'day') {
			error = await postTodo('setDay', { id: String(todoId), day: value });
		} else if (kind === 'status') {
			if (value === handlers.status) return;
			error = await postTodo('setStatus', { id: String(todoId), status: value });
		}
		if (error) handlers.onerror(planError(error) ?? 'Couldn’t move that todo — try again.');
	}
</script>

<!--
	A sprint row's "More actions": the Day group, then "Move to backlog" (a recurring instance: "Remove from sprint"). `withStatus` puts the Status
	group first (Board cards have no status glyph). A menu on the menu primitive, anchored to the button.
-->
<script lang="ts">
	import PopMenu from '../menu/PopMenu.svelte';
	import Button from '../ui/Button.svelte';
	import { UI_ICONS } from '../ui/icons';

	let {
		todoId,
		day,
		sprintDays = [],
		recurring = false,
		status,
		withStatus = false,
		onremove,
		onerror
	}: {
		todoId: Id;
		day: IsoDate | null;
		sprintDays?: IsoDate[];
		recurring?: boolean;
		status?: Status;
		withStatus?: boolean;
		onremove: () => void;
		onerror: (message: string) => void;
	} = $props();

	const items = $derived([...(withStatus && status ? statusItems(status) : []), ...dayItems(day, sprintDays, recurring)]);
</script>

<PopMenu name="More actions" {items} radio onselect={(item) => runItem(todoId, item, { onremove, onerror, status })}>
	{#snippet trigger(attrs)}
		<Button variant="quiet" icon type="button" label="More actions" {...attrs}>
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d={UI_ICONS.more} /></svg>
		</Button>
	{/snippet}
</PopMenu>
