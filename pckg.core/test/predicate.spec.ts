import { describe, it } from 'mocha';
import { predicate, validate } from '../src';
import { expect } from './@expect';

describe('predicate', () => {
  it('simple boolean function - success', () => {
    const isPositive = predicate<number>((n: number) => n > 0);

    expect(validate(isPositive, 5)).to.match([true]);
    expect(validate(isPositive, 1)).to.match([true]);
    expect(validate(isPositive, 0.1)).to.match([true]);
  });

  it('simple boolean function - failure', () => {
    const isPositive = predicate<number>((n: number) => n > 0);

    expect(validate(isPositive, 0)).to.match([false, 'predicate failed for Number 0']);
    expect(validate(isPositive, -5)).to.match([false, 'predicate failed for Number -5']);
    expect(validate(isPositive, -0.1)).to.match([false, 'predicate failed for Number -0.1']);
  });

  it('custom error message', () => {
    const isEven = predicate<number>((n: number) => n % 2 === 0, 'number must be even');

    expect(validate(isEven, 4)).to.match([true]);
    expect(validate(isEven, 2)).to.match([true]);
    expect(validate(isEven, 0)).to.match([true]);

    expect(validate(isEven, 3)).to.match([false, 'number must be even']);
    expect(validate(isEven, 1)).to.match([false, 'number must be even']);
    expect(validate(isEven, 5)).to.match([false, 'number must be even']);
  });

  it('function that returns void (falsy)', () => {
    const alwaysFails = predicate<any>((value: any) => {
      return undefined;
    });

    expect(validate(alwaysFails, 'anything')).to.match([false, 'predicate failed for String anything']);
    expect(validate(alwaysFails, 42)).to.match([false, 'predicate failed for Number 42']);
    expect(validate(alwaysFails, null)).to.match([false, 'predicate failed for null']);
  });

  it('function that throws (should be caught)', () => {
    const throwingPredicate = predicate<string>((s: string) => {
      if (s === 'throw') {
        throw new Error('This should not crash the validation');
      }
      return s.length > 0;
    }, 'validation error occurred');

    expect(validate(throwingPredicate, 'hello')).to.match([true]);

    expect(() => validate(throwingPredicate, 'throw')).to.throw();
  });

  it('default error message formatting', () => {
    const alwaysFalse = predicate<any>((value: any) => false);

    expect(validate(alwaysFalse, 'test string')).to.match([false, 'predicate failed for String test string']);
    expect(validate(alwaysFalse, 123)).to.match([false, 'predicate failed for Number 123']);
    expect(validate(alwaysFalse, true)).to.match([false, 'predicate failed for Boolean true']);
    expect(validate(alwaysFalse, [1, 2, 3])).to.match([false, 'predicate failed for [object Array]']);
    expect(validate(alwaysFalse, { key: 'value' })).to.match([false, 'predicate failed for [object Object]']);
    expect(validate(alwaysFalse, null)).to.match([false, 'predicate failed for null']);
    expect(validate(alwaysFalse, undefined)).to.match([false, 'predicate failed for undefined']);
  });

  it('chaining with other rules', () => {
    const isPositiveInteger = predicate<number>(
      (n: number) => Number.isInteger(n) && n > 0,
      'must be a positive integer'
    );

    expect(validate(isPositiveInteger, 5)).to.match([true]);
    expect(validate(isPositiveInteger, 1)).to.match([true]);

    expect(validate(isPositiveInteger, 0)).to.match([false, 'must be a positive integer']);
    expect(validate(isPositiveInteger, -1)).to.match([false, 'must be a positive integer']);
    expect(validate(isPositiveInteger, 3.14)).to.match([false, 'must be a positive integer']);
  });
});
