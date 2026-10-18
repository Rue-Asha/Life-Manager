import type { ProtonConfig } from './types';

export function readConfig(env: Record<string, string | undefined>): ProtonConfig | null {
	const cli = env.PROTON_CLI;
	if (!cli) return null;
	return { cli, profile: env.PROTON_PROFILE || 'default' };
}
