import * as Fn from './index';
import { FunctionRule, PredicateRule } from './index';

export interface ExpressionVisitor<X> {
  literal(value: LiteralTypes): Built<X>;

  anything(): Built<X>;

  aBoolean(): Built<X>;

  aBigInt(): Built<X>;

  aNumber(): Built<X>;

  aString(options?: { length: number }): Built<X>;

  aDate(): Built<X>;

  nullable(schema: SchemaRule<any>): Built<X>;

  nullish(schema: SchemaRule<any>): Built<X>;

  optional(schema: SchemaRule<any>): Built<X>;

  oneOf(schemas: SchemaRule<any>[]): Built<X>;

  allOf(schemas: SchemaRule<any>[]): Built<X>;

  anyOf(schemas: SchemaRule<any>[]): Built<X>;

  objectShape(schema: ObjectRule<any>): Built<X>;

  objectLike(schema: ObjectRule<any>): Built<X>;

  re(rule: RegExp): Built<X>;

  strictEqual(value: unknown): Built<X>;

  instanceOf(ctor: abstract new (...args: any[]) => any, extraRule?: ObjectRule<any>): Built<X>;

  isPrototypedBy(ctor: abstract new (...args: any[]) => any): Built<X>;

  predicate(fn: Fn.PredicateRule<any>, message?: string): Built<X>;

  tuple(items: SchemaRule<any>[]): Built<X>;

  array(items: SchemaRule<any>[]): Built<X>;

  arrayOf(item: SchemaRule<any>, options?: { length: number }): Built<X>;
}

export type Built<X> = X;

type ExpressionType = keyof ExpressionVisitor<any>;

export declare const __infer: unique symbol;

/**
 * An expression rule - just like in the visitor pattern, but simpler - an acceptor
 */
export type ExpressionRule<T> = {
  /** Phantom type carrier — never present at runtime, binds T for Infer */
  readonly [__infer]?: T;

  type: ExpressionType;

  args?: any[];

  accept<X>(visitor: ExpressionVisitor<X>): Built<X>;
};

/**
 * The set of primitive types
 */
export type LiteralTypes = Fn.LiteralTypes;

/**
 * Blocks literal widening by the shape of the inference target, without stamping
 * `readonly` the way a `const` type parameter would.
 */
export type Narrow<A> = Fn.Narrow<A>;

/**
 * A literal rule
 */
export type LiteralRule<T> = Fn.PrimitiveRule<T>;

/**
 * A record rule or and object schema
 */
export type ObjectRule<T> = { [key in keyof T]: SchemaRule<T[key]> };

/**
 * An array rule
 */
export type ArrayRule<T> = SchemaRule<T>[];

/**
 * A schema rule
 */
export type SchemaRule<T> = LiteralRule<T> | ExpressionRule<T> | ObjectRule<T>;

/**
 * Infer the type of a schema rule
 */
export type Infer<T> = T extends LiteralTypes
  ? T
  : T extends ExpressionRule<infer P>
    ? P
    : T extends ObjectRule<infer P>
      ? { [K in keyof P]: Infer<P[K]> }
      : never;

/**
 * A intersection of schema rule types
 */
export type InferIntersection<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends SchemaRule<infer U>
    ? Rest extends any[]
      ? Infer<U> & InferIntersection<Rest>
      : Infer<U>
    : never
  : unknown;

/**
 * Infer the item type of an array
 */
export type ItemsOf<T> = Fn.ItemsOf<T>;

abstract class __Exp<T> {
  declare readonly [__infer]?: T;

  type: ExpressionType = null as any;
  args: any[] = null as any;

  accept<X>(visitor: ExpressionVisitor<X>): Built<X> {
    return (visitor[this.type] as (...args: any[]) => Built<X>)(...this.args);
  }
}

class __literal<T extends LiteralTypes> extends __Exp<T> {
  constructor(
    readonly args: [T],
    readonly type = 'literal' as const
  ) {
    super();
  }
}

export function literal<const T extends LiteralTypes>(arg: T): ExpressionRule<T> {
  return new __literal([arg]);
}

class __anything extends __Exp<any> {
  constructor(
    readonly args: [] = [],
    readonly type = 'anything' as const
  ) {
    super();
  }
}

/**
 * A rule that matches any value
 * Warning: using this rule disables the type inference of the value. Avoid using it with the rules `anyOf`, `oneOf` and `allOf`.
 * */
export function anything(): ExpressionRule<any> {
  return new __anything();
}

