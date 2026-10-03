// Aspect palette, icon set and first-run presets. Colours resolve to tokens in
// src/lib/styles/tokens.css; rationale in design/brief.md.

export const ASPECT_COLORS = {
	sage: { label: 'Sage', fg: 'var(--aspect-sage)', tint: 'var(--aspect-sage-tint)' },
	sky: { label: 'Sky', fg: 'var(--aspect-sky)', tint: 'var(--aspect-sky-tint)' },
	lavender: { label: 'Lavender', fg: 'var(--aspect-lavender)', tint: 'var(--aspect-lavender-tint)' },
	ochre: { label: 'Ochre', fg: 'var(--aspect-ochre)', tint: 'var(--aspect-ochre-tint)' },
	berry: { label: 'Berry', fg: 'var(--aspect-berry)', tint: 'var(--aspect-berry-tint)' },
	lagoon: { label: 'Lagoon', fg: 'var(--aspect-lagoon)', tint: 'var(--aspect-lagoon-tint)' },
	tangerine: { label: 'Tangerine', fg: 'var(--aspect-tangerine)', tint: 'var(--aspect-tangerine-tint)' },
	slate: { label: 'Slate', fg: 'var(--aspect-slate)', tint: 'var(--aspect-slate-tint)' }
} as const;

export type AspectColor = keyof typeof ASPECT_COLORS;

// Line icons from Lucide v1.50.0 (ISC licence, https://lucide.dev), each flattened to one
// path for a 24×24 viewBox; render with fill="none", stroke="currentColor",
// stroke-width 2 (1.75 at 16px), round caps and joins.
export const ASPECT_ICONS = {
	heart: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5 M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27",
	cap: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z M22 10v6 M6 12.5V16a6 3 0 0 0 12 0v-3.5",
	briefcase: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16 M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2Z",
	house: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8 M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
	wallet: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1 M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",
	people: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3.128a4 4 0 0 1 0 7.744 M22 21v-2a4 4 0 0 0-3-3.87 M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0",
	dumbbell: "M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z m2.5 21.5 1.4-1.4 m20.1 3.9 1.4-1.4 M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z m9.6 14.4 4.8-4.8",
	book: "M12 5v16 M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z",
	leaf: "M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20 M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13",
	sprout: "M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3 M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4 M5 21h14",
	utensils: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
	plane: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
	music: "M9 18V5l12-2v13 M3 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M15 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
	palette: "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z M13 6.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0 M17 10.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0 M6 12.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0 M8 7.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0",
	code: "m16 18 6-6-6-6 m8 6-6 6 6 6",
	pen: "M13 21h8 M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
	sun: "M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M12 2v2 M12 20v2 m4.93 4.93 1.41 1.41 m17.66 17.66 1.41 1.41 M2 12h2 M20 12h2 m6.34 17.66-1.41 1.41 m19.07 4.93-1.41 1.41",
	moon: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",
	coffee: "M10 2v2 M14 2v2 M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1 M6 2v2",
	car: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2 M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M9 17h6 M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
	baby: "M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5 M15 12h.01 M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1 M9 12h.01",
	paw: "M9 4a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M16 8a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M18 16a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z",
	flower: "M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1 M10 8a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M12 10v12 M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z",
	star: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
} as const;

export type AspectIcon = keyof typeof ASPECT_ICONS;

export const PRESET_ASPECTS: { name: string; color: AspectColor; icon: AspectIcon }[] = [
	{ name: 'Health', color: 'sage', icon: 'heart' },
	{ name: 'Uni', color: 'lavender', icon: 'cap' },
	{ name: 'Job', color: 'sky', icon: 'briefcase' },
	{ name: 'Home', color: 'ochre', icon: 'house' },
	{ name: 'Finance', color: 'lagoon', icon: 'wallet' },
	{ name: 'Social', color: 'berry', icon: 'people' }
];
