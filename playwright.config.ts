import { defineConfig } from '@playwright/test';

const port = Number(process.env.PORT ?? 4173);

export default defineConfig({
	testDir: 'e2e',
	workers: 1,
	// adapter-node assumes https unless a proxy says otherwise, and an https self-origin fails the
	// CSRF check for every form post over plain http. This plays the proxy's part.
	use: { baseURL: `http://localhost:${port}`, extraHTTPHeaders: { 'x-forwarded-proto': 'http' } },
	webServer: {
		command: `mkdir -p .e2e && rm -f .e2e/${port}.db* && node build`,
		port,
		reuseExistingServer: false,
		env: { PORT: String(port), PROTOCOL_HEADER: 'x-forwarded-proto', DATABASE_PATH: `.e2e/${port}.db`, LM_TEST: '1' }
	}
});
