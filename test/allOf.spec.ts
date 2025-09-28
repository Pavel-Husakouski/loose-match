import { allOf, isInstanceOf, validate } from '../src';
import { expect } from './@expect';

describe('allOf', () => {
  it('allOf', () => {
    const pattern = allOf({ id: '1' }, { name: '2' });
    expect(validate(pattern, { id: '1', name: '2' })).to.match([true]);
    expect(validate(pattern, { id: '1' })).to.match([false, '[name] expected String 2, got undefined']);
    expect(validate(pattern, { name: '2' })).to.match([false, '[id] expected String 1, got undefined']);
  });

  it('allOf, empty arguments list', () => {
    expect(() => allOf(...([] as any))).to.throw(
      isInstanceOf(Error, { message: 'allOf requires at least two arguments' })
    );
  });
});
