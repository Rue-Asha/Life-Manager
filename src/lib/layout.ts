// Mirrors the `@media (min-width: 768px)` breakpoint in src/routes/+layout.svelte, where the persistent
// primary navigation (sidebar) replaces the phone home list at /menu.
// Whoever moves that breakpoint (e.g. the redesign) must change WIDE_QUERY too, or /menu stops redirecting
// exactly where the sidebar shows.
export const WIDE_QUERY = '(min-width: 768px)';
