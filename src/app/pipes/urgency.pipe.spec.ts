import { UrgencyLabelPipe, UrgencyTonePipe } from './urgency.pipe';

describe('UrgencyLabelPipe', () => {
  const pipe = new UrgencyLabelPipe();

  it('labels a level in Romanian, whatever its casing', () => {
    expect(pipe.transform('high')).toBe('Ridicată');
    expect(pipe.transform('High')).toBe('Ridicată');
    expect(pipe.transform('unspecified')).toBe('Nespecificată');
  });

  it("builds a self-describing tag with 'tag'", () => {
    expect(pipe.transform('medium', 'tag')).toBe('Urgență medie');
    expect(pipe.transform('urgent', 'tag')).toBe('Urgentă');
  });

  it('passes unknown values through', () => {
    expect(pipe.transform('critical')).toBe('critical');
    expect(pipe.transform(null)).toBe('');
  });
});

describe('UrgencyTonePipe', () => {
  const pipe = new UrgencyTonePipe();

  it('maps levels to .c-tag tones', () => {
    expect(pipe.transform('urgent')).toBe('urgent');
    expect(pipe.transform('High')).toBe('signal');
    expect(pipe.transform('medium')).toBe('info');
    expect(pipe.transform('low')).toBe('neutral');
    expect(pipe.transform(undefined)).toBe('neutral');
  });
});
