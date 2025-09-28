import { anyOf, isInstanceOf, validate } from '../src';
import { expect } from './@expect';

describe('anyOf', () => {
  it('anyOf', () => {
    const pattern = anyOf({ id: '1' }, { name: '2' });

    expect(validate(pattern, { id: '1' })).to.match([true]);
    expect(validate(pattern, { name: '2' })).to.match([true]);
    expect(validate(pattern, { id: '1', name: '2' })).to.match([true]);
    expect(validate(pattern, { test: '3' })).to.match([false, 'expected at least one of 2 rules, got 0 matches']);
  });

  it('anyOf, empty', () => {
    expect(() => anyOf(...([] as any))).to.throw(
      isInstanceOf(Error, { message: 'anyOf requires at least two arguments' })
    );
  });
});
