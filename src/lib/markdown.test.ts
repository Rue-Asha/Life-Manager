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
		const hrefs = (html: string) => [...html.matchAll(/(?:href|src)="([^"]*)"/g)].map((m) => m[1]);
		const decode = (s: string) =>
			s
				.replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
				.replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(+d))
				.replace(/&colon;/g, ':')
				.replace(/&(Tab|NewLine);/g, '')
				.replace(/[\u0000-\u0020]/g, '');
		for (const src of [
			'[x](javascript:alert(1))',
			'[x](JaVaScRiPt:alert(1))',
			'[x](<java\tscript:alert(1)>)',
			'[x](data:text/html,<b>)',
			'![x](data:image/svg+xml,<svg>)',
			'[x][r]\n\n[r]: javascript:alert(1)',
			'[x](java&#115;cript:alert(1))',
			'[x](&#106;avascript:alert(1))',
			'[x](&#x6A;avascript:alert(1))',
			'[x](&#x6a;&#x61;vascript:alert(1))',
			'[x](javascript&colon;alert(1))',
			'[x](java&Tab;script:alert(1))',
			'[x](java&NewLine;script:alert(1))',
			'[x](javascript&#58;alert(1))',
			'[x](javascript&#x3A;alert(1))',
			'[x](javascript&unknownentity;alert(1))',
			'![x](java&#115;cript:alert(1))',
			'![x](data&colon;image/svg+xml,<svg>)',
			'[x][r]\n\n[r]: java&#115;cript:alert(1)',
			'[x][r]\n\n[r]: javascript&colon;alert(1)',
			'![x][r]\n\n[r]: &#100;ata:text/html,<b>'
		]) {
			const found = hrefs(renderMarkdown(src));
			for (const h of found) expect(decode(h), src).not.toMatch(/^(javascript|data|vbscript):/i);
			for (const h of found) expect(h, src).toBe('');
		}
		expect(renderMarkdown('[a](https://example.com) [b](/projects/1) [c](mailto:a@b.de)')).toMatch(
			/href="https:\/\/example.com".*href="\/projects\/1".*href="mailto:a@b.de"/
		);
		const kept = renderMarkdown('[a](#top) [b](notes/x?a=1&b=2) [c](HTTP://e.com/a:b) [d](https&colon;//e.com)');
		expect(hrefs(kept)).toEqual(['#top', 'notes/x?a=1&amp;b=2', 'HTTP://e.com/a:b', 'https&colon;//e.com']);
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
