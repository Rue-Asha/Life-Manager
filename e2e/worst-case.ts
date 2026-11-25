import { reset, seed, setClock, type SeedInput } from './helpers';

// Sunday 11 October 2026 in Berlin: the sprint of 5–11 October is still running and its review is open.
export const SUNDAY = '2026-10-11T10:00:00Z';
const WEEK = '2026-10-05';

const LONG_URL = 'https://example.com/a/very/long/link/that/should/wrap/instead/of/scrolling/sideways/at/any/width';

const ASPECTS: SeedInput['aspects'] = [
	{ name: 'Health', color: 'sage', icon: 'heart' },
	{ name: 'University, exams and everything around the final thesis', color: 'lavender', icon: 'cap' },
	{ name: 'Home', color: 'ochre', icon: 'house' },
	{ name: 'IT', color: 'sky', icon: 'briefcase' },
	{ name: 'Ä', color: 'berry', icon: 'star' },
	{ name: 'Supercalifragilisticexpialidocious-Wohnungsrenovierungsvorhaben', color: 'tangerine', icon: 'house' }
];

const PROJECTS: SeedInput['projects'] = [
	{
		name: 'A self-hosted weekly planner with an unreasonably long name that keeps going',
		description: 'Plans the week across several life aspects and keeps the notes next to the todos that belong to them',
		repoUrl: 'https://github.com/rue-asha/a-very-long-repository-name-that-keeps-going-and-going-and-going',
		tags: ['SvelteKit', 'SQLite', 'TypeScript', 'adapter-node', 'Playwright', 'a-tag-that-is-rather-long-indeed'],
		notes: `## Plan\n\n${LONG_URL}\n\n- one\n- two\n\n${'A long paragraph of notes. '.repeat(40)}`,
		status: 'active'
	},
	{ name: 'Idea', status: 'backlog' },
	{ name: 'Shipped', status: 'implemented' },
	{ name: 'Ünïcödé 日本語 🚀', status: 'active' }
];

const long = (n: number) => `Todo ${n}: a title that is long enough to wrap onto a second line on a phone and then some more words`;

export const TODOS: SeedInput['todos'] = [
	{ title: 'Morning run', inSprint: true, day: '2026-10-11', status: 'done', priority: 2 },
	{
		title: 'Draft the cover letter for the summer internship application and ask for feedback',
		aspect: 1,
		inSprint: true,
		day: '2026-10-11',
		status: 'doing',
		priority: 1,
		dueDate: '2026-10-12',
		notes: 'Mention the lab project',
		checklist: ['Outline', 'First draft', 'Ask for feedback']
	},
	{ title: 'Gym', rule: 0, inSprint: true, day: '2026-10-08' },
	{ title: 'Clean the fridge', aspect: 2, inSprint: true },
	{ title: 'Pay the electricity bill before the reminder arrives', aspect: 2, dueDate: '2026-10-09', priority: 2 },
	{ title: 'Read chapter 4', aspect: 1, priority: 3 },
	{ title: 'Book a physio appointment' },
	{ title: 'Wire the projects overview into the navigation', aspect: 3, project: 0, inSprint: true },
	{ title: 'Write the migration', aspect: 3, project: 0 },
	{ title: 'Design the mockup', aspect: 3, project: 0, inSprint: true, status: 'done', completedAt: '2026-10-06T09:00:00Z' },
	{ title: 'Exercise sheet 3: eigenvalues and diagonalisation', aspect: 1, class: 0, type: 'EXC', inSprint: true, day: '2026-10-11', dueDate: '2026-10-13', revisedAt: '2026-10-08' },
	{ title: 'Rewatch the lecture on spectral theory', aspect: 1, class: 0, type: 'LEC', dueDate: '2026-10-09' },
	{ title: 'Prepare the seminar presentation', aspect: 1, class: 1, type: 'OTH', status: 'done', completedAt: '2026-10-07T09:00:00Z' },
	{ title: 'Pneumonoultramicroscopicsilicovolcanoconiosis-Donaudampfschifffahrtsgesellschaftskapitän', aspect: 5, inSprint: true, day: '2026-10-09' },
	{ title: 'Ünïcödé 日本語 🚀 title with an emoji', aspect: 4, inSprint: true, day: '2026-10-10' },
	{ title: 'Ä', aspect: 4, priority: 1 },
	...Array.from({ length: 14 }, (_, i) => ({ title: long(i + 1), aspect: i % 6, inSprint: i % 2 === 0, day: i % 4 === 0 ? '2026-10-10' : undefined })),
	...Array.from({ length: 10 }, (_, i) => ({ title: `Backlog filler ${i + 1}`, aspect: i % 6, priority: ((i % 3) + 1) as 1 | 2 | 3 }))
];

const SEMESTERS: SeedInput['semesters'] = [
	{ name: 'Winter semester 2026/27 with a rather long name', createdAt: '2026-10-01T09:00:00Z' },
	{ name: 'Summer semester 2026', archivedAt: '2026-09-30T09:00:00Z', createdAt: '2026-04-01T09:00:00Z' }
];

const CLASSES: SeedInput['classes'] = [
	{
		semester: 0,
		name: 'Linear Algebra and Analytic Geometry for Computer Scientists',
		color: 'lavender',
		icon: 'book',
		lecturer: 'Prof. Dr. Maximiliane Schwarzenberger-Hohenstein',
		room: 'Hörsaal 1 im Hauptgebäude, Erdgeschoss',
		ects: 9,
		links: [{ label: 'Moodle course page', url: `https://moodle.example.edu/course/view.php?id=123456789&section=a-very-long-section&x=${'y'.repeat(60)}` }],
		examAt: '2027-02-10T09:00',
		examRoom: 'Audimax',
		notes: `## Notes\n\n${LONG_URL}\n\n${'Notes that go on. '.repeat(50)}`,
		grade: '1.3'
	},
	{ semester: 0, name: 'Seminar', color: 'sky', icon: 'cap', ects: 3 },
	{ semester: 1, name: 'Programming I', color: 'sage', icon: 'briefcase', ects: 6, grade: 'passed' }
];

export async function seedWorstCase(request: Parameters<typeof seed>[0]) {
	await reset(request);
	await setClock(request, SUNDAY);
	return seed(request, {
		aspects: ASPECTS,
		sprint: { state: 'active', weekStart: WEEK },
		rules: [{ title: 'Gym', weekdays: [1, 4], checklist: ['Warm up'] }],
		itAspect: 3,
		uniAspect: 1,
		semesters: SEMESTERS,
		classes: CLASSES,
		projects: PROJECTS,
		todos: TODOS
	});
}

// Every route but Welcome and Plan, which need an empty app and a closed review.
export const routes = (aspect: number, project: number, cls: number): [string, string][] => [
	['/', 'today'],
	['/sprint?view=aspect', 'sprint-aspect'],
	['/sprint?view=board', 'sprint-board'],
	['/sprint?view=week', 'sprint-week'],
	['/sprint/review', 'review'],
	['/calendar', 'calendar'],
	['/backlog', 'backlog'],
	['/aspects', 'aspects'],
	[`/aspects/${aspect}`, 'aspect-page'],
	['/recurring', 'recurring'],
	['/projects', 'projects'],
	[`/projects/${project}`, 'project-detail'],
	['/uni', 'uni'],
	[`/uni/classes/${cls}`, 'class-detail'],
	['/menu', 'menu'],
	['/sync', 'sync']
];