class __aBoolean extends __Exp<boolean> {
  constructor(
    readonly args: [] = [],
    readonly type = 'aBoolean' as const
  ) {
    super();
  }
}

export function aBoolean(): ExpressionRule<boolean> {
  return new __aBoolean();
}

class __aBigInt extends __Exp<bigint> {
  constructor(
    readonly args: [] = [],
    readonly type = 'aBigInt' as const
  ) {
    super();
  }
}

export function aBigInt(): ExpressionRule<bigint> {
  return new __aBigInt();
}

class __aDate extends __Exp<Date> {
  constructor(
    readonly args: [] = [],
    readonly type = 'aDate' as const
  ) {
    super();
  }
}

export function aDate(): ExpressionRule<Date> {
  return new __aDate();
}

class __nullable<T> extends __Exp<T> {
  constructor(
    readonly args: [SchemaRule<any>],
    readonly type = 'nullable' as const
  ) {
    super();
  }
}

export function nullable<T extends SchemaRule<any>>(rule: T): ExpressionRule<Infer<T> | null> {
  Fn.__assert(rule != null, 'nullable null or undefined? interesting...');

  return new __nullable<Infer<T> | null>([rule]);
}

class __nullish<T> extends __Exp<T> {
  constructor(
    readonly args: [SchemaRule<any>],
    readonly type = 'nullish' as const
  ) {
    super();
  }
}

export function nullish<T extends SchemaRule<any>>(rule: T): ExpressionRule<Infer<T> | null | undefined> {
  Fn.__assert(rule != null, 'nullish null or undefined? interesting...');

  return new __nullish<Infer<T> | null | undefined>([rule]);
}

class __optional<T> extends __Exp<T> {
  constructor(
    readonly args: [SchemaRule<any>],
    readonly type = 'optional' as const
  ) {
    super();
  }
}

export function optional<T extends SchemaRule<any>>(rule: T): ExpressionRule<Infer<T> | undefined> {
  Fn.__assert(rule !== undefined, 'optional undefined? interesting...');

  return new __optional<Infer<T> | undefined>([rule]);
}

class __oneOf<T> extends __Exp<T> {
  constructor(
    readonly args: [SchemaRule<any>[]],
    readonly type = 'oneOf' as const
  ) {
    super();
  }
}

export function oneOf<T extends Fn.AtLeastTwoItems<SchemaRule<any>>>(...items: T): ExpressionRule<Infer<ItemsOf<T>>> {
  Fn.__assert(items.length >= 2, 'oneOf requires at least two arguments');

  return new __oneOf<Infer<ItemsOf<T>>>([items]);
}

class __allOf<T> extends __Exp<T> {
  constructor(
    readonly args: [SchemaRule<any>[]],
    readonly type = 'allOf' as const
  ) {
    super();
  }
}

export function allOf<T extends Fn.AtLeastTwoItems<SchemaRule<any>>>(
  ...rules: T
): ExpressionRule<InferIntersection<T>> {
  Fn.__assert(rules.length >= 2, 'allOf requires at least two arguments');

  return new __allOf<InferIntersection<T>>([rules]);
}

class __anyOf<T> extends __Exp<T> {
  constructor(
    readonly args: [SchemaRule<any>[]],
    readonly type = 'anyOf' as const
  ) {
    super();
  }
}

export function anyOf<T extends Fn.AtLeastTwoItems<SchemaRule<any>>>(...items: T): ExpressionRule<Infer<ItemsOf<T>>> {
  Fn.__assert(items.length >= 2, 'anyOf requires at least two arguments');

  return new __anyOf<Infer<ItemsOf<T>>>([items]);
}

class __aNumber extends __Exp<number> {
  constructor(
    readonly args: [] = [],
    readonly type = 'aNumber' as const
  ) {
    super();
  }
}

export function aNumber(): ExpressionRule<number> {
  return new __aNumber();
}

class __aString extends __Exp<string> {
  constructor(
    readonly args: [] | [{ length: number }],
    readonly type = 'aString' as const
  ) {
    super();
  }
}

export function aString(options?: { length: number }): ExpressionRule<string> {
  return new __aString(options == null ? [] : [options]);
}

class __re extends __Exp<string> {
  constructor(
    readonly args: [RegExp],
    readonly type = 're' as const
  ) {
    super();
  }
}

export function re(rule: RegExp): ExpressionRule<string> {
  Fn.__assert(rule != null && rule instanceof RegExp, 'rule must be a RegExp');

  return new __re([rule]);
}

class __strictEqual<T> extends __Exp<T> {
  constructor(
    readonly args: [unknown],
    readonly type = 'strictEqual' as const
  ) {
    super();
  }
}

