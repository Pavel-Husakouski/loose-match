import { instanceOf, oneOf, validate } from '../src';
import { expect } from './@expect';

describe('oneOf', () => {
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

  it('oneOf, empty', () => {
    expect(() => oneOf(...([] as any))).to.throw(
      instanceOf(Error, { message: 'oneOf requires at least two arguments' })
    );
  });
});
