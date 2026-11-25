import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ASPECT_COLORS } from '../src/lib/aspect-style';

const tokens = readFileSync('src/lib/styles/fingerprint/tokens.css', 'utf8');

describe('aspect colours', () => {
	it('Scenario: Every aspect colour has a fingerprint token', () => {
		const keys = Object.keys(ASPECT_COLORS);
		expect(keys).toHaveLength(8);
		for (const key of keys) {
			expect(tokens, `--aspect-${key}`).toMatch(new RegExp(`--aspect-${key}\\s*:`));
		}
		for (const [key, colour] of Object.entries(ASPECT_COLORS)) {
			expect(colour.fg, key).toBe(`var(--aspect-${key})`);
			// Tints derive from the aspect's own token; every name they use is a fingerprint token, no literal.
			for (const value of [colour.tint, colour.bright]) {
				expect(value, key).toContain(`var(--aspect-${key})`);
				expect(value, key).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
				for (const [, name] of value.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
					expect(tokens, `${key}: ${name}`).toMatch(new RegExp(`${name}\\s*:`));
				}
			}
		}
	});
});
