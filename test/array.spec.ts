import { describe, it } from 'mocha';
import { anyOf, anything, arrayOf, length, primitive, validate } from '../src';
import { expect } from './@expect';

describe('array', () => {
  it('array of string', () => {
    const schema = arrayOf(primitive('test'));

    expect(validate(schema, ['test'])).to.match([true]);
  });

  it('array of string, failed', () => {
    const schema = arrayOf(primitive('test'));

    expect(validate(schema, [5])).to.match([false, `[0] expected String test, got Number 5`]);
  });

  it('array of string, failed', () => {
    const schema = arrayOf('test');

    expect(validate(schema, [5])).to.match([false, `[0] expected String test, got Number 5`]);
  });

  it('array of string, failed', () => {
    const schema = arrayOf(anyOf('1', '2', '3'));

    expect(validate(schema, [1, 2, 3])).to.match([
      false,
      `[0] expected String 1, got Number 1,expected String 2, got Number 1,expected String 3, got Number 1`,
    ]);
  });

  it('array of array', () => {
    const schema = arrayOf(arrayOf(anyOf('1', '2', '3')));

    expect(validate(schema, [['1', '2', '3']])).to.match([true]);
  });

  it('array of array, failed 1', () => {
    const schema = arrayOf(arrayOf(anyOf('1', '2', '3')));

    expect(validate(schema, [[1, 2, 3]])).to.match([
      false,
      `[0] [0] expected String 1, got Number 1,expected String 2, got Number 1,expected String 3, got Number 1`,
    ]);
  });

  it('array of array, failed 2', () => {
    const schema = arrayOf(arrayOf(anyOf('1', '2', '3')));

    expect(validate(schema, [['1'], ['2'], ['3'], ['4']])).to.match([
      false,
      `[3] [0] expected String 1, got String 4,expected String 2, got String 4,expected String 3, got String 4`,
    ]);
  });

  it('a length of an array', () => {
    const schema = length(2);

    expect(validate(schema, ['1', '2'])).to.match([true]);
    expect(validate(schema, 'xe')).to.match([true]);
    expect(validate(schema, { length: 2 })).to.match([true]);
    expect(validate(schema, [])).to.match([false, 'expected length to be 2, got 0']);
    expect(validate(schema, null)).to.match([false, 'expected length to be 2, got undefined']);
    expect(validate(schema, { length: 4 })).to.match([false, 'expected length to be 2, got 4']);
    expect(validate(schema, {})).to.match([false, 'expected length to be 2, got undefined']);
  });

  it('an array of anything', () => {
    const schema = arrayOf(anything());

    expect(validate(schema, ['1', '2'])).to.match([true]);
    expect(validate(schema, [1, 2])).to.match([true]);
    expect(validate(schema, [true, false])).to.match([true]);
    expect(validate(schema, [null, undefined])).to.match([true]);
    expect(validate(schema, [])).to.match([true]);
    expect(validate(schema, 'xe')).to.match([false, 'expected array, got [object String]']);
    expect(validate(schema, { length: 2 })).to.match([false, 'expected array, got [object Object]']);
    expect(validate(schema, null)).to.match([false, 'expected array, got [object Null]']);
    expect(validate(schema, undefined)).to.match([false, 'expected array, got [object Undefined]']);
    expect(validate(schema, {})).to.match([false, 'expected array, got [object Object]']);
    expect(validate(schema, 1)).to.match([false, 'expected array, got [object Number]']);
  });
});
