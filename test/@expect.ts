import { AssertionError, aString, Invalid, SchemaRule, Valid, validate } from '../src';

export function expectType<A>(arg?: A): { is<X extends A>(): void } {
  return {
    is<X extends A>() {
      // do nothing
    },
  };
}

export function expect(actual: any) {
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
    },
  };
}
