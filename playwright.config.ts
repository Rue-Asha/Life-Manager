import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

const port = Number(process.env.PORT ?? 4173);
// E2E_APP_DIR points at an unpacked release tarball; the database stays in the repo's .e2e/.
const db = resolve(`.e2e/${port}.db`);

export default defineConfig({
	testDir: 'e2e',
	workers: 1,
	// adapter-node assumes https unless a proxy says otherwise, and an https self-origin fails the
	// CSRF check for every form post over plain http. This plays the proxy's part.
	use: { baseURL: `http://localhost:${port}`, extraHTTPHeaders: { 'x-forwarded-proto': 'http' } },
	webServer: {
		command: `mkdir -p '${resolve('.e2e')}' && rm -f '${db}'* && node build`,
		cwd: process.env.E2E_APP_DIR,
		port,
		reuseExistingServer: false,
		env: { PORT: String(port), PROTOCOL_HEADER: 'x-forwarded-proto', DATABASE_PATH: db, LM_TEST: '1' }
	}
});
