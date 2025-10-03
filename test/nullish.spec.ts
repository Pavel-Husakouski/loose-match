import { expect } from './@expect';
import { nullish, re, validate } from '../src';

describe('nullish', () => {
  const schema = nullish(re(/^test/));

  it('undefined value', () => {
    expect(validate(schema, undefined)).to.match([true]);
  });

  it('null value', () => {
    expect(validate(schema, null)).to.match([true]);
  });

  it('valid value', () => {
    expect(validate(schema, 'test')).to.match([true]);
  });

  it('invalid value', () => {
    expect(validate(schema, 123)).to.match([false, 'expected string, got [object Number]']);
  });
});
