// A user-written title split for the display h1. A short title puts the accent on its whole short last word; a long one is cut at a word
// boundary (`tail` is the ellipsis, `cut` says the title is clamped) and keeps the accent on the last whole short word before the cut.
export function titleParts(name: string, max = 44, accent = 14) {
	const text = name.trim();
	const words = text.split(/\s+/);
	if (text.length > max) {
		const head = text.slice(0, max - 4);
		const at = head.lastIndexOf(' ');
		// the cut lands inside one very long first word (a German compound): that whole word carries the accent and the display clamp cuts it
		if (at <= head.length / 2) return words.length > 1 && words[0].length >= head.length / 2 ? { lead: '', accent: words[0], tail: '', cut: true } : { lead: head.trimEnd(), accent: '', tail: '…', cut: true };
		const kept = head.slice(0, at).trimEnd().split(/\s+/);
		const last = kept.at(-1) ?? '';
		return kept.length > 1 && last.length <= accent ? { lead: kept.slice(0, -1).join(' '), accent: last, tail: '…', cut: true } : { lead: kept.join(' '), accent: '', tail: '…', cut: true };
	}
	const last = words.at(-1) ?? '';
	if (words.length < 2) return text.length <= 24 ? { lead: '', accent: text, tail: '', cut: false } : { lead: text, accent: '', tail: '', cut: false };
	return last.length > accent ? { lead: text, accent: '', tail: '', cut: false } : { lead: words.slice(0, -1).join(' '), accent: last, tail: '', cut: false };
}
