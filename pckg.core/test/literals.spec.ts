import { describe, it } from 'mocha';
import { aBigInt, aBoolean, aDate, aNumber, aString, literal, re, validate } from '../src';
import { expect } from './@expect';

describe('literal', () => {
  it('string', () => {
    const schema = literal('test');

    expect(validate(schema, 'test')).to.match([true]);
  });

  it('string, failed', () => {
    const schema = literal('test');

    expect(validate(schema, 'not a test')).to.be.false('expected String test, got String not a test');
  });

  it('string, failed', () => {
    const schema = literal('test');

    expect(validate(schema, 'not a test')).to.be.false('expected String test, got String not a test');
  });

  it('number', () => {
    const schema = literal(1);

    expect(validate(schema, 1)).to.be.true();
  });

  it('infinity', () => {
    const schema = literal(Infinity);

    expect(validate(schema, -Infinity)).to.be.false(`expected Number Infinity, got Number -Infinity`);
  });

  it('+0 and -0', () => {
    const schema = literal(0);

    expect(validate(schema, -0)).to.be.true();
  });

  it('number, failed', () => {
    const schema = literal(1);

    expect(validate(schema, 2)).to.match([false, `expected Number 1, got Number 2`]);
  });

  it('boolean', () => {
    const schema = literal(true);

    expect(validate(schema, true)).to.match([true]);
  });

  it('boolean, failed', () => {
    const schema = literal(true);

    expect(validate(schema, false)).to.match([false, `expected Boolean true, got Boolean false`]);
  });

  it('null', () => {
    const schema = literal(null);

    expect(validate(schema, null)).to.match([true]);
  });

  it('null', () => {
    const schema = null;

    expect(validate(schema, null)).to.match([true]);
  });

  it('null, failed', () => {
    const schema = literal(null);

    expect(validate(schema, undefined)).to.match([false, `expected null, got undefined`]);
  });

  it('null, failed', () => {
    const schema = null;

    expect(validate(schema, undefined)).to.match([false, `expected null, got undefined`]);
  });

  it('undefined', () => {
    const schema = literal(undefined);

    expect(validate(schema, undefined)).to.match([true]);
  });

  it('undefined', () => {
    const schema = undefined;

    expect(validate(schema, undefined)).to.match([true]);
  });

  it('undefined, failed', () => {
    const schema = literal(undefined);

    expect(validate(schema, null)).to.match([false, `expected undefined, got null`]);
  });

  it('undefined, failed', () => {
    const schema = undefined;

    expect(validate(schema, null)).to.match([false, `expected undefined, got null`]);
  });

  it('date', () => {
    const schema = literal(new Date(0));

    expect(validate(schema, new Date(0))).to.match([true]);
  });

  it('date, failed', () => {
    const schema = literal(new Date(0));

    expect(validate(schema, new Date(1))).to.match([
      false,
      `expected Date 1970-01-01T00:00:00.000Z, got Date 1970-01-01T00:00:00.001Z`,
    ]);
  });

  it('a number', () => {
    const schema = aNumber();

    expect(validate(schema, 1)).to.match([true]);
  });

  it('a number, failed', () => {
    const schema = aNumber();

    expect(validate(schema, '1')).to.match([false, `expected a number, got [object String]`]);
  });

  it('string', () => {
    const schema = aString();

    expect(validate(schema, 'test')).to.match([true]);
  });

  it('string with length', () => {
    const schema = aString({ length: 4 });

    expect(validate(schema, 'test')).to.match([true]);
    expect(validate(schema, '')).to.match([false, `expected string of length 4, got length 0`]);
    expect(validate(schema, null)).to.match([false, `expected a string, got [object Null]`]);
  });

  it('string, failed', () => {
    const schema = aString();

    expect(validate(schema, 1)).to.match([false, `expected a string, got [object Number]`]);
  });

  it('date', () => {
    const schema = aDate();

    expect(validate(schema, new Date())).to.match([true]);
  });

  it('date, failed', () => {
    const schema = aDate();

    expect(validate(schema, 1)).to.match([false, `expected a date, got [object Number]`]);
  });

  it('boolean', () => {
    const schema = aBoolean();

    expect(validate(schema, true)).to.match([true]);
  });

  it('boolean, failed', () => {
    const schema = aBoolean();

    expect(validate(schema, 1)).to.match([false, `expected a boolean, got [object Number]`]);
  });

  it('bigint', () => {
    const schema = aBigInt();

    expect(validate(schema, 1n)).to.match([true]);
    expect(validate(schema, 1)).to.match([false, `expected a bigint, got [object Number]`]);
  });

  it('bigint, failed', () => {
    const schema = aBigInt();

    expect(validate(schema, 1)).to.match([false, `expected a bigint, got [object Number]`]);
  });

  it('re', () => {
    const schema = re(/test/);

    expect(validate(schema, 'test')).to.match([true]);
  });

  it('re, failed', () => {
    const schema = re(/test/);

    expect(validate(schema, 'to fail')).to.match([false, `expected /test/, got String to fail`]);
  });

  it('re, failed', () => {
    const schema = re(/test/);

    expect(validate(schema, 5)).to.match([false, `expected string, got [object Number]`]);
  });
});
