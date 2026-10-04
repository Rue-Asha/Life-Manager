import type { AspectColor, AspectIcon } from '$lib/aspect-style';

export type Id = number;
export type IsoDate = string; // 'YYYY-MM-DD', Europe/Berlin calendar
export type Priority = 0 | 1 | 2 | 3; // 0 = none, 1 = P1 (highest)
export type Status = 'todo' | 'doing' | 'done';
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7; // ISO, 1 = Monday
export type ReviewState = 'running' | 'review-available' | 'review-required';
export type SprintPhase = 'none' | 'planning' | ReviewState; // 'none' = no active/planning sprint
export type ReviewDecision = 'carry' | 'backlog' | 'drop';
export type Target = { kind: 'backlog' } | { kind: 'sprint' } | { kind: 'day'; day: IsoDate };
export type Result<T> = { ok: true; value: T } | { ok: false; error: string; field?: string; fields?: Record<string, string> };
// 'review-required': adding to the sprint while its review is required.
export type AddToSprintError = 'no-active-sprint' | 'review-required' | 'not-found' | 'day-outside-sprint';

export interface Aspect {
	id: Id;
	name: string;
	color: AspectColor;
	icon: AspectIcon;
	position: number;
}

export interface AspectProgress {
	done: number;
	total: number;
}

export interface Placement {
	day?: IsoDate | null;
	status?: Status;
}

export interface ChecklistItem {
	id: Id;
	todoId: Id;
	text: string;
	done: boolean;
	position: number;
}

export interface Todo {
	id: Id;
	title: string;
	aspectId: Id;
	notes: string;
	priority: Priority;
	dueDate: IsoDate | null;
	sprintId: Id | null;
	status: Status;
	day: IsoDate | null;
	recurring: boolean;
	ruleId: Id | null;
	projectId: Id | null;
	classId: Id | null;
	type: ClassType | null;
	revisedAt: IsoDate | null;
	checklist: ChecklistItem[];
	createdAt: string;
	completedAt: string | null;
}

export interface Sprint {
	id: Id;
	weekStart: IsoDate | null;
	state: 'planning' | 'active' | 'closed';
	startedAt: string | null;
	closedAt: string | null;
}

export interface RecurringRule {
	id: Id;
	title: string;
	aspectId: Id;
	weekdays: Weekday[];
	notes: string;
	priority: Priority;
	checklist: string[];
	classId: Id | null;
	type: ClassType | null;
}

export interface NewTodo {
	title: string;
	aspectId: Id;
	notes?: string;
	priority?: Priority;
	dueDate?: IsoDate | null;
	checklist?: string[];
	target?: Target;
	projectId?: Id | null;
	classId?: Id | null;
	type?: ClassType | null;
}

export interface TodoPatch {
	title?: string;
	aspectId?: Id;
	notes?: string;
	priority?: Priority;
	dueDate?: IsoDate | null;
	projectId?: Id | null;
	classId?: Id | null;
	type?: ClassType | null;
}

export interface AspectInput {
	name: string;
	color: AspectColor;
	icon: AspectIcon;
}

export interface RuleInput {
	title: string;
	aspectId: Id;
	weekdays: Weekday[];
	notes?: string;
	priority?: Priority;
	checklist?: string[];
	classId?: Id | null;
	type?: ClassType | null;
}

export type ProjectStatus = 'backlog' | 'active' | 'in_progress' | 'paused' | 'implemented';

export interface Project {
	id: Id;
	name: string;
	description: string;
	repoUrl: string | null;
	tags: string[];
	notes: string;
	status: ProjectStatus;
	createdAt: string;
	updatedAt: string;
}

export interface ProjectSummary extends Omit<Project, 'notes'> {
	openTodos: number;
}

export interface ProjectRef {
	id: Id;
	name: string;
	status: ProjectStatus;
}

// tags is the raw comma-separated text from the form.
export interface ProjectInput {
	name: string;
	description?: string;
	repoUrl?: string;
	tags?: string;
}

export interface ProjectTodos {
	open: Todo[];
	planned: Todo[];
	done: Todo[];
}

export type ClassType = 'LEC' | 'EXC' | 'OTH';
export type Grade = '1.0' | '1.3' | '1.7' | '2.0' | '2.3' | '2.7' | '3.0' | '3.3' | '3.7' | '4.0' | '5.0' | 'passed';

export interface ClassLink {
	label: string;
	url: string;
}

export interface Semester {
	id: Id;
	name: string;
	archivedAt: string | null;
	createdAt: string;
}

export interface UniClass {
	id: Id;
	semesterId: Id;
	name: string;
	color: AspectColor;
	icon: AspectIcon;
	notes: string;
	lecturer: string | null;
	room: string | null;
	ects: number | null;
	links: ClassLink[];
	examAt: string | null; // 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM'
	examRoom: string | null;
	grade: Grade | null;
	createdAt: string;
	updatedAt: string;
}

export interface ClassSummary extends Omit<UniClass, 'notes'> {
	openTodos: number;
	nextDue: IsoDate | null;
}

export interface ClassRef {
	id: Id;
	name: string;
	color: AspectColor;
	icon: AspectIcon;
	semesterId: Id;
	archived: boolean;
}

// Raw form strings; the server validates and converts.
export interface ClassInput {
	name: string;
	color: string;
	icon: string;
	lecturer?: string;
	room?: string;
	ects?: string;
	links?: ClassLink[];
	examAt?: string;
	examRoom?: string;
	grade?: string;
}

export interface GradeSummary {
	average: number | null;
	earnedEcts: number;
}

export interface SemesterView extends Semester {
	classes: ClassSummary[];
	grades: GradeSummary;
}

export interface Deadline {
	kind: 'todo' | 'exam';
	date: IsoDate;
	title: string;
	classId: Id;
	todoId: Id | null;
	type: ClassType | null;
	overdue: boolean;
}

export interface ClassTodos {
	open: Todo[];
	planned: Todo[];
	done: Todo[];
}
