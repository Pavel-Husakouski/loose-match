import { nullable, validate } from '../src';
import { expect } from './@expect';

describe('nullable', () => {
  it('valid value', () => {
    const pattern = nullable('test');
    expect(validate(pattern, 'test')).to.match([true]);
  });

  it('invalid value', () => {
    const pattern = nullable('test');
    expect(validate(pattern, 'passed')).to.match([false, 'expected String test, got String passed']);
  });

  it('null value', () => {
    const pattern = nullable('test');
    expect(validate(pattern, null)).to.match([true]);
  });

  it('undefined value', () => {
    const pattern = nullable('test');
    expect(validate(pattern, undefined)).to.match([false, 'expected String test, got undefined']);
  });
});