export function strictEqual<const T>(value: T): ExpressionRule<T> {
  return new __strictEqual<T>([value]);
}

class __instanceOf<T> extends __Exp<T> {
  constructor(
    readonly args: [abstract new (...args: any[]) => any] | [abstract new (...args: any[]) => any, ObjectRule<any>],
    readonly type = 'instanceOf' as const
  ) {
    super();
  }
}

export function instanceOf<T>(ctor: abstract new (...args: any[]) => T): ExpressionRule<T>;
export function instanceOf<T, S extends ObjectRule<any> = ObjectRule<any>>(
  ctor: abstract new (...args: any[]) => T,
  extraRule?: S
): ExpressionRule<T & Infer<S>>;
export function instanceOf<T, S extends ObjectRule<any> = ObjectRule<any>>(
  ctor: abstract new (...args: any[]) => T,
  extraRule?: S
): ExpressionRule<T & Infer<S>> {
  Fn.__assert(Fn.__typeOf(ctor) === '[object Function]', 'argument must be a constructor function');

  return new __instanceOf<T & Infer<S>>(extraRule == null ? [ctor] : [ctor, extraRule]);
}

class __isPrototypedBy<T> extends __Exp<T> {
  constructor(
    readonly args: [abstract new (...args: any[]) => any],
    readonly type = 'isPrototypedBy' as const
  ) {
    super();
  }
}

export function isPrototypedBy<T>(ctor: abstract new (...args: any[]) => T): ExpressionRule<T> {
  Fn.__assert(Fn.__typeOf(ctor) === '[object Function]', 'argument must be a constructor function');

  return new __isPrototypedBy<T>([ctor]);
}

class __predicate<T> extends __Exp<T> {
  constructor(
    readonly args: [Fn.PredicateRule<any>] | [Fn.PredicateRule<any>, string],
    readonly type = 'predicate' as const
  ) {
    super();
  }
}

export function predicate<T>(fn: Fn.PredicateRule<T>, message?: string): ExpressionRule<T> {
  Fn.__assert(typeof fn === 'function', 'predicate requires a function argument');

  return new __predicate<T>(message == null ? [fn] : [fn, message]);
}

class __objectShape<T> extends __Exp<T> {
  constructor(
    readonly args: [ObjectRule<any>],
    readonly type = 'objectShape' as const
  ) {
    super();
  }
}

export function objectShape<T extends ObjectRule<any>>(rule: T): ExpressionRule<Infer<T>> {
  Fn.__assert(rule != null, 'object shape rule cannot be null or undefined');

  return new __objectShape<Infer<T>>([rule]);
}

class __objectLike<T> extends __Exp<T> {
  constructor(
    readonly args: [ObjectRule<any>],
    readonly type = 'objectLike' as const
  ) {
    super();
  }
}

export function objectLike<T extends ObjectRule<any>>(rule: T): ExpressionRule<Infer<T>> {
  Fn.__assert(rule != null, 'object like rule cannot be null or undefined');

  return new __objectLike<Infer<T>>([rule]);
}

class __tuple<T> extends __Exp<T> {
  constructor(
    readonly args: [SchemaRule<any>[]],
    readonly type = 'tuple' as const
  ) {
    super();
  }
}

export function tuple<T extends SchemaRule<any>[]>(items: T): ExpressionRule<Infer<T>> {
  return new __tuple<Infer<T>>([items]);
}

class __array<T> extends __Exp<T> {
  constructor(
    readonly args: [SchemaRule<any>[]],
    readonly type = 'array' as const
  ) {
    super();
  }
}

export function array<T extends SchemaRule<any>[]>(items: T): ExpressionRule<Infer<ItemsOf<T>>[]> {
  return new __array<Infer<ItemsOf<T>>[]>([items]);
}

class __arrayOf<T> extends __Exp<T> {
  constructor(
    readonly args: [SchemaRule<any>] | [SchemaRule<any>, { length: number }],
    readonly type = 'arrayOf' as const
  ) {
    super();
  }
}

export function arrayOf<T extends SchemaRule<any>>(rule: T, options?: { length: number }): ExpressionRule<Infer<T>[]> {
  return new __arrayOf<Infer<T>[]>(options == null ? [rule] : [rule, options]);
}

function __isExpression(value: any): value is ExpressionRule<any> {
  return value instanceof __Exp;
}

/**
 * @internal
 */
