<!--
	The fields of a class, on the field primitives: name, colour and icon, lecturer, room, ECTS, grade, links, exam date, time and room. The sheets of the
	overview ("New class") and of the class page ("Edit details") own the <form> and its action; the form is re-created for every open, so the initial
	values are all it needs from `cls`.
-->
<script lang="ts">
	import type { AspectColor, AspectIcon as AspectIconName } from '../../aspect-style';
	import type { UniClass } from '../../types';
	import { GRADES, uniMessage } from '../../uni';
	import Field from '../field/Field.svelte';
	import Select from '../select/Select.svelte';
	import Icon from '../shell/Icon.svelte';
	import Button from '../button/Button.svelte';
	import ColorIconPicker from '../ui/ColorIconPicker.svelte';
	import './uni.css';

	let { cls, error }: { cls?: UniClass; error?: { error: string; field?: string; fields?: Record<string, string> } } = $props();

	/* svelte-ignore state_referenced_locally */
	let color = $state<AspectColor>(cls?.color ?? 'sky');
	/* svelte-ignore state_referenced_locally */
	let icon = $state<AspectIconName>(cls?.icon ?? 'book');
	/* svelte-ignore state_referenced_locally */
	let name = $state(cls?.name ?? '');
	/* svelte-ignore state_referenced_locally */
	let lecturer = $state(cls?.lecturer ?? '');
	/* svelte-ignore state_referenced_locally */
	let room = $state(cls?.room ?? '');
	/* svelte-ignore state_referenced_locally */
	let ects = $state(cls?.ects === null || cls?.ects === undefined ? '' : String(cls.ects));
	/* svelte-ignore state_referenced_locally */
	let grade = $state<string>(cls?.grade ?? '');
	/* svelte-ignore state_referenced_locally */
	let links = $state(cls?.links.length ? cls.links.map((l) => ({ ...l })) : [{ label: '', url: '' }]);
	/* svelte-ignore state_referenced_locally */
	let examDate = $state(cls?.examAt?.slice(0, 10) ?? '');
	/* svelte-ignore state_referenced_locally */
	let examTime = $state(cls?.examAt?.slice(11, 16) ?? '');
	/* svelte-ignore state_referenced_locally */
	let examRoom = $state(cls?.examRoom ?? '');
	const examAt = $derived(examDate ? (examTime ? `${examDate}T${examTime}` : examDate) : '');

	const message = (field: string) => {
		const code = error?.fields?.[field] ?? (error?.field === field ? error.error : undefined);
		return code ? uniMessage(code, field) : undefined;
	};
</script>

<div class="u-form">
	<Field label="Name" name="name" placeholder="Analysis II" autocomplete="off" autofocus data-user error={message('name')} bind:value={name} />

	<div class="u-stack">
		<ColorIconPicker bind:color bind:icon />
		{#each ['color', 'icon'] as field (field)}
			{#if message(field)}<p class="u-error" role="alert"><Icon name="alert" size={14} />{message(field)}</p>{/if}
		{/each}
	</div>

	<div class="u-cols">
		<Field label="Lecturer" name="lecturer" autocomplete="off" data-user bind:value={lecturer} />
		<Field label="Room" name="room" autocomplete="off" data-user bind:value={room} />
		<Field label="ECTS" name="ects" inputmode="decimal" autocomplete="off" error={message('ects')} bind:value={ects} />
		<Select label="Grade" name="grade" error={message('grade')} bind:value={grade}>
			<option value="">No grade</option>
			{#each GRADES as g (g)}<option value={g}>{g === 'passed' ? 'Passed' : g}</option>{/each}
		</Select>
	</div>

	<fieldset class="u-fieldset">
		<legend>Links</legend>
		<div class="u-stack">
			{#each links as link, i (i)}
				<div class="u-cols">
					<Field label="Link {i + 1} label" name="linkLabel" placeholder="Moodle" autocomplete="off" data-user bind:value={link.label} />
					<Field label="Link {i + 1} URL" name="linkUrl" placeholder="https://" inputmode="url" autocapitalize="none" autocorrect="off" autocomplete="off" data-user error={i === 0 ? message('links') : undefined} bind:value={link.url} />
				</div>
				<div class="u-cluster"><Button variant="quiet" size="s" label="Remove link {i + 1}" onclick={() => links.splice(i, 1)}><Icon name="trash" size={16} />Remove link {i + 1}</Button></div>
			{/each}
			<div class="u-cluster"><Button size="s" onclick={() => links.push({ label: '', url: '' })}><Icon name="plus" size={16} />Add link</Button></div>
		</div>
	</fieldset>

	<fieldset class="u-fieldset">
		<legend>Exam</legend>
		<input type="hidden" name="examAt" value={examAt} />
		<div class="u-cols">
			<Field label="Exam date" type="date" error={message('examAt')} bind:value={examDate} />
			<Field label="Exam time" type="time" disabled={!examDate} hint={examDate ? undefined : 'Disabled until a date is set.'} bind:value={examTime} />
			<Field label="Exam room" name="examRoom" autocomplete="off" data-user bind:value={examRoom} />
		</div>
	</fieldset>
</div>

<style>
	.u-form {
		display: grid;
		gap: var(--space-4);
		min-inline-size: 0;
	}
	.u-cols {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
		align-items: start;
		gap: var(--space-3) var(--space-4);
		min-inline-size: 0;
	}
	.u-error {
		margin: 0;
		font-size: var(--type-caption-size);
		line-height: var(--type-caption-line);
		font-weight: var(--weight-semibold);
		color: var(--danger);
	}
</style>
