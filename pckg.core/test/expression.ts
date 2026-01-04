import * as utils from 'node:util';
import * as Fn from '../src';

export function expectType<A>(arg?: A): { is<X extends A>(): void } {
  return {
    is<X extends A>() {
      // do nothing
    },
  };
}

export interface ExpressionVisitor<X> {
  literal(value: LiteralTypes): Built<X>;

  aBoolean(): Built<X>;

  aBigInt(): Built<X>;

  aNumber(): Built<X>;

  aString(): Built<X>;

  aDate(): Built<X>;

  // nullish(): Built<X>;

  nullable(schema: SchemaRule<any>): Built<X>;

  nullish(schema: SchemaRule<any>): Built<X>;

  optional(schema: SchemaRule<any>): Built<X>;

  oneOf(schemas: SchemaRule<any>[]): Built<X>;

  allOf(schemas: SchemaRule<any>[]): Built<X>;

  //anyOf(schemas: SchemaRule<any>[]): Built<X>;

  objectShape(schema: ObjectRule<any>): Built<X>;

  // objectLike(schema: ObjectRule<any>): Built<X>;

  re(rule: RegExp): Built<X>;

  // tuple(items: SchemaRule<any>[]): Built<X>;
  //
  // array(items: SchemaRule<any>[]): Built<X>;
  //
  // arrayOf(item: SchemaRule<any>): Built<X>;
}

export type Built<X> = X;

type ExpressionType = keyof ExpressionVisitor<any>;

/**
 * An expression rule - just like in the visitor pattern, but simpler - an acceptor
 */
export type ExpressionRule<T> = {
  type: ExpressionType;

  arg?: any;

  accept<X>(visitor: ExpressionVisitor<X>): Built<X>;
};

/**
 * The set of primitive types
 */
export type LiteralTypes = Fn.LiteralTypes;

/**
 * A literal rule
 */
export type LiteralRule<T> = T extends LiteralTypes ? T : never;

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
export type SchemaRule<T> = LiteralRule<T> /*| PredicateRule<T>*/ | ExpressionRule<T> | ObjectRule<T>;

/**
 * Infer the type of a schema rule
 */
export type Infer<T> = T extends LiteralTypes
  ? T
  : T extends LiteralRule<infer P>
    ? P
    : /*T extends PredicateRule<infer P>
      ? P
      :*/ T extends ExpressionRule<infer P>
      ? P
      : T extends ObjectRule<infer P>
        ? { [K in keyof P]: Infer<P[K]> }
        : // T extends [infer Head, ...infer Tail] ? [Infer<Head>, ...Infer<Tail>] :
          T extends ArrayRule<infer P>
          ? Infer<P>[]
          : never;

/**
 * A intersection of schema rule types
 */
export type InferIntersection<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends SchemaRule<infer U>
    ? Rest extends any[]
      ? U & InferIntersection<Rest>
      : U
    : never
  : unknown;

/**
 * Infer the item type of an array
 */
export type ItemsOf<T> = T extends (infer P)[] ? P : never;

class __Exp {
  type: ExpressionType = null as any;
  arg: any;

  accept<X>(visitor: ExpressionVisitor<X>): Built<X> {
    return visitor[this.type](this.arg);
  }
}

class __literal extends __Exp {
  constructor(
    readonly arg: LiteralTypes,
    readonly type = 'literal' as const
  ) {
    super();
  }
}

export function literal<T extends LiteralTypes>(arg: T): ExpressionRule<Infer<T>> {
  return new __literal(arg);
}

class __aBoolean extends __Exp {
  constructor(
    readonly arg: null,
    readonly type = 'aBoolean' as const
  ) {
    super();
  }
}

export function aBoolean(): ExpressionRule<boolean> {
  return new __aBoolean(null);
}

class __aBigInt extends __Exp {
  constructor(
    readonly arg: null,
    readonly type = 'aBigInt' as const
  ) {
    super();
  }
}

export function aBigInt(): ExpressionRule<bigint> {
  return new __aBigInt(null);
}

