import { noneOf, not, oneOf, validate } from '../src';
import { expect } from './@expect';

describe('combinators', () => {
  it('oneOf', () => {
    const pattern = oneOf({ id: '1' }, { name: '2' }, { email: '3' });
    const value = { id: '1' };

    expect(validate(pattern, value)).to.match([true]);
  });

  it('oneOf, failed', () => {
    const pattern = oneOf({ id: '1' }, { name: '2' }, { email: '3' });

    expect(validate(pattern, { test: '1' })).to.match([false, 'expected one of 3 rules, got 0 matches']);
    expect(validate(pattern, { id: '1', name: '2' })).to.match([
      false,
      'expected one of 3 rules, got multiple matches at index 1',
    ]);
  });

  it('noneOf', () => {
    const pattern = noneOf({ id: '1' }, { name: '2' }, { email: '3' });

    expect(validate(pattern, { test: '1' })).to.match([true]);
  });

  it('noneOf, failed', () => {
    const pattern = noneOf({ id: '1' }, { name: '2' }, { email: '3' });

    expect(validate(pattern, { name: '2' })).to.match([false, 'expected none of 3 rules, got a match at index 1']);
  });

  it('not', () => {
    const pattern = not({ id: '1' });

    expect(validate(pattern, { test: '1' })).to.match([true]);
    expect(validate(pattern, { id: '1' })).to.match([false, 'expected not to match, but got a match']);
  });
});
