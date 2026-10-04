<script lang="ts">
	import { ASPECT_COLORS, type AspectColor, type AspectIcon as AspectIconName } from '../../aspect-style';
	import type { UniClass } from '../../types';
	import { GRADES, uniMessage } from '../../uni';
	import AspectIcon from '../ui/AspectIcon.svelte';
	import ColorIconPicker from '../ui/ColorIconPicker.svelte';
	import { UI_ICONS } from '../ui/icons';

	// Only the fields: the overview and the class detail each own the <form> and its action.
	let { cls, error }: { cls?: UniClass; error?: { error: string; field?: string; fields?: Record<string, string> } } = $props();

	const uid = $props.id();
	// The form is re-created for every open, so the initial values are all it needs from `cls`.
	// svelte-ignore state_referenced_locally
	let color = $state<AspectColor>(cls?.color ?? 'sky');
	// svelte-ignore state_referenced_locally
	let icon = $state<AspectIconName>(cls?.icon ?? 'book');
	// svelte-ignore state_referenced_locally
	let links = $state(cls?.links.length ? cls.links.map((l) => ({ ...l })) : [{ label: '', url: '' }]);
	// examAt is a date with an optional time; two inputs keep "no time" expressible.
	// svelte-ignore state_referenced_locally
	let examDate = $state(cls?.examAt?.slice(0, 10) ?? '');
	// svelte-ignore state_referenced_locally
	let examTime = $state(cls?.examAt?.slice(11, 16) ?? '');
	const examAt = $derived(examDate ? (examTime ? `${examDate}T${examTime}` : examDate) : '');

	const message = (field: string) => {
		const code = error?.fields?.[field] ?? (error?.field === field ? error.error : undefined);
		return code ? uniMessage(code, field) : null;
	};
	const errorId = (field: string) => (message(field) ? `${uid}-${field}-error` : undefined);
</script>

