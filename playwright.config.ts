import { defineConfig } from '@playwright/test';

const port = Number(process.env.PORT ?? 4173);

export default defineConfig({
	testDir: 'e2e',
	workers: 1,
	// adapter-node assumes https unless PROTOCOL_HEADER names a header saying otherwise; without it
	// the http origin of every form post fails SvelteKit's CSRF check.
	use: { baseURL: `http://localhost:${port}`, extraHTTPHeaders: { 'x-forwarded-proto': 'http' } },
	webServer: {
		command: `mkdir -p .e2e && rm -f .e2e/${port}.db* && node build`,
		port,
		reuseExistingServer: false,
		env: { PORT: String(port), DATABASE_PATH: `.e2e/${port}.db`, LM_TEST: '1', PROTOCOL_HEADER: 'x-forwarded-proto' }
	}
});
