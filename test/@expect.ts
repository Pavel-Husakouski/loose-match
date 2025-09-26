import { __toFunction, AssertionError, aString, Invalid, isInstanceOf, SchemaRule, Valid, validate } from '../src';

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
        const result = validate(rule as SchemaRule<any>, actual);

        if (result[0] !== true) {
          throw new AssertionError(`Expected |${result}|, but got |${actual}|`, actual, rule);
        }
      },
      be: {
        true() {
          const result = validate([true], actual);

          if (result[0] !== true) {
            throw new AssertionError(`Expected |${[true]}|, but got |${actual}|`, actual, [true]);
          }
        },

        false(msg?: string) {
          const result = validate([false, msg || aString()], actual);

          if (result[0] !== true) {
            throw new AssertionError(`Expected |${[false, msg || '<string>']}|, but got |${actual}|`, actual, [
              false,
              msg || '<string>',
            ]);
          }
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
          const result = validate(schema, err);

          if (result[0] === true) {
            return;
          }

          throw new AssertionError(result[1], err, schema);
        }

        throw new AssertionError(`Expected function to throw, but it did not`, {}, {});
      },
    },
  };
}
