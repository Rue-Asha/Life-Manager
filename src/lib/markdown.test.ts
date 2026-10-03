import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('markdown', () => {
	it('Scenario: Raw HTML in notes is escaped', () => {
		const out = renderMarkdown('<script>alert(1)</script>\n\nText <img src=x onerror=alert(1)> more');
		expect(out).not.toMatch(/<script|<img/);
		expect(out).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
		expect(out).toContain('&lt;img src=x onerror=alert(1)&gt;');
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
