import { ActionLabelPipe, ActionTonePipe } from './admin.pipe';

describe('ActionLabelPipe', () => {
  const pipe = new ActionLabelPipe();

  it('labels the actions the API sends', () => {
    expect(pipe.transform('approve')).toBe('A aprobat');
    expect(pipe.transform('reject')).toBe('A respins');
    expect(pipe.transform('requestchanges')).toBe('A solicitat modificări');
  });

  it('accepts the other spellings of "request changes"', () => {
    expect(pipe.transform('request_changes')).toBe('A solicitat modificări');
    expect(pipe.transform('RequestChanges')).toBe('A solicitat modificări');
  });

  it('passes unknown actions through', () => {
    expect(pipe.transform('resubmit')).toBe('resubmit');
  });
});

describe('ActionTonePipe', () => {
  const pipe = new ActionTonePipe();

  it('gives each action a .c-status tone', () => {
    expect(pipe.transform('approve')).toBe('resolved');
    expect(pipe.transform('reject')).toBe('rejected');
    expect(pipe.transform('requestchanges')).toBe('pending');
    expect(pipe.transform('resubmit')).toBe('neutral');
  });
});
