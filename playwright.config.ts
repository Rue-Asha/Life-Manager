import { defineConfig } from '@playwright/test';

const port = Number(process.env.PORT ?? 4173);

export default defineConfig({
	testDir: 'e2e',
	workers: 1,
	use: { baseURL: `http://localhost:${port}` },
	webServer: {
		command: `mkdir -p .e2e && rm -f .e2e/${port}.db* && node build`,
		port,
		reuseExistingServer: false,
		env: { PORT: String(port), DATABASE_PATH: `.e2e/${port}.db`, LM_TEST: '1' }
	}
});
