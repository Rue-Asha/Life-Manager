import type { AspectColor } from '$lib/aspect-style';

// Nearest of Proton's 20 accent colours to each palette token (squared RGB distance, like proton-cli's accent.Nearest).
export const PROTON_COLORS: Record<AspectColor, string> = {
	sage: '#258723',
	sky: '#0A77A6',
	lavender: '#A839A4',
	ochre: '#807304',
	berry: '#BA1E55',
	lagoon: '#0F735A',
	tangerine: '#C44800',
	slate: '#936D58'
};
