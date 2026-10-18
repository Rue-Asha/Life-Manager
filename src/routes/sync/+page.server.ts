import { syncStatus } from '$lib/server/proton/worker';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ status: syncStatus() });
