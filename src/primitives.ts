import { __invalid, __stringify, __typeOf, __valid, FunctionRule, LiteralTypes, ValidationResult } from './types.js';

/**
 * A rule - anything
 */
export function anything(): FunctionRule<unknown> {
  return function __anything(value: unknown): ValidationResult<any> {
    return __valid;
  };
}

/**
 * A rule - any string
 */
export function aString(): FunctionRule<string> {
  return function __aString(value: unknown): ValidationResult<string> {
    const type = __typeOf(value);

    return type === '[object String]' ? __valid : __invalid('expected a string, got ' + type);
  };
}

/**
 * A rule - any number
 */
export function aNumber(): FunctionRule<number> {
  return function __aNumber(value: unknown): ValidationResult<number> {
    const type = __typeOf(value);

    return type === '[object Number]' ? __valid : __invalid('expected a number, got ' + type);
  };
}

/**
 * A rule - any boolean
 */
export function aBoolean(): FunctionRule<boolean> {
  return function __aBoolean(value: unknown): ValidationResult<boolean> {
    const type = __typeOf(value);

    return type === '[object Boolean]' ? __valid : __invalid('expected a boolean, got ' + type);
  };
}

/**
 * A rule - null or undefined
 */
export function nullish(): FunctionRule<null> {
  return function __nullish(value: unknown): ValidationResult<null> {
    return value == null ? __valid : __invalid('expected null or undefined, got ' + __typeOf(value));
  };
}

/**
 * A rule - the null value
 */
export function aNull(): FunctionRule<null> {
  return function __aNull(value: unknown): ValidationResult<null> {
    return value === null ? __valid : __invalid('expected null, got ' + __typeOf(value));
  };
}

/**
 * A rule - the undefined value
 */
export function anUndefined(): FunctionRule<undefined> {
  return function __anUndefined(value: unknown): ValidationResult<undefined> {
    return value === undefined ? __valid : __invalid('expected undefined, got ' + __typeOf(value));
  };
}

/**
 * A rule - any date
 */
export function aDate(): FunctionRule<Date> {
  return function (value: unknown): ValidationResult<Date> {
    const type = __typeOf(value);

    return type === '[object Date]' ? __valid : __invalid('expected a date, got ' + type);
  };
}

/**
 * A rule - any RegExp
 */
export function aRegExp(): FunctionRule<RegExp> {
  return function __aRegExp(value: unknown): ValidationResult<RegExp> {
    const type = __typeOf(value);

    return type === '[object RegExp]' ? __valid : __invalid('expected a regexp, got ' + type);
  };
}

/**
 * A rule - any bigint
 */
export function aBigInt(): FunctionRule<bigint> {
  return function __aBigInt(value: unknown): ValidationResult<bigint> {
    const type = __typeOf(value);

    return type === '[object BigInt]' ? __valid : __invalid('expected a bigint, got ' + type);
  };
}

/**
 * A rule - match the string value against a regular expression
 * @param rule
 */
export function re(rule: RegExp): FunctionRule<string> {
  return function __re(value: unknown) {
    if (typeof value !== 'string') {
      return __invalid(`expected string, got ${__typeOf(value)}`);
    }

    if (!rule.test(value)) {
      return __invalid(`expected ${rule}, got ${value}`);
    }

    return __valid;
  };
}

/**
 * Create A rule - a value type literal
 * @param value The value
 * @returns The rule
 */
export function literal<const T extends LiteralTypes>(value: T): FunctionRule<T> {
  if (value instanceof Date) {
    return function __date(x: unknown) {
      if (x instanceof Date && x.getTime() === value.getTime()) {
        return __valid;
      }

      return __invalid(`expected ${__stringify(value)}, got ${__stringify(x)}`);
    };
  }
  if (value instanceof RegExp) {
    return function __regexp(x: unknown) {
      if (x instanceof RegExp && x.toString() === value.toString()) {
        return __valid;
      }

      return __invalid(`expected ${__stringify(value)}, got ${__stringify(x)}`);
    };
  }

  return function __primitive(x: unknown) {
    if (x === value) {
      return __valid;
    }

    return __invalid(`expected ${__stringify(value)}, got ${__stringify(x)}`);
  };
}
