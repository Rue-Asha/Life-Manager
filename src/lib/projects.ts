import type { ProjectStatus } from './types';

export const PROJECT_STATUSES: ProjectStatus[] = ['backlog', 'active', 'in_progress', 'paused', 'implemented'];

export const OVERVIEW_GROUPS: ProjectStatus[] = ['in_progress', 'active', 'backlog', 'paused'];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
	backlog: 'Backlog',
	active: 'Active',
	in_progress: 'In progress',
	paused: 'Paused',
	implemented: 'Implemented'
};

export const PROJECT_MESSAGES: Record<string, string> = {
	required: 'Give the project a name.',
	invalid: 'Enter a link starting with http:// or https://.',
	'not-found': 'That project no longer exists.'
};

export function parseTags(text: string): string[] {
	return [...new Set(text.split(',').map((t) => t.trim()).filter(Boolean))];
}
