<script lang="ts">
	import '../../app.css';
	import '$lib/styles/fingerprint/fonts.css';
	import '$lib/styles/fingerprint/tokens.css';
	import '$lib/styles/fingerprint/base.css';
	import '$lib/styles/fingerprint/motion.css';
	import '$lib/styles/fingerprint/layout.css';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import PillBar from '$lib/components/shell/PillBar.svelte';
	import TopBar from '$lib/components/shell/TopBar.svelte';
	import QuickAdd from '$lib/components/todo/QuickAdd.svelte';
	import { reducedMotion } from '$lib/motion';
	import { closeQuickAdd, isQuickAddOpen, quickAddContext } from '$lib/shell/quick-add.svelte';

	let { children, data } = $props();

	// First run (no aspect yet): the Welcome page is the only way forward, so no bars and no "+".
	const bare = $derived(data.nav.aspects.length === 0);
	// A page can state its context with setQuickAddContext; the aspect page and /sprint are also read from the route, so the dialog
	// never depends on the page remembering to.
	const routeAspectId = $derived(page.route.id === '/(app)/aspects/[id]' ? data.nav.aspects.find((a) => String(a.id) === page.params.id)?.id : undefined);
	const context = $derived({ aspectId: routeAspectId, destination: page.route.id === '/(app)/sprint' ? ('sprint' as const) : undefined, ...quickAddContext() });
	const target = $derived(context.destination === 'sprint' && data.nav.activeWeekStart ? ({ kind: 'sprint' } as const) : ({ kind: 'backlog' } as const));

	onNavigate((navigation) => {
		if (!document.startViewTransition || reducedMotion()) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<div class="app" data-photo="/stage/lake-moraine.jpg" style:--photo="url(/stage/lake-moraine.jpg)">
	<div class="frame">
		<figure class="stage" aria-hidden="true"><img class="stage-photo" src="/stage/lake-moraine.jpg" alt="" /></figure>
		{#if !bare}<TopBar />{/if}
		<main class="screen" id="main">
			{@render children()}
		</main>
	</div>
	{#if !bare}<PillBar />{/if}
</div>

{#if !bare}
	<QuickAdd
		variant="dialog"
		aspects={data.nav.aspects}
		{target}
		defaultAspectId={context.aspectId}
		sprintWeekStart={data.nav.activeWeekStart}
		reviewRequired={data.nav.reviewRequired}
		bind:open={isQuickAddOpen, (value) => !value && closeQuickAdd()}
	/>
{/if}

<style>
	/* A focused element in the page scrolls clear of the sticky bars: the dock on the phone, the capsule that the top bar shrinks to from
	   768 px. The room is scroll-margin on the content, not scroll-padding on the root: the root's padding band would make focus inside the
	   bars themselves (and the sheet's autofocus) scroll the page. */
	:global(.screen *) {
		scroll-margin-block: 0 calc(max(var(--space-3), env(safe-area-inset-bottom)) + var(--target-touch) + var(--space-4));
	}

	@media (min-width: 768px) {
		:global(.screen *) {
			scroll-margin-block: calc(var(--target-touch) + var(--space-5)) 0;
		}
	}

	/* The cross-fade is a snapshot laid over the page; clicks and drags go through to the new page. */
	:global(::view-transition) {
		pointer-events: none;
	}

	:global(::view-transition-old(root)),
	:global(::view-transition-new(root)) {
		animation-duration: var(--motion-quick);
		animation-timing-function: var(--ease-out);
	}

	/* The bars are their own transition groups, so only the content fades: the top bar and the dock hold still and the pill glides
	   on the live element instead of cross-fading between two snapshots. */
	:global(.app-bar) {
		view-transition-name: app-bar;
	}

	:global(.dock) {
		view-transition-name: dock;
	}

	:global(::view-transition-group(app-bar)),
	:global(::view-transition-group(dock)) {
		animation: none;
	}

	:global(::view-transition-old(app-bar)),
	:global(::view-transition-old(dock)) {
		display: none;
	}

	:global(::view-transition-new(app-bar)),
	:global(::view-transition-new(dock)) {
		animation: none;
	}

	/* The title clamp clips descenders at the line box; the room is padding below it, taken back as margin so the gap to the next
	   element stays the signed one. */
	:global(.screen-lead h1) {
		padding-block-end: 0.12em;
		margin-block-end: -0.12em;
	}
</style>
