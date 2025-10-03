import { optional, validate } from '../src';
import { expect } from './@expect';

describe('optional', () => {
  const pattern = optional('test');

  it('valid value', () => {
    expect(validate(pattern, 'test')).to.match([true]);
  });

  it('invalid value', () => {
    expect(validate(pattern, 'passed')).to.match([false, 'expected String test, got String passed']);
  });

  it('undefined value', () => {
    expect(validate(pattern, undefined)).to.match([true]);
  });

  it('null value', () => {
    expect(validate(pattern, null)).to.match([false, 'expected String test, got null']);
  });
});
