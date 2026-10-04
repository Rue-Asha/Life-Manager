import { Marked } from 'marked';

const escapeHtml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// marked leaves entities in href undecoded but the browser decodes them in the attribute, so decode before judging the scheme.
const NAMED: Record<string, string> = { colon: ':', Tab: '\t', NewLine: '\n', amp: '&', lpar: '(', rpar: ')', sol: '/', num: '#', quest: '?' };
const decodeEntities = (s: string) =>
	s.replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z][a-zA-Z0-9]*));?/g, (m, dec, hex, name) => {
		if (name) return name in NAMED ? NAMED[name] : m;
		const cp = dec ? parseInt(dec, 10) : parseInt(hex, 16);
		return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '\uFFFD';
	});

// Strict allowlist: relative refs, http, https, mailto. An entity left undecoded before the path starts could still hide a scheme, so it blanks too.
function safeHref(href: string): string {
	const head = decodeEntities(href).replace(/[\u0000-\u0020]/g, '').split(/[/?#]/, 1)[0];
	if (/&[a-zA-Z]/.test(head)) return '';
	const colon = head.indexOf(':');
	if (colon === -1) return href;
	return ['http', 'https', 'mailto'].includes(head.slice(0, colon).toLowerCase()) ? href : '';
}

// Block and inline raw HTML both come through the `html` renderer; emitting it escaped shows it as text.
const marked = new Marked({
	renderer: { html: ({ text }) => escapeHtml(text) },
	walkTokens(token) {
		if (token.type !== 'link' && token.type !== 'image') return;
		token.href = safeHref(token.href);
	}
});

export function renderMarkdown(src: string): string {
	return marked.parse(src, { async: false });
}