<div class="fields">
	<div class="field">
		<label for="{uid}-name">Name</label>
		<div class="name">
			<span class="tile" style:background={ASPECT_COLORS[color].tint}>
				<AspectIcon {icon} {color} />
			</span>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				id="{uid}-name"
				name="name"
				value={cls?.name ?? ''}
				placeholder="Analysis II"
				autocomplete="off"
				autofocus
				aria-invalid={message('name') ? true : undefined}
				aria-describedby={errorId('name')}
			/>
		</div>
		{#if message('name')}<p class="error" id="{uid}-name-error" role="alert">{message('name')}</p>{/if}
	</div>

	<div class="field">
		<ColorIconPicker bind:color bind:icon />
		{#each ['color', 'icon'] as field (field)}
			{#if message(field)}<p class="error" role="alert">{message(field)}</p>{/if}
		{/each}
	</div>

	<div class="two">
		<div class="field">
			<label for="{uid}-lecturer">Lecturer</label>
			<input id="{uid}-lecturer" name="lecturer" value={cls?.lecturer ?? ''} autocomplete="off" />
		</div>
		<div class="field">
			<label for="{uid}-room">Room</label>
			<input id="{uid}-room" name="room" value={cls?.room ?? ''} autocomplete="off" />
		</div>
	</div>

	<div class="two">
		<div class="field">
			<label for="{uid}-ects">ECTS</label>
			<input
				id="{uid}-ects"
				class="num"
				name="ects"
				value={cls?.ects ?? ''}
				inputmode="decimal"
				autocomplete="off"
				aria-invalid={message('ects') ? true : undefined}
				aria-describedby={errorId('ects')}
			/>
			{#if message('ects')}<p class="error" id="{uid}-ects-error" role="alert">{message('ects')}</p>{/if}
		</div>
		<div class="field">
			<label for="{uid}-grade">Grade</label>
			<select
				id="{uid}-grade"
				name="grade"
				value={cls?.grade ?? ''}
				aria-invalid={message('grade') ? true : undefined}
				aria-describedby={errorId('grade')}
			>
				<option value="">No grade</option>
				{#each GRADES as grade (grade)}
					<option value={grade}>{grade === 'passed' ? 'Passed' : grade}</option>
				{/each}
			</select>
			{#if message('grade')}<p class="error" id="{uid}-grade-error" role="alert">{message('grade')}</p>{/if}
		</div>
	</div>

	<fieldset class="field" aria-describedby={errorId('links')}>
		<legend>Links</legend>
		{#each links as link, i}
			<div class="link-row">
				<input
					name="linkLabel"
					aria-label="Link {i + 1} label"
					placeholder="Moodle"
					autocomplete="off"
					bind:value={link.label}
				/>
				<input
					name="linkUrl"
					aria-label="Link {i + 1} URL"
					placeholder="https://"
					inputmode="url"
					autocomplete="off"
					aria-invalid={message('links') ? true : undefined}
					bind:value={link.url}
				/>
				<button type="button" class="icon-btn" aria-label="Remove link {i + 1}" onclick={() => links.splice(i, 1)}>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.x} /></svg>
				</button>
			</div>
		{/each}
		<button type="button" class="add-link" onclick={() => links.push({ label: '', url: '' })}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={UI_ICONS.plus} /></svg>Add link
		</button>
		{#if message('links')}<p class="error" id="{uid}-links-error" role="alert">{message('links')}</p>{/if}
	</fieldset>

	<div class="two">
		<fieldset class="field" aria-describedby={errorId('examAt')}>
			<legend>Exam date and time</legend>
			<input type="hidden" name="examAt" value={examAt} />
			<div class="exam">
				<input
					type="date"
					class="num"
					aria-label="Exam date"
					aria-invalid={message('examAt') ? true : undefined}
					bind:value={examDate}
				/>
				<input type="time" class="num" aria-label="Exam time" disabled={!examDate} bind:value={examTime} />
			</div>
			{#if message('examAt')}<p class="error" id="{uid}-examAt-error" role="alert">{message('examAt')}</p>{/if}
		</fieldset>
		<div class="field">
			<label for="{uid}-examRoom">Exam room</label>
			<input id="{uid}-examRoom" name="examRoom" value={cls?.examRoom ?? ''} autocomplete="off" />
		</div>
	</div>
</div>

<style>
	.fields {
		display: grid;
		gap: var(--space-4);
	}

	.field {
		display: grid;
		gap: var(--space-1);
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}

	label,
	legend {
		padding: 0;
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--ink-2);
	}

	legend {
		margin-bottom: var(--space-1);
	}

	input,
	select {
		width: 100%;
		min-width: 0;
		min-height: var(--control-height);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--paper);
	}

	input::placeholder {
		color: var(--ink-3);
	}

	input:disabled {
		color: var(--ink-3);
	}

	[aria-invalid='true'] {
		border-color: var(--ink);
		box-shadow: inset 0 0 0 1px var(--ink);
	}

	.error {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--ink);
	}

	.name {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.tile {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		flex: none;
		border-radius: var(--radius-sm);
	}

	.two {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-3);
	}

	.link-row {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 3fr) auto;
		gap: var(--space-2);
		align-items: center;
	}

	.exam {
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		gap: var(--space-2);
	}

	.icon-btn,
	.add-link {
		display: inline-flex;
		align-items: center;
		border: 0;
		background: none;
		color: var(--ink-2);
		cursor: pointer;
	}

	.icon-btn {
		justify-content: center;
		width: var(--control-height);
		height: var(--control-height);
		border-radius: var(--radius-md);
	}

	.icon-btn:hover {
		background: var(--paper-hover);
		color: var(--ink);
	}

	.add-link {
		justify-self: start;
		gap: var(--space-1);
		height: var(--control-height);
		padding: 0;
		font-size: var(--text-sm);
	}

	.add-link:hover {
		color: var(--ink);
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

	@media (max-width: 767px) {
		.two {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
