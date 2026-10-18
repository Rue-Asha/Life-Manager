import { describe, expect, it } from 'vitest';
import { plannedLabel, slotLabel, validateSlot } from './slot';

describe('slot', () => {
	it('Scenario: Slot validation', () => {
		expect(validateSlot(null, null)).toBeNull();
		expect(validateSlot('18:00', null)).toBeNull();
		expect(validateSlot('18:00', '19:30')).toBeNull();
		expect(validateSlot('00:00', '23:59')).toBeNull();
		expect(validateSlot(null, '19:30')).toEqual({ error: 'end-without-start', field: 'endTime' });
		expect(validateSlot('19:30', '19:30')).toEqual({ error: 'end-before-start', field: 'endTime' });
		expect(validateSlot('19:30', '18:00')).toEqual({ error: 'end-before-start', field: 'endTime' });
		expect(validateSlot('24:00', null)).toEqual({ error: 'invalid', field: 'startTime' });
		expect(validateSlot('9:00', null)).toEqual({ error: 'invalid', field: 'startTime' });
		expect(validateSlot('12:60', null)).toEqual({ error: 'invalid', field: 'startTime' });
		expect(validateSlot('18:00', 'soon')).toEqual({ error: 'invalid', field: 'endTime' });
		expect(validateSlot('18:00', '')).toEqual({ error: 'invalid', field: 'endTime' });
	});

	it('Scenario: Slot labels', () => {
		expect(slotLabel(null, null)).toBe('all day');
		expect(slotLabel('18:00', null)).toBe('18:00');
		expect(slotLabel('18:00', '19:30')).toBe('18:00–19:30');
	});

	it('Scenario: Planned label formats date and slot', () => {
		expect(plannedLabel('2026-10-27', '18:00', '19:30')).toBe('Tue 27 Oct · 18:00–19:30');
		expect(plannedLabel('2026-10-27', '18:00', null)).toBe('Tue 27 Oct · 18:00');
		expect(plannedLabel('2026-11-03', null, null)).toBe('Tue 3 Nov');
		expect(plannedLabel('2026-10-27', '18:00', '19:30', false)).toBe('18:00–19:30');
		expect(plannedLabel('2026-10-27', '18:00', null, false)).toBe('18:00');
		expect(plannedLabel('2026-10-27', null, null, false)).toBe('');
	});
});