export function __toExpression<T extends SchemaRule<any>>(schema: T): ExpressionRule<Infer<T>> {
  if (__isExpression(schema)) {
    return schema;
  }
  if (typeof schema === 'function') {
    throw new Error('bare functions are not supported by expressions');
  }
  if (Fn.__isLiteral(schema)) {
    return literal(schema) as ExpressionRule<Infer<T>>;
  }
  if (Fn.__isArray(schema)) {
    return array(schema.map((item) => __toExpression(item)) as any) as ExpressionRule<Infer<T>>;
  }
  if (Fn.__isError(schema)) {
    const ctor = schema.constructor as any;
    const message = schema.message;

    return instanceOf(ctor, { /*name, too strict*/ message, ...(schema as any) }) as ExpressionRule<Infer<T>>;
  }
  if (Fn.__isObject(schema)) {
    return objectShape(schema) as ExpressionRule<Infer<T>>;
  }

  throw new Error('hell knows');
}

type FnRendered = Built<Fn.FunctionRule<any>>;

const FunctionRenderer = new (class implements ExpressionVisitor<Fn.FunctionRule<any>> {
  literal<T extends LiteralTypes>(value: T): FnRendered {
    return Fn.literal(value);
  }

  anything(): FnRendered {
    return Fn.anything();
  }

  aBoolean(): FnRendered {
    return Fn.aBoolean();
  }

  aBigInt(): FnRendered {
    return Fn.aBigInt();
  }

  aNumber(): FnRendered {
    return Fn.aNumber();
  }

  aString(options?: { length: number }): FnRendered {
    return Fn.aString(options);
  }

  aDate(): FnRendered {
    return Fn.aDate();
  }

  nullable(schema: SchemaRule<any>): FnRendered {
    const expression = __toExpression(schema);

    return Fn.nullable(expression.accept(this));
  }

  nullish(schema: SchemaRule<any>): FnRendered {
    const expression = __toExpression(schema);

    return Fn.nullish(expression.accept(this));
  }

  optional(schema: SchemaRule<any>): FnRendered {
    const expression = __toExpression(schema);

    return Fn.optional(expression.accept(this));
  }

  oneOf(schema: SchemaRule<any>[]): FnRendered {
    const items = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return Fn.oneOf(...(items as any));
  }

  allOf(schema: SchemaRule<any>[]): FnRendered {
    const items = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return Fn.allOf(...(items as any));
  }

  anyOf(schema: SchemaRule<any>[]): FnRendered {
    const items = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return Fn.anyOf(...(items as any));
  }

  re(rule: RegExp): FnRendered {
    return Fn.re(rule);
  }

  strictEqual(value: unknown): FnRendered {
    return Fn.strictEqual(value);
  }

  instanceOf(ctor: abstract new (...args: any[]) => any, extraRule?: ObjectRule<any>): FnRendered {
    if (!extraRule) {
      return Fn.instanceOf(ctor);
    }

    const entries = Object.entries(extraRule).map(([key, value]) => {
      const expression = __toExpression(value);

      return [key, expression.accept(this)] as const;
    });

    return Fn.instanceOf(ctor, Object.fromEntries(entries));
  }

  isPrototypedBy(ctor: abstract new (...args: any[]) => any): FnRendered {
    return Fn.isPrototypedBy(ctor);
  }

  predicate(fn: Fn.PredicateRule<any>, message?: string): FnRendered {
    return Fn.predicate(fn, message);
  }

  objectShape(schema: ObjectRule<any>): FnRendered {
    const entries = Object.entries(schema).map(([key, value]) => {
      const expression = __toExpression(value);

      return [key, expression.accept(this)] as const;
    });

    const record = Object.fromEntries(entries);

    return Fn.objectShape(record);
  }

  objectLike(schema: ObjectRule<any>): FnRendered {
    const entries = Object.entries(schema).map(([key, value]) => {
      const expression = __toExpression(value);

      return [key, expression.accept(this)] as const;
    });

    const record = Object.fromEntries(entries);

    return Fn.objectLike(record);
  }

  tuple(schema: SchemaRule<any>[]): FnRendered {
    const items = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return Fn.tuple(items);
  }

  array(schema: SchemaRule<any>[]): FnRendered {
    const items = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return Fn.array(items);
  }

  arrayOf(schema: SchemaRule<any>, options?: { length: number }): FnRendered {
    const expression = __toExpression(schema);

    return Fn.arrayOf(expression.accept(this), options);
  }
})();

export function toFunction<T>(expression: ExpressionRule<T>): Fn.FunctionRule<T> {
  return expression.accept(FunctionRenderer);
}
