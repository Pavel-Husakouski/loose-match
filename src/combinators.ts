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
import { literal } from './literals.js';
import { __assert } from './assert.js';

/**
 * A rule - an object shape with specific properties
 * Note: object is considered as [object Object]
 */
export function objectShape<T extends ObjectRule<any>>(rule: T): FunctionRule<Infer<T>> {
  __assert(rule != null, 'object shape rule cannot be null or undefined');

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
  __assert(rule != null, 'object like rule cannot be null or undefined');

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

function __tupleExact<T extends SchemaRule<T>[]>(items: T): FunctionRule<Infer<T>> {
  const rules = items.map(__toFunction);

  return function __tupleIs(value: unknown) {
    if (!Array.isArray(value)) {
      return __invalid(`expected tuple, got ${__typeOf(value)}`);
    }

    if (value.length !== rules.length) {
      return __invalid(`expected tuple of ${rules.length} items, got ${value.length}`);
    }

    const result = __elements(value, rules);

    if (!result[0]) {
      return result;
    }

    return __valid;
  };
}

function __elements(value: Array<any>, rules: FunctionRule<any>[]) {
  for (let i = 0; i < rules.length; i++) {
    const v = value[i];
    const [succeed, message] = rules[i](v);

    if (!succeed) {
      return __invalid(`[${i}] ${message}`);
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

    const result = __elements(value, rules);

    if (!result[0]) {
      return result;
    }

    if (value.length !== rules.length) {
      return __invalid(`expected array of ${rules.length} items, got ${value.length}`);
    }

    return __valid;
  };
}

/**
 * A rule - a tuple with positionally fixed items, every item must match the corresponding rule
 */
export function tuple<const T extends SchemaRule<any>[]>(items: T): FunctionRule<Infer<T>> {
  return __tupleExact(items);
}

/**
 * A rule - an array with positionally fixed items, every item must match the corresponding rule
 */
export function array<T extends SchemaRule<any>[]>(items: T): FunctionRule<Infer<ItemsOf<T>>[]> {
  return __arrayExact(items as any) as any;
}

/**
 * A rule - an array of items, every item must match the schema rule
 * @param schema The rule for each item
 */
export function arrayOf<T extends SchemaRule<any>>(schema: T): FunctionRule<Infer<T>[]> {
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

  return __all(rules);
}

/**
 * A rule - either null or undefined or specified schema
 * @param schema The schema
 */
export function nullish<T extends SchemaRule<any>>(schema: T): FunctionRule<Infer<T> | null | undefined> {
  __assert(schema != null, 'nullish null or undefined? interesting...');

  const rule = __toFunction(schema);

  return function __nullish(value: any) {
    if (value == null) {
      return __valid;
    }

    return rule(value);
  };
}

/**
 * A combinator rule - a rule that accepts undefined or the specified schema
 * @param schema The schema
 */
export function optional<T extends SchemaRule<any>>(schema: T): FunctionRule<Infer<T> | undefined> {
  __assert(schema !== undefined, 'optional undefined? interesting...');

  const rule = __toFunction(schema);

  return function __optional(value: any) {
    if (value === undefined) {
      return __valid;
    }

    return rule(value);
  };
}

/**
 * A combinator rule - a rule that accepts null or the specified schema
 * @param schema The schema
 */
export function nullable<T extends SchemaRule<any>>(schema: T): FunctionRule<Infer<T> | null> {
  __assert(schema != null, 'nullable null or undefined? interesting...');

  const rule = __toFunction(schema);

  return function __nullable(value: any) {
    if (value === null) {
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

  return __oneOf(items);
}

/**
 * A combinator rule - a union of rules with any number of matches except zero
 * @param items The rules to be applied
 */
export function anyOf<T extends AtLeastTwoItems<SchemaRule<any>>>(...items: T): FunctionRule<Infer<ItemsOf<T>>> {
  __assert(items.length >= 2, 'anyOf requires at least two arguments');

  function __anyOf<T extends SchemaRule<T>[]>(items: T): FunctionRule<Infer<ItemsOf<T>>> {
    const rules = items.map(__toFunction);

    return function __some(value: Infer<ItemsOf<T>>) {
      for (const rule of rules) {
        const [succeed, message] = rule(value);

        if (succeed) {
          return __valid;
        }
      }

      return __invalid(`expected at least one of ${items.length} rules, got 0 matches`);
    };
  }

  return __anyOf(items);
}

/**
 * A rule - an object prototyped by a specific constructor function
 * @param ctor
 */
export function isPrototypedBy<T>(ctor: abstract new (...args: any[]) => T): FunctionRule<T> {
  __assert(__typeOf(ctor) === '[object Function]', 'argument must be a constructor function');

  return function __isPrototypedBy(value: unknown) {
    if (typeof value === 'function') {
      if (ctor.isPrototypeOf(value)) {
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
 * A rule - an instance of a class and optionally matches an extra object shape rule
 * @param ctor The class constructor
 */
export function instanceOf<T>(ctor: abstract new (...args: any[]) => T): FunctionRule<T>;
/**
 * A rule - an instance of a class and optionally matches an extra object shape rule
 * @param ctor The class constructor
 * @param extraRule An optional extra object shape rule to match the instance properties
 */
export function instanceOf<T, S extends ObjectRule<any> = ObjectRule<any>>(
  ctor: abstract new (...args: any[]) => T,
  extraRule?: S
): FunctionRule<T & Infer<S>>;
export function instanceOf<T, S extends ObjectRule<any> = ObjectRule<any>>(
  ctor: abstract new (...args: any[]) => T,
  extraRule?: S
): FunctionRule<T & Infer<S>> {
  __assert(__typeOf(ctor) === '[object Function]', 'argument must be a constructor function');

  function __instanceOf(value: unknown) {
    const instance = new Object(value);

    if (value != null && instance instanceof ctor) {
      return __valid;
    }

    const ctorOrNull = value == null ? String(value) : instance.constructor.name;

    return __invalid(`expected instanceof ${ctor.name} got instanceof ${ctorOrNull}`);
  }
  function __instanceOfWith(value: unknown) {
    const isInstance = __instanceOf(value);

    if (!isInstance[0]) {
      return isInstance;
    }

    return __objectLike(value as any);
  }
  function __objectLike(value: unknown) {
    if (value == null) {
      return __invalid(`expected non null value, got ${__stringify(value)}`);
    }

    return __props(value, extraRule as any);
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
    return __arrayExact(schema) as FunctionRule<Infer<T>>;
  }
  if (__isError(schema)) {
    const ctor = schema.constructor as any;
    const name = schema.name;
    const message = schema.message as any;

    return instanceOf(ctor, { /*name, too strict*/ message, ...(schema as any) });
  }
  if (__isObject(schema)) {
    return __objectShape(schema) as FunctionRule<Infer<T>>;
  }

  throw new Error('hell knows');
}

/**
 * A rule - a custom predicate function
 * @param fn The predicate function
 * @param message The error message when the predicate fails, default to "predicate failed for <value>"
 */
export function predicate<T>(fn: PredicateRule<T>, message?: string): FunctionRule<T> {
  __assert(typeof fn === 'function', 'predicate requires a function argument');

  return function __predicate(value: T) {
    if (fn(value)) {
      return __valid;
    }

    return __invalid(message || `predicate failed for ${__stringify(value)}`);
  };
}
