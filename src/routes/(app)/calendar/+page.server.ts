import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { calendarMonth } from '$lib/server/calendar';
import { parseMonth } from '$lib/week';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const day = today();
	const month = parseMonth(url.searchParams.get('month'), day);
	return { ...calendarMonth(getDb(), month, day), today: day };
};
