import { aNumber, AssertionError, aString, errorWith, match } from '../src';

describe('expect', () => {
  it('expect', () => {
    match(1).with(aNumber());
  });

  it('expect, failed', () => {
    let error: unknown;

    try {
      match(1).with(aString());
    } catch (e) {
      error = e;
    }

    match(error).with(
      errorWith(
        {
          message: 'expected a string, got [object Number]',
          actual: 1,
          expected: 'expected a string, got [object Number]',
        },
        AssertionError
      )
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
