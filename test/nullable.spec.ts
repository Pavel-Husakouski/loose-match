import { nullable, re, validate } from '../src';
import { expect } from './@expect';

describe('nullable', () => {
  it('nullable with valid value', () => {
    const pattern = nullable('test');
    expect(validate(pattern, 'test')).to.match([true]);
    expect(validate(pattern, null)).to.match([true]);
    expect(validate(pattern, undefined)).to.match([true]);
  });

  it('nullable with invalid value', () => {
    const pattern = nullable(re(/^test/));
    expect(validate(pattern, 'not-test')).to.match([false, 'expected /^test/, got String not-test']);
    expect(validate(pattern, 123)).to.match([false, 'expected string, got [object Number]']);
  });
});
