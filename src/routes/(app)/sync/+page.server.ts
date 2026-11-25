import { today } from '$lib/server/clock';
import { getDb } from '$lib/server/db';
import { desiredState } from '$lib/server/proton/desired';
import { failedItems, pendingCount } from '$lib/server/proton/reconciler';
import { resyncAll, syncNow, syncStatus } from '$lib/server/proton/worker';
import type { Actions, PageServerLoad } from './$types';

const stamp = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' });

export const load: PageServerLoad = () => {
	const db = getDb();
	const status = syncStatus();
	return {
		status,
		lastSync: status.lastSyncAt ? stamp.format(new Date(status.lastSyncAt)) : null,
		pending: status.state === 'off' ? 0 : pendingCount(db, desiredState(db, today()), today()),
		failed: failedItems(db)
	};
};

// A pass can take minutes; the page polls while it runs instead of waiting for it here.
export const actions: Actions = {
	syncNow: () => {
		void syncNow();
	},
	resyncAll: () => {
		void resyncAll();
	}
};
