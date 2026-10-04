// UI glyphs for the shell and primitives, from Lucide (ISC licence, https://lucide.dev),
// flattened to one path each like ASPECT_ICONS in src/lib/aspect-style.ts.
export const UI_ICONS = {
	check: 'M20 6 9 17l-5-5',
	plus: 'M5 12h14 M12 5v14',
	x: 'M18 6 6 18 M6 6l12 12',
	'chevron-left': 'M0 0m15 18-6-6 6-6',
	calendar: 'M8 2v3 M16 2v3 M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2Z M3 9h18',
	'calendar-days':
		'M8 2v3 M16 2v3 M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2Z M3 9h18 M8 13h.01 M12 13h.01 M16 13h.01 M8 17h.01 M12 17h.01 M16 17h.01',
	'list-checks': 'M13 5h8 M13 12h8 M13 19h8 M0 0m3 17 2 2 4-4 M0 0m3 7 2 2 4-4',
	repeat: 'M0 0m17 2 4 4-4 4 M3 11v-1a4 4 0 0 1 4-4h14 M0 0m7 22-4-4 4-4 M21 13v1a4 4 0 0 1-4 4H3',
	inbox:
		'M22 12L16 12L14 15L10 15L8 12L2 12 M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
	layers:
		'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12 M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17',
	flag: 'M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528',
	folder:
		'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
	'git-branch':
		'M6 3v12 M0 0m18 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M0 0m6 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M18 9a9 9 0 0 1-9 9',
	'graduation-cap':
		'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z M22 10v6 M6 12.5V16a6 3 0 0 0 12 0v-3.5',
	sun: 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M12 2v2 M12 20v2 M0 0m4.93 4.93 1.41 1.41 M0 0m17.66 17.66 1.41 1.41 M2 12h2 M20 12h2 M0 0m6.34 17.66-1.41 1.41 M0 0m19.07 4.93-1.41 1.41'
} as const;

export type UiIcon = keyof typeof UI_ICONS;
