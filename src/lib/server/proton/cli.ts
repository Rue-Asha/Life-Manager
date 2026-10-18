import type { ProtonConfig, ProtonOp, Runner } from './types';

export function toArgv(op: ProtonOp, profile: string): string[] {
	return [];
}

export function createRunner(cfg: ProtonConfig, o?: { gapMs?: number }): Runner {
	return async () => ({ ok: false, code: 'spawn', error: 'not implemented' });
}
