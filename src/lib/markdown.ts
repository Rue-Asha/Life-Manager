import { Marked } from 'marked';

const escapeHtml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Block and inline raw HTML both come through the `html` renderer; emitting it escaped shows it as text.
const marked = new Marked({
	renderer: { html: ({ text }) => escapeHtml(text) },
	walkTokens(token) {
		if (token.type !== 'link' && token.type !== 'image') return;
		// Scheme allowlist: a href like `javascript:` or `data:` would run or load on click in {@html} notes.
		const scheme = token.href.replace(/[\u0000-\u0020]/g, '').match(/^([a-z][a-z0-9+.-]*):/i)?.[1].toLowerCase();
		if (scheme && !['http', 'https', 'mailto'].includes(scheme)) token.href = '';
	}
});

export function renderMarkdown(src: string): string {
	return marked.parse(src, { async: false });
}
