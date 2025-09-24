import { describe, it } from 'mocha';
import { literal, tupleWith, validate } from '../src';
import { expect } from './@expect';

type Json = string | number | boolean | null | undefined | Json[] | { [key: string]: Json };

describe('tuple', () => {
  it('tuple of string', () => {
    const schema = tupleWith(literal('test'));

    expect(validate(schema, ['test'])).to.match([true]);
  });

  it('tuple of string, failed', () => {
    const schema = tupleWith(literal('test'));

    expect(validate(schema, [5])).to.match([false, `[0] expected String test, got Number 5`]);
  });

  it('tuple of string, failed', () => {
    const schema = tupleWith('test');

    expect(validate(schema, [5])).to.match([false, `[0] expected String test, got Number 5`]);
  });

  it('tuple of string, failed', () => {
    const schema = tupleWith('1', '2', '3');

    expect(validate(schema, [1, 2, 3])).to.match([false, `[0] expected String 1, got Number 1`]);
  });

  it('tuple of error', () => {
    const schema = tupleWith(new Error('test'));

    expect(validate(schema, [new Error('test')])).to.match([true]);
  });

  it('tuple of error, failed', () => {
    const schema = tupleWith(new Error('test'));

    expect(validate(schema, [new Error('not a test')])).to.match([
      false,
      '[0] [message] expected String test, got String not a test',
    ]);
  });
});
