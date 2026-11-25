<script lang="ts">
	import { pill } from '../shell/pill';
	import Button from '../ui/Button.svelte';

	let { view, onselect }: { view: 'aspect' | 'board' | 'week'; onselect: (view: 'aspect' | 'board' | 'week') => void } = $props();

	const VIEWS = [
		{ id: 'aspect', label: 'By aspect' },
		{ id: 'board', label: 'Board' },
		{ id: 'week', label: 'Week' }
	] as const;
</script>

<!-- The view is the URL's ?view=; a plain click replaces it in place (no history entry, no reload), a modified click opens the link. -->
<nav class="seg hs-view-nav" aria-label="Sprint view">
	<ul class="hs-track" data-pill use:pill>
		{#each VIEWS as { id, label } (id)}
			<li>
				<Button
					variant="quiet"
					size="s"
					href={id === 'aspect' ? '/sprint' : `/sprint?view=${id}`}
					data-press
					aria-current={view === id ? 'page' : undefined}
					onclick={(e) => {
						if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
						e.preventDefault();
						onselect(id);
					}}>{label}</Button
				>
			</li>
		{/each}
	</ul>
</nav>