class __aDate extends __Exp {
  constructor(
    readonly arg: null,
    readonly type = 'aDate' as const
  ) {
    super();
  }
}

export function aDate(): ExpressionRule<Date> {
  return new __aDate(null);
}

class __nullable extends __Exp {
  constructor(
    readonly arg: SchemaRule<any>,
    readonly type = 'nullable' as const
  ) {
    super();
  }
}

export function nullable<T extends SchemaRule<any>>(rule: T): ExpressionRule<Infer<T> | null> {
  return new __nullable(rule);
}

class __nullish extends __Exp {
  constructor(
    readonly arg: SchemaRule<any>,
    readonly type = 'nullish' as const
  ) {
    super();
  }
}

export function nullish<T extends SchemaRule<any>>(rule: T): ExpressionRule<Infer<T> | null | undefined> {
  return new __nullish(rule);
}

class __optional extends __Exp {
  constructor(
    readonly arg: SchemaRule<any>,
    readonly type = 'optional' as const
  ) {
    super();
  }
}

export function optional<T extends SchemaRule<any>>(rule: T): ExpressionRule<Infer<T> | undefined> {
  return new __optional(rule);
}

class __oneOf extends __Exp {
  constructor(
    readonly arg: SchemaRule<any>[],
    readonly type = 'oneOf' as const
  ) {
    super();
  }
}

export function oneOf<T extends SchemaRule<any>[]>(...arg: T): ExpressionRule<Infer<ItemsOf<T>>> {
  return new __oneOf(arg);
}

class __allOf extends __Exp {
  constructor(
    readonly arg: SchemaRule<any>[],
    readonly type = 'allOf' as const
  ) {
    super();
  }
}

export function allOf<T extends SchemaRule<any>[]>(...rules: T): ExpressionRule<InferIntersection<T>> {
  return new __allOf(rules);
}

class __aNumber extends __Exp {
  constructor(
    readonly arg: null,
    readonly type = 'aNumber' as const
  ) {
    super();
  }
}

export function aNumber(): ExpressionRule<number> {
  return new __aNumber(null);
}

class __aString extends __Exp {
  constructor(
    readonly arg: null,
    readonly type = 'aString' as const
  ) {
    super();
  }
}

export function aString(): ExpressionRule<string> {
  return new __aString(null);
}

class __re extends __Exp {
  constructor(
    readonly arg: RegExp,
    readonly type = 're' as const
  ) {
    super();
  }
}

export function re(rule: RegExp): ExpressionRule<string> {
  return new __re(rule);
}

class __objectShape extends __Exp {
  constructor(
    readonly arg: ObjectRule<any>,
    readonly type = 'objectShape' as const
  ) {
    super();
  }
}

export function objectShape<T extends ObjectRule<any>>(rule: T): ExpressionRule<Infer<T>> {
  return new __objectShape(rule);
}

// class __objectLike extends __Exp {
//   constructor(
//     readonly arg: ObjectRule<any>,
//     readonly type = 'objectLike' as const
//   ) {
//     super();
//   }
// }
//
// export function objectLike<T extends ObjectRule<any>>(rule: T): ExpressionRule<Infer<T>> {
//   const expr = new __objectLike(rule);
//
//   return expr;
// }

export function __isLiteral(value: any): value is LiteralTypes {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean' ||
    typeof value === 'symbol' ||
    value instanceof Date ||
    value instanceof RegExp
  );
}

function __isExpression(value: any): value is ExpressionRule<any> {
  return value instanceof __Exp;
}

export function __isObject<T>(schema: unknown): schema is ObjectRule<any> {
  return typeof schema === 'object' && !Array.isArray(schema);
}

/**
 * @internal
 */
export function __toExpression<T extends SchemaRule<any>>(schema: T): ExpressionRule<Infer<T>> {
  if (__isExpression(schema)) {
    return schema;
  }
  if (__isLiteral(schema)) {
    return literal(schema);
  }
  // if (__isArray(schema)) {
  //   return __arrayIs(schema) as ExpressionRule<Infer<T>>;
  // }
  if (__isObject(schema)) {
    return objectShape(schema);
  }

  throw new Error('hell knows');
}

