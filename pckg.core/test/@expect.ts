import { __toFunction, AssertionError, aString, Invalid, instanceOf, match, SchemaRule, Valid } from '../src';

const fnAssertionException = ({ message, actual, schema }: any) => new AssertionError(message, actual, schema);

export function expect(actual: unknown) {
  return {
    to: {
      match(rule: Valid<any> | Invalid<any>) {
        match(actual).with(rule, fnAssertionException);
      },
      be: {
        true() {
          match(actual).with([true], fnAssertionException);
        },

        false(msg?: string) {
          match(actual).with([false, msg || aString()], fnAssertionException);
        },
      },
      throw(expected?: SchemaRule<any>) {
        if (typeof actual !== 'function') {
          throw new AssertionError(`Expected a function to assert throw, got ${typeof actual}`, {}, {});
        }

        const schema = __toFunction(expected || instanceOf(Error));

        try {
          actual();
        } catch (err: any) {
          match(err).with(schema, fnAssertionException);

          return;
        }

        throw new AssertionError(`Expected function to throw, but it did not`, {}, {});
      },
    },
  };
}
