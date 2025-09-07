import { describe, it } from 'mocha';
import { aBigInt, aBoolean, aDate, aNumber, aRegExp, aString, exact, isNull, re, validate } from '../src';
import { expect } from './@expect';

describe('primitive', () => {
  it('primitive string', () => {
    const schema = exact('test');

    expect(validate(schema, 'test')).to.match([true]);
  });

  it('primitive string, failed', () => {
    const schema = exact('test');

    expect(validate(schema, 'not a test')).to.be.false('expected String test, got String not a test');
  });

  it('primitive string, failed', () => {
    const schema = exact('test');

    expect(validate(schema, 'not a test')).to.be.false('expected String test, got String not a test');
  });

  it('primitive number', () => {
    const schema = exact(1);

    expect(validate(schema, 1)).to.be.true();
  });

  it('primitive number, failed', () => {
    const schema = exact(1);

    expect(validate(schema, 2)).to.match([false, `expected Number 1, got Number 2`]);
  });

  it('primitive boolean', () => {
    const schema = exact(true);

    expect(validate(schema, true)).to.match([true]);
  });

  it('primitive boolean, failed', () => {
    const schema = exact(true);

    expect(validate(schema, false)).to.match([false, `expected Boolean true, got Boolean false`]);
  });

  it('primitive null', () => {
    const schema = exact(null);

    expect(validate(schema, null)).to.match([true]);
  });

  it('primitive null, failed', () => {
    const schema = exact(null);

    expect(validate(schema, undefined)).to.match([false, `expected null, got undefined`]);
  });

  it('primitive undefined', () => {
    const schema = exact(undefined);

    expect(validate(schema, undefined)).to.match([true]);
  });

  it('primitive undefined, failed', () => {
    const schema = exact(undefined);

    expect(validate(schema, null)).to.match([false, `expected undefined, got null`]);
  });

  it('isNull null', () => {
    const schema = isNull();

    expect(validate(schema, null)).to.match([true]);
  });

  it('isNull undefined', () => {
    const schema = isNull();

    expect(validate(schema, undefined)).to.match([true]);
  });

  it('isNull, failed', () => {
    const schema = isNull();

    expect(validate(schema, {})).to.match([false, `expected null or undefined, got [object Object]`]);
  });

  it('primitive date', () => {
    const schema = exact(new Date(0));

    expect(validate(schema, new Date(0))).to.match([true]);
  });

  it('primitive date, failed', () => {
    const schema = exact(new Date(0));

    expect(validate(schema, new Date(1))).to.match([
      false,
      `expected Date 1970-01-01T00:00:00.000Z, got Date 1970-01-01T00:00:00.001Z`,
    ]);
  });

  it('primitive regexp', () => {
    const schema = exact(/test/);

    expect(validate(schema, /test/)).to.match([true]);
    expect(validate(schema, /x/)).to.match([false, `expected RegExp /test/, got RegExp /x/`]);
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

  it('a regexp', () => {
    const schema = aRegExp();

    expect(validate(schema, /test/)).to.match([true]);
  });

  it('a regexp', () => {
    const schema = aRegExp();

    expect(validate(schema, new RegExp('test'))).to.match([true]);
  });

  it('a regexp, failed', () => {
    const schema = aRegExp();

    expect(validate(schema, new Date())).to.match([false, `expected a regexp, got [object Date]`]);
  });

  it('re', () => {
    const schema = re(/test/);

    expect(validate(schema, 'test')).to.match([true]);
  });

  it('re, failed', () => {
    const schema = re(/test/);

    expect(validate(schema, 'to fail')).to.match([false, `expected /test/, got to fail`]);
  });

  it('re, failed', () => {
    const schema = re(/test/);

    expect(validate(schema, 5)).to.match([false, `expected string, got [object Number]`]);
  });
});