const a = aString();
const b = aNumber();
const c = literal(true);
const mixed = allOf({ id: '5' }, { email: 'a@gmail.com' }, nullable({ age: 8 }));

expectType(a).is<ExpressionRule<string>>();
expectType(b).is<ExpressionRule<number>>();

expectType(mixed).is<ExpressionRule<{ id: string; email: string; age: number }>>();
expectType(mixed).is<ExpressionRule<{ id: '5' } & { email: 'a@gmail.com' } & { age: 8 }>>();

const d = oneOf('9', b, re(/^hell/), optional(aBoolean()), nullish(aBigInt()), nullable(aDate()));

const s = utils.inspect(d, { depth: null });

console.log(s);

console.log(utils.inspect(mixed, { depth: null }));

expectType(d).is<ExpressionRule<string | number | true>>();

type Rendered = Built<string>;

const ExpressionRenderer = new (class implements ExpressionVisitor<string> {
  literal<T>(value: T): Rendered {
    return `exact(${JSON.stringify(value)})`;
  }

  aBoolean(): Rendered {
    return 'aBoolean()';
  }

  aBigInt(): Built<string> {
    return 'aBigInt()';
  }

  aNumber(): Rendered {
    return 'aNumber()';
  }

  aString(): Rendered {
    return 'aString()';
  }

  aDate(): Rendered {
    return 'aDate()';
  }

  nullable(schema: SchemaRule<any>): Rendered {
    const expression = __toExpression(schema);

    return `nullable(${expression.accept(this)})`;
  }

  nullish(schema: SchemaRule<any>): Rendered {
    const expression = __toExpression(schema);

    return `nullish(${expression.accept(this)})`;
  }

  optional(schema: SchemaRule<any>): Rendered {
    const expression = __toExpression(schema);

    return `optional(${expression.accept(this)})`;
  }

  oneOf(schema: SchemaRule<any>[]): Rendered {
    const args = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return `oneOf(${args.join(', ')})`;
  }

  allOf(schema: SchemaRule<any>[]): Rendered {
    const args = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return `allOf(${args.join(', ')})`;
  }

  re(rule: RegExp): Rendered {
    return `re(${rule.toString()})`;
  }

  objectShape(schema: ObjectRule<any>): Rendered {
    const entries = Object.entries(schema).map(([key, value]) => {
      const expression = __toExpression(value);

      return `${key}: ${expression.accept(this)}`;
    });

    return `objectShape({ ${entries.join(', ')} })`;
  }
})();

type FnRendered = Built<Fn.FunctionRule<any>>;

const FunctionRenderer = new (class implements ExpressionVisitor<Fn.FunctionRule<any>> {
  literal<T extends LiteralTypes>(value: T): FnRendered {
    return Fn.literal(value);
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

  aString(): FnRendered {
    return Fn.aString();
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

  re(rule: RegExp): FnRendered {
    return Fn.re(rule);
  }

  objectShape(schema: ObjectRule<any>): FnRendered {
    const entries = Object.entries(schema).map(([key, value]) => {
      const expression = __toExpression(value);

      return [key, expression.accept(this)] as const;
    });

    const record = Object.fromEntries(entries);

    return Fn.objectShape(record);
  }
})();

function toString(expression: ExpressionRule<any>): string {
  return expression.accept(ExpressionRenderer);
}

console.log(toString(d));

console.log(toString(mixed));

function toFunction<T extends SchemaRule<any>>(expression: ExpressionRule<T>): Fn.FunctionRule<T> {
  return expression.accept(FunctionRenderer);
}

const y = toFunction(d);

const za = toFunction(literal(8));

expectType(za).is<Fn.FunctionRule<8>>();
console.log(y(true));
console.log(y(9));
console.log(y('9'));
console.log(y('hello'));
console.log(y('zzz'));
console.log(y(7));
console.log(y(3n));
console.log(y(new Date()));
console.log('nullable or nullish', y(null));
console.log('optional or nullish', y(undefined));

console.log(toFunction(mixed)({ id: '5', email: '', age: 8 }));
