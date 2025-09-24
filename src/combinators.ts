import {
  __invalid,
  __isArray,
  __isError,
  __isLiteral,
  __isObject,
  __stringify,
  __typeOf,
  __valid,
  FunctionRule,
  Infer,
  InferIntersection,
  ItemsOf,
  ObjectRule,
  SchemaRule,
} from './types.js';
import { literal } from './primitives';

/**
 * A rule - an object with specific properties
 */
export function objectWith<T extends ObjectRule<any>>(rule: T): FunctionRule<Infer<T>> {
  return __objectWith(rule);
}

function __objectWith<T extends ObjectRule<any> = ObjectRule<any>>(schemaRule: T): FunctionRule<Infer<T>> {
  return function __object(value: unknown) {
    if (!__isObject(value)) {
      return __invalid(`expected object, got ${__stringify(value)}`);
    }

    return __props(value, schemaRule);
  };
}

/**
 * A rule - a shape of the object-like value (non-null)
 */
export function shapeWith<T extends ObjectRule<any>>(rule: T): FunctionRule<Infer<T>> {
  return __shapeWith(rule);
}

function __props<T extends ObjectRule<any> = ObjectRule<any>>(value: unknown, schemaRule: T) {
  const obj = Object(value);

  for (const property in schemaRule) {
    if (!schemaRule.hasOwnProperty(property)) {
      continue;
    }
    const rule = __toFunction(schemaRule[property]);
    const value = obj[property];
    const [succeed, message] = rule(value);

    if (!succeed) {
      return __invalid(`[${property}] ${message}`);
    }
  }

  return __valid;
}

function __shapeWith<T extends ObjectRule<any> = ObjectRule<any>>(schemaRule: T): FunctionRule<Infer<T>> {
  return function __shapeWith(value: Infer<T>) {
    if (value == null) {
      return __invalid(`expected non null value, got ${__stringify(value)}`);
    }

    return __props(value, schemaRule);
  };
}

function __arrayWith<T extends SchemaRule<T>[]>(items: T): FunctionRule<Infer<T>> {
  const rules = items.map(__toFunction);

  return function __arrayIs(value: unknown) {
    if (!Array.isArray(value)) {
      return __invalid(`expected array, got ${__typeOf(value)}`);
    }

    if (value.length !== rules.length) {
      return __invalid(`expected array of ${rules.length} items, got ${value.length}`);
    }

    for (let i = 0; i < rules.length; i++) {
      const v = value[i];
      const [succeed, message] = rules[i](v);

      if (!succeed) {
        return __invalid(`[${i}] ${message}`);
      }
    }

    return __valid;
  };
}

/**
 * A rule - a tuple of items
 */
export function tupleWith<T extends SchemaRule<any>[]>(...items: T): FunctionRule<Infer<T>> {
  return __arrayWith(items);
}

/**
 * A rule - an array with fixed items
 */
export function arrayWith<T extends SchemaRule<any>[]>(...items: T): FunctionRule<Infer<ItemsOf<T>>[]> {
  return __arrayWith(items as any) as any;
}

/**
 * A rule - an array of items
 * @param item The rule for each item
 */
export function arrayOf<T extends SchemaRule<any>>(item: T): FunctionRule<Infer<T>[]> {
  const rule = __toFunction(item);

  return function __arrayOf(items: unknown) {
    if (!Array.isArray(items)) {
      return __invalid(`expected array, got ${__typeOf(items)}`);
    }

    for (let i = 0; i < items.length; i++) {
      const v = items[i];
      const [succeed, message] = rule(v);

      if (!succeed) {
        return __invalid(`[${i}] ${message}`);
      }
    }

    return __valid;
  };
}

/**
 * A combinator rule - an intersection of rules
 * @param rules The rules to be applied
 */
export function allOf<T extends SchemaRule<any>[]>(...rules: T): FunctionRule<InferIntersection<T>> {
  return __all(rules);
}

function __all<T>(items: SchemaRule<T>[]): FunctionRule<any> {
  const rules = items.map(__toFunction);

  return function __all(value: T) {
    for (const rule of rules) {
      const [succeed, message] = rule(value);

      if (!succeed) {
        return __invalid(message);
      }
    }

    return __valid;
  };
}

/**
 * A combinator rule - a nullable rule
 * @param schema The schema to make nullable
 */
export function nullable<T extends SchemaRule<any>>(schema: T): FunctionRule<Infer<T> | null | undefined> {
  const rule = __toFunction(schema);

  return function __nullable(value: Infer<T>) {
    if (value == null) {
      return __valid;
    }

    return rule(value);
  };
}

/**
 * A combinator rule - a not rule
 * @param items The rule
 */
export function not<T extends SchemaRule<any>>(items: T): FunctionRule<never> {
  return __not(items);
}

