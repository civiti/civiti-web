import { RoPluralPipe, roCount } from './plural.pipe';

describe('roCount / RoPluralPipe', () => {
  const pipe = new RoPluralPipe();

  it('uses the singular for exactly one', () => {
    expect(roCount(1, 'punct', 'puncte')).toBe('1 punct');
  });

  it('uses the bare plural for 0 and 2–19', () => {
    expect(roCount(0, 'punct', 'puncte')).toBe('0 puncte');
    expect(roCount(2, 'punct', 'puncte')).toBe('2 puncte');
    expect(roCount(19, 'punct', 'puncte')).toBe('19 puncte');
  });

  it('adds "de" from 20 on', () => {
    expect(roCount(20, 'punct', 'puncte')).toBe('20 de puncte');
    expect(roCount(100, 'punct', 'puncte')).toBe('100 de puncte');
    expect(roCount(260, 'punct', 'puncte')).toBe('260 de puncte');
  });

  it('drops "de" when the last two digits are 01–19', () => {
    expect(roCount(101, 'punct', 'puncte')).toBe('101 puncte');
    expect(roCount(119, 'punct', 'puncte')).toBe('119 puncte');
    expect(roCount(120, 'punct', 'puncte')).toBe('120 de puncte');
  });

  it('formats large numbers for ro-RO', () => {
    expect(roCount(1500, 'punct', 'puncte')).toBe('1.500 de puncte');
  });

  it('agrees whole phrases and treats a missing count as zero', () => {
    expect(pipe.transform(1, 'fotografie încărcată', 'fotografii încărcate')).toBe('1 fotografie încărcată');
    expect(pipe.transform(null, 'problemă', 'probleme')).toBe('0 probleme');
  });
});
