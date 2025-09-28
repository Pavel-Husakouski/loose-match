import { strictEqual, validate } from '../src';
import { expect } from './@expect';

describe('strictEqual', () => {
  it('strictEqual', () => {
    const target = {};
    const pattern = strictEqual(target);

    expect(validate(pattern, target)).to.match([true]);
    expect(validate(pattern, [])).to.match([false, 'expected strict equals [object Object], got [object Array]']);
    expect(validate(pattern, {})).to.match([false, 'expected strict equals [object Object], got [object Object]']);
  });

  it('strictEqual with null and undefined', () => {
    expect(validate(strictEqual(null), null)).to.match([true]);
    expect(validate(strictEqual(null), undefined)).to.match([false, 'expected strict equals null, got undefined']);
    expect(validate(strictEqual(null), 'test')).to.match([false, 'expected strict equals null, got String test']);
  });

  it('strictEqual with primitive values', () => {
    expect(validate(strictEqual(5), 5)).to.match([true]);
    expect(validate(strictEqual(5), '5')).to.match([false, 'expected strict equals Number 5, got String 5']);
  });
});