function __not<T extends SchemaRule<any>>(item: T): FunctionRule<never> {
  const rule = __toFunction(item);

  return function __not(value: never) {
    const [succeed, message] = rule(value);

    if (succeed) {
      return __invalid(`expected not to match, but got a match`);
    }

    return __valid;
  };
}

/**
 * A combinator rule - a none rule
 * @param items The rules to be applied
 */
export function noneOf<T extends SchemaRule<any>[]>(...items: T): FunctionRule<never> {
  return __noneOf(items);
}

function __noneOf<T extends SchemaRule<any>[]>(items: T): FunctionRule<never> {
  const rules = items.map(__toFunction);

  return function __noneOf(value: never) {
    let i = 0;

    for (const rule of rules) {
      const [succeed] = rule(value);

      if (succeed) {
        return __invalid(`expected none of ${items.length} rules, got a match at index ${i}`);
      }
      i++;
    }

    return __valid;
  };
}

/**
 * A combinator rule - a union of rules with exactly one match
 * @param items The rules to be applied
 */
export function oneOf<T extends SchemaRule<any>[]>(...items: T): FunctionRule<Infer<ItemsOf<T>>> {
  return __oneOf(items);
}

function __oneOf<T extends SchemaRule<any>[]>(items: T): FunctionRule<Infer<ItemsOf<T>>> {
  const rules = items.map(__toFunction);

  return function __oneOf(value: Infer<ItemsOf<T>>) {
    let count = 0;
    let i = 0;

    for (const rule of rules) {
      const [succeed] = rule(value);

      if (succeed) {
        count++;

        if (count > 1) {
          return __invalid(`expected one of ${items.length} rules, got multiple matches at index ${i}`);
        }
      }
      i++;
    }

    if (count === 0) {
      return __invalid(`expected one of ${items.length} rules, got 0 matches`);
    }

    return __valid;
  };
}

/**
 * A combinator rule - a union of rules with any number of matches except zero
 * @param items The rules to be applied
 */
export function anyOf<T extends SchemaRule<any>[]>(...items: T): FunctionRule<Infer<ItemsOf<T>>> {
  return __anyOf(items);
}

function __anyOf<T extends SchemaRule<T>[]>(items: T): FunctionRule<Infer<ItemsOf<T>>> {
  const rules = items.map(__toFunction);

  return function __some(value: Infer<ItemsOf<T>>) {
    const errors = [];

    for (const rule of rules) {
      const [succeed, message] = rule(value);

      if (succeed) {
        return __valid;
      }

      errors.push(message);
    }

    return __invalid(errors.join(','));
  };
}

/**
 * A rule - an instance of a class
 * @param ctor The class constructor
 */
export function instanceOf<T>(ctor: abstract new (...args: any[]) => T): FunctionRule<T> {
  return function __instanceOf(value: T) {
    const instance = new Object(value);

    if (value != null && instance instanceof ctor) {
      return __valid;
    }

    const ctorOrNull = value == null ? String(value) : instance.constructor.name;

    return __invalid(`expected ${ctor.name} got ${ctorOrNull}`);
  };
}

/**
 * A rule - an error object of a specific class and properties
 * @param rule The rule to validate the error properties
 * @param clazz The error class, default to Error
 */
export function errorWith<T extends ObjectRule<any>, E extends Error = Error>(
  rule: T,
  clazz: abstract new (...args: any[]) => E = Error as any
): FunctionRule<InferIntersection<[T, E]>> {
  return allOf(shapeWith(rule), instanceOf(clazz || Error));
}

/**
 * A rule - the exact equality of a value
 * @param value The value
 * @returns The rule
 */
export function equals<const T>(value: T): FunctionRule<T> {
  return function __equals(o: unknown) {
    if (value === o) {
      return __valid;
    }

    return __invalid(`expected strict equals ${__stringify(value)}, got ${__stringify(o)}`);
  };
}

/**
 * @internal
 */
export function __toFunction<T extends SchemaRule<any>>(schema: T): FunctionRule<Infer<T>> {
  if (typeof schema === 'function') {
    return schema as FunctionRule<Infer<T>>;
  }
  if (__isLiteral(schema)) {
    return literal(schema) as FunctionRule<Infer<T>>;
  }
  if (__isArray(schema)) {
    return __arrayWith(schema);
  }
  if (__isError(schema)) {
    const ctor = schema.constructor;
    const name = schema.name;
    const message = schema.message;

    // @ts-ignore spread operator has issues with error properties
    return errorWith({ /*name, too strict*/ message, ...schema }, ctor as any);
  }
  if (__isObject(schema)) {
    return __objectWith(schema);
  }

  throw new Error('hell knows');
}
