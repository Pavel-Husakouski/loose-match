import { aNumber, AssertionError, aString, isInstanceOf, match } from '../src';

describe('expect', () => {
  it('expect', () => {
    match(1).with(aNumber());
  });

  it('self-testing', () => {
    let error: unknown;

    try {
      match([true]).with(
        [false, 'failed expectation'],
        ({ message, actual, schema }) => new AssertionError(message, actual, schema)
      );
    } catch (e) {
      error = e;
    }

    match(error).with(
      isInstanceOf(AssertionError, {
        message: '[0] expected Boolean false, got Boolean true',
        actual: [true],
        expected: [false, 'failed expectation'],
      })
    );
  });

  it('expect, failed', () => {
    let error: unknown;

    try {
      match(1).with(aString());
    } catch (e) {
      error = e;
    }

    match(error).with(
      isInstanceOf(AssertionError, {
        message: 'expected a string, got [object Number]',
        actual: 1,
        expected: 'expected a string, got [object Number]',
      })
    );
  });

  it('expect, match with instance', () => {
    let error: unknown;

    try {
      match(1).with(aString());
    } catch (e) {
      error = e;
    }

    const assertionError = new AssertionError(
      'expected a string, got [object Number]',
      1,
      'expected a string, got [object Number]'
    );

    match(error).with(assertionError);
  });

  it('expect, match with instance 2', () => {
    let error: unknown;

    try {
      match({ a: 'x' }).with({ a: ['x'] });
    } catch (e) {
      error = e;
    }

    const assertionError = new AssertionError(
      '[a] expected array, got [object String]',
      { a: 'x' },
      '[a] expected array, got [object String]'
    );

    match(error).with(assertionError);
  });
});
