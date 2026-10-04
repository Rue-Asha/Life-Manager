import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('markdown', () => {
	it('Scenario: Raw HTML in notes is escaped', () => {
		const out = renderMarkdown('<script>alert(1)</script>\n\nText <img src=x onerror=alert(1)> more');
		expect(out).not.toMatch(/<script|<img/);
		expect(out).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
		expect(out).toContain('&lt;img src=x onerror=alert(1)&gt;');
	});

	it('Scenario: Script-scheme link and image URLs are inert', () => {
		for (const src of [
			'[x](javascript:alert(1))',
			'[x](JaVaScRiPt:alert(1))',
			'[x](<java\tscript:alert(1)>)',
			'[x](data:text/html,<b>)',
			'![x](data:image/svg+xml,<svg>)',
			'[x][r]\n\n[r]: javascript:alert(1)'
		]) {
			expect(renderMarkdown(src), src).not.toMatch(/javascript:|data:/i);
		}
		expect(renderMarkdown('[a](https://example.com) [b](/projects/1) [c](mailto:a@b.de)')).toMatch(
			/href="https:\/\/example.com".*href="\/projects\/1".*href="mailto:a@b.de"/
		);
	});

	it('renders headings, bold and lists', () => {
		const out = renderMarkdown('## Ideas\n\n- **dark mode**');
		expect(out).toContain('<h2>Ideas</h2>');
		expect(out).toContain('<li><strong>dark mode</strong></li>');
	});

	it('returns an empty string for empty notes', () => {
		expect(renderMarkdown('')).toBe('');
	});
});
