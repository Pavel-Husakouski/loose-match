import {
  __invalid,
  __isArray,
  __isError,
  __isLiteral,
  __isObject,
  __stringify,
  __typeOf,
  __valid,
  AtLeastTwoItems,
  FunctionRule,
  Infer,
  InferIntersection,
  ItemsOf,
  ObjectRule,
  PredicateRule,
  SchemaRule,
} from './types.js';
import { literal } from './literals';
import { __assert } from './assert';

/**
 * A rule - an object shape with specific properties
 * Note: object is considered as [object Object]
 */
export function objectShape<T extends ObjectRule<any>>(rule: T): FunctionRule<Infer<T>> {
  return __objectShape(rule);
}

function __objectShape<T extends ObjectRule<any> = ObjectRule<any>>(schemaRule: T): FunctionRule<Infer<T>> {
  return function __object(value: unknown) {
    if (!__isObject(value)) {
      return __invalid(`expected object, got ${__stringify(value)}`);
    }

    return __props(value, schemaRule);
  };
}

/**
 * A rule - a shape of the non-null object-like value.
 * Note: object-like is considered as any non-null object, including errors, arrays, functions, dates, etc.
 */
export function objectLike<T extends ObjectRule<any>>(rule: T): FunctionRule<Infer<T>> {
  return function __objectLike(value: Infer<T>) {
    if (value == null) {
      return __invalid(`expected non null value, got ${__stringify(value)}`);
    }

    return __props(value, rule);
  };
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

function __arrayExact<T extends SchemaRule<T>[]>(items: T): FunctionRule<Infer<T>> {
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
 * A rule - a tuple with positionally fixed items, every item must match the corresponding rule
 */
export function tupleWhole<T extends SchemaRule<any>[]>(...items: T): FunctionRule<Infer<T>> {
  return __arrayExact(items);
}

/**
 * A rule - an array with positionally fixed items, every item must match the corresponding rule
 */
export function arrayWhole<T extends SchemaRule<any>[]>(...items: T): FunctionRule<Infer<ItemsOf<T>>[]> {
  return __arrayExact(items as any) as any;
}

/**
 * A rule - an array of items, every item must match the schema rule
 * @param schema The rule for each item
 */
export function arrayItems<T extends SchemaRule<any>>(schema: T): FunctionRule<Infer<T>[]> {
  const fnRule = __toFunction(schema);

  return function __arrayOf(items: unknown) {
    if (!Array.isArray(items)) {
      return __invalid(`expected array, got ${__typeOf(items)}`);
    }

    for (let i = 0; i < items.length; i++) {
      const v = items[i];
      const [succeed, message] = fnRule(v);

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
export function allOf<T extends AtLeastTwoItems<SchemaRule<any>>>(...rules: T): FunctionRule<InferIntersection<T>> {
  __assert(rules.length >= 2, 'allOf requires at least two arguments');

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
 * A combinator rule - a union of rules with exactly one match
 * @param items The rules to be applied
 */
export function oneOf<T extends AtLeastTwoItems<SchemaRule<any>>>(...items: T): FunctionRule<Infer<ItemsOf<T>>> {
  __assert(items.length >= 2, 'oneOf requires at least two arguments');

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
export function anyOf<T extends AtLeastTwoItems<SchemaRule<any>>>(...items: T): FunctionRule<Infer<ItemsOf<T>>> {
  __assert(items.length >= 2, 'anyOf requires at least two arguments');

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
 * A rule -
 * @param ctor
 */
export function isPrototypedBy<T>(ctor: abstract new (...args: any[]) => T): FunctionRule<T> {
  __assert(__typeOf(ctor) === '[object Function]', 'argument must be a constructor function');

  return function __isPrototypedBy(value: unknown) {
    if (typeof value === 'function') {
      const proto = (value as any).prototype;

      if (proto && Object.prototype.isPrototypeOf.call(ctor.prototype, proto)) {
        return __valid;
      }
    } else {
      // For non-functions, check whether ctor.prototype is in the object's prototype chain
      const obj = Object(value);

      if (Object.prototype.isPrototypeOf.call(ctor.prototype, obj)) {
        return __valid;
      }
    }

    const ctorOrNull = value == null ? String(value) : Object(value).constructor.name;

    return __invalid(`expected object prototyped by ${ctor.name} got ${ctorOrNull}`);
  };
}

/**
 * A rule - an instance of a class
 * @param ctor The class constructor
 */
export function isInstanceOf<T>(ctor: abstract new (...args: any[]) => T): FunctionRule<T>;
export function isInstanceOf<T, S extends ObjectRule<any> = ObjectRule<T>>(
  ctor: abstract new (...args: any[]) => T,
  extraRule?: S
): FunctionRule<T & Infer<S>>;
export function isInstanceOf<T, S extends ObjectRule<any> = ObjectRule<T>>(
  ctor: abstract new (...args: any[]) => T,
  extraRule?: S
): FunctionRule<T & Infer<S>> {
  function __instanceOf(value: unknown) {
    const instance = new Object(value);

    if (value != null && instance instanceof ctor) {
      return __valid;
    }

    const ctorOrNull = value == null ? String(value) : instance.constructor.name;

    return __invalid(`expected ${ctor.name} got ${ctorOrNull}`);
  }
  const shapeRule = objectLike(extraRule as ObjectRule<any>);
  function __instanceOfWith(value: unknown) {
    const isInstance = __instanceOf(value);

    if (!isInstance[0]) {
      return isInstance;
    }

    return shapeRule(value as any);
  }

  if (!extraRule) {
    return __instanceOf;
  }

  return __instanceOfWith as any;
}

/**
 * A rule - the strict equality to a value, e.g. a reference equality (===)
 * @param value The value
 * @returns The rule
 */
export function strictEqual<const T>(value: T): FunctionRule<T> {
  return function __strictEqual(o: unknown) {
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
    return __arrayExact(schema);
  }
  if (__isError(schema)) {
    const ctor = schema.constructor as any;
    const name = schema.name;
    const message = schema.message as any;

    return isInstanceOf(ctor, { /*name, too strict*/ message, ...(schema as any) });
  }
  if (__isObject(schema)) {
    return __objectShape(schema);
  }

  throw new Error('hell knows');
}

/**
 * A rule - a custom predicate function
 * @param fn The predicate function
 * @param message The error message when the predicate fails, default to "predicate failed for <value>"
 */
export function predicate<T>(fn: PredicateRule<T>, message?: string): FunctionRule<T> {
  return function __predicate(value: T) {
    if (fn(value)) {
      return __valid;
    }

    return __invalid(message || `predicate failed for ${__stringify(value)}`);
  };
}
