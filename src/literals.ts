import { __invalid, __stringify, __typeOf, __valid, FunctionRule, LiteralTypes, ValidationResult } from './types.js';
import { __assert } from './assert';

/**
 * A rule - any value (always valid).
 * Warning: using this rule disables the type inference of the value. Avoid using it with the rules `anyOf`, `oneOf` and `allOf`.
 */
export function anything(): FunctionRule<any> {
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
 * A rule - any date
 */
export function aDate(): FunctionRule<Date> {
  return function __aDate(value: unknown): ValidationResult<Date> {
    const type = __typeOf(value);

    return type === '[object Date]' ? __valid : __invalid('expected a date, got ' + type);
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
  __assert(rule != null && rule instanceof RegExp, 'rule must be a RegExp');

  return function __re(value: unknown) {
    if (typeof value !== 'string') {
      return __invalid(`expected string, got ${__typeOf(value)}`);
    }

    if (!rule.test(value)) {
      return __invalid(`expected ${rule}, got ${__stringify(value)}`);
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
  return function __literal(x: unknown) {
    if (__literalIs(x, value)) {
      return __valid;
    }

    return __invalid(`expected ${__stringify(value)}, got ${__stringify(x)}`);
  };
}

function __literalIs(a: any, b: any): boolean {
  // Fast path for strict equality (includes same object refs, same primitives, +0/-0 considered equal)
  if (a === b) {
    return true;
  }

  // Handle NaN
  if (a !== a && b !== b) {
    return true;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  return false;
}
