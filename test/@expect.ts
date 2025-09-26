import { __toFunction, AssertionError, aString, Invalid, isInstanceOf, match, SchemaRule, Valid } from '../src';

export type SameType<B, A> = A extends B ? (B extends A ? true : false) : false;

export function expectSameType<A, B>(): { is<X extends SameType<A, B>>(): void } {
  return {
    is() {
      // do nothing
    },
  };
}

export function expectType<A>(arg?: A): { is<X extends A>(): void } {
  return {
    is<X extends A>() {
      // do nothing
    },
  };
}

export function expect(actual: unknown) {
  return {
    to: {
      match(rule: Valid<any> | Invalid<any>) {
        match(actual).with(rule);
      },
      be: {
        true() {
          match(actual).with([true]);
        },

        false(msg?: string) {
          match(actual).with([false, msg || aString()]);
        },
      },
      throw(expected?: SchemaRule<any>) {
        if (typeof actual !== 'function') {
          throw new AssertionError(`Expected a function to assert throw, got ${typeof actual}`, {}, {});
        }

        const schema = __toFunction(expected || isInstanceOf(Error));

        try {
          actual();
        } catch (err: any) {
          match(err).with(schema);

          return;
        }

        throw new AssertionError(`Expected function to throw, but it did not`, {}, {});
      },
    },
  };
}
