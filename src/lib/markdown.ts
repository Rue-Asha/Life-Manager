import { Marked } from 'marked';

const escapeHtml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Block and inline raw HTML both come through the `html` renderer; emitting it escaped shows it as text.
const marked = new Marked({ renderer: { html: ({ text }) => escapeHtml(text) } });

export function renderMarkdown(src: string): string {
	return marked.parse(src, { async: false });
}
