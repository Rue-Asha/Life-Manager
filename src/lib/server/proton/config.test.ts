import { describe, expect, it } from 'vitest';
import { readConfig } from './config';

describe('proton config', () => {
	it('Scenario: PROTON_CLI unset turns sync off', () => {
		expect(readConfig({})).toBeNull();
		expect(readConfig({ PROTON_CLI: '' })).toBeNull();
		expect(readConfig({ PROTON_PROFILE: 'rue' })).toBeNull();
	});

	it('Scenario: Profile defaults to default', () => {
		expect(readConfig({ PROTON_CLI: '/usr/local/bin/proton' })).toEqual({ cli: '/usr/local/bin/proton', profile: 'default' });
		expect(readConfig({ PROTON_CLI: '/usr/local/bin/proton', PROTON_PROFILE: 'rue' })).toEqual({
			cli: '/usr/local/bin/proton',
			profile: 'rue'
		});
	});
});
