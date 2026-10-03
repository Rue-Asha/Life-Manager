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
export type Result<T> = { ok: true; value: T } | { ok: false; error: string; field?: string };

export interface Aspect {
	id: Id;
	name: string;
	color: AspectColor;
	icon: AspectIcon;
	position: number;
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
}

export interface NewTodo {
	title: string;
	aspectId: Id;
	notes?: string;
	priority?: Priority;
	dueDate?: IsoDate | null;
	checklist?: string[];
	target?: Target;
}

export interface TodoPatch {
	title?: string;
	aspectId?: Id;
	notes?: string;
	priority?: Priority;
	dueDate?: IsoDate | null;
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
}
