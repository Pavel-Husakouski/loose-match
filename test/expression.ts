import * as utils from 'node:util';
import * as Fn from '../src';

export function expectType<A>(arg?: A): { is<X extends A>(): void } {
  return {
    is<X extends A>() {
      // do nothing
    },
  };
}

/**
 * A valid result
 */
export type Valid<T> = readonly [true];
/**
 * An invalid result
 */
export type Invalid<T> = readonly [false, string];
/**
 * A validation result
 */
export type ValidationResult<T = any> = Valid<T> | Invalid<T>;

// /**
//  * A predicate rule
//  */
// export type PredicateRule<T> = (a: T) => boolean | void | never;

export interface ExpressionVisitor<X> {
  primitive(value: Primitives): Built<X>;

  aNumber(): Built<X>;

  aString(): Built<X>;

  oneOf(schemas: SchemaRule<any>[]): Built<X>;

  allOf(schemas: SchemaRule<any>[]): Built<X>;

  objectWith(schema: RecordRule<any>): Built<X>;

  re(rule: RegExp): Built<X>;
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
export type Primitives = RegExp | boolean | string | number | bigint | symbol | null | undefined | Date;

/**
 * A primitive rule
 */
export type PrimitiveRule<T> = T extends Primitives ? T : never;

/**
 * A record rule or and object schema
 */
export type RecordRule<T> = { [key in keyof T]: SchemaRule<T[key]> };

/**
 * An array rule
 */
export type ArrayRule<T> = SchemaRule<T>[];

/**
 * A schema rule
 */
export type SchemaRule<T> = PrimitiveRule<T> | /* PredicateRule<T> |*/ ExpressionRule<T> | RecordRule<T>;

/**
 * Infer the type of a schema rule
 */
export type Infer<T> = T extends Primitives
  ? T
  : T extends PrimitiveRule<infer P>
    ? P
    : /*T extends PredicateRule<infer P>
      ? P
      :*/ T extends ExpressionRule<infer P>
      ? P
      : T extends RecordRule<infer P>
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

class __primitive extends __Exp {
  constructor(
    readonly arg: Primitives,
    readonly type = 'primitive' as const
  ) {
    super();
  }
}

export function primitive<T extends Primitives>(arg: T): ExpressionRule<Infer<T>> {
  return new __primitive(arg);
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

class __objectWith extends __Exp {
  constructor(
    readonly arg: RecordRule<any>,
    readonly type = 'objectWith' as const
  ) {
    super();
  }
}

export function objectWith<T extends RecordRule<any>>(rule: T): ExpressionRule<Infer<T>> {
  return new __objectWith(rule);
}

export function __isPrimitive(value: any): value is Primitives {
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

export function __isRecord<T>(schema: unknown): schema is RecordRule<any> {
  return typeof schema === 'object' && !Array.isArray(schema);
}

/**
 * @internal
 */
export function __toExpression<T extends SchemaRule<any>>(schema: T): ExpressionRule<Infer<T>> {
  if (__isExpression(schema)) {
    return schema;
  }
  if (__isPrimitive(schema)) {
    return primitive(schema);
  }
  // if (__isArray(schema)) {
  //   return __arrayIs(schema) as ExpressionRule<Infer<T>>;
  // }
  if (__isRecord(schema)) {
    return objectWith(schema);
  }

  throw new Error('hell knows');
}

const a = aString();
const b = aNumber();
const c = primitive(true);
const mixed = allOf({ id: '5' }, { email: 'a@gmail.com' }, { age: 8 });

expectType(a).is<ExpressionRule<string>>();
expectType(b).is<ExpressionRule<number>>();
expectType(c).is<ExpressionRule<true>>();

expectType(mixed).is<ExpressionRule<{ id: string; email: string; age: number }>>();
expectType(mixed).is<ExpressionRule<{ id: '5' } & { email: 'a@gmail.com' } & { age: 8 }>>();

const d = oneOf('9', b, c, re(/^hell/));

const s = utils.inspect(d, { depth: null });

console.log(s);

console.log(utils.inspect(mixed, { depth: null }));

expectType(d).is<ExpressionRule<string | number | true>>();

type Rendered = Built<string>;

const ExpressionRenderer = new (class implements ExpressionVisitor<string> {
  primitive<T>(value: T): Rendered {
    return `exact(${JSON.stringify(value)})`;
  }

  aNumber(): Rendered {
    return 'aNumber()';
  }

  aString(): Rendered {
    return 'aString()';
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

  objectWith(schema: RecordRule<any>): Rendered {
    const entries = Object.entries(schema).map(([key, value]) => {
      const expression = __toExpression(value);

      return `${key}: ${expression.accept(this)}`;
    });

    return `record({ ${entries.join(', ')} })`;
  }
})();

type FnRendered = Built<Fn.FunctionRule<any>>;

const FunctionRenderer = new (class implements ExpressionVisitor<Fn.FunctionRule<any>> {
  primitive<T>(value: T): FnRendered {
    return Fn.primitive(value);
  }

  aNumber(): FnRendered {
    return Fn.aNumber();
  }

  aString(): FnRendered {
    return Fn.aString();
  }

  oneOf(schema: SchemaRule<any>[]): FnRendered {
    const items = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return Fn.oneOf(...items);
  }

  allOf(schema: SchemaRule<any>[]): FnRendered {
    const items = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return Fn.allOf(...items);
  }

  re(rule: RegExp): FnRendered {
    return Fn.re(rule);
  }

  objectWith(schema: RecordRule<any>): FnRendered {
    const entries = Object.entries(schema).map(([key, value]) => {
      const expression = __toExpression(value);

      return [key, expression.accept(this)] as const;
    });

    const record = Object.fromEntries(entries);

    return Fn.objectWith(record);
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

const za = toFunction(primitive(8));

expectType(za).is<Fn.FunctionRule<8>>();

console.log(y(true));
console.log(y(9));
console.log(y('9'));
console.log(y('hello'));
console.log(y('zzz'));
console.log(y(7));

console.log(toFunction(mixed)({ id: '5', email: '', age: 8 }));
