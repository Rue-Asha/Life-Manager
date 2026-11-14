export type AspectFilter = { kind: 'all' } | { kind: 'id'; id: number } | { kind: 'unknown' };

export function parseAspectFilter(param: string | null): AspectFilter {
	if (param === null || param === '') return { kind: 'all' };
	if (!/^\d+$/.test(param)) return { kind: 'unknown' };
	const id = Number(param);
	return Number.isSafeInteger(id) ? { kind: 'id', id } : { kind: 'unknown' };
}
