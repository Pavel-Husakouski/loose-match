import { re, validate } from '../src';
import { expect } from './@expect';

describe('re', () => {
  it('re', () => {
    expect(validate(re(/^test/), 'test')).to.match([true]);
    expect(validate(re(/^test/), 'not-test')).to.match([false, 'expected /^test/, got String not-test']);
    expect(validate(re(/^test/), 123)).to.match([false, 'expected string, got [object Number]']);
  });
});
