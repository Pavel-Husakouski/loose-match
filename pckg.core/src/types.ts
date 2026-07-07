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

/**
 * A predicate rule
 */
export type PredicateRule<T> = (a: T) => boolean | void | never;

/**
 * A function rule
 */
export type FunctionRule<T> = (a: T) => ValidationResult<T>;

/**
 * The set of types that can be compared by value
 */
export type LiteralTypes = boolean | string | number | bigint | symbol | null | undefined | Date | RegExp;

/**
 * A primitive rule
 */
export type PrimitiveRule<T> = T extends LiteralTypes ? T : never;

/**
 * An object schema
 */
export type ObjectRule<T> = { [key in keyof T]: SchemaRule<T[key]> };

/**
 * An array rule
 */
export type ArrayRule<T> = SchemaRule<T>[];

/**
 * A schema rule
 */
export type SchemaRule<T> = PrimitiveRule<T> | PredicateRule<T> | FunctionRule<T> | ObjectRule<T>;

/**
 * Infer the type of a schema rule
 */
export type Infer<T> = T extends LiteralTypes
  ? T
  : T extends PredicateRule<infer P>
    ? P
    : T extends FunctionRule<infer P>
      ? P
      : T extends readonly any[]
        ? { [K in keyof T]: Infer<T[K]> }
        : T extends ObjectRule<infer P>
          ? { [K in keyof P]: Infer<P[K]> }
          : never;
/**
 * A intersection of schema rule types
 */
export type InferIntersection<T> = T extends [infer First, ...infer Rest]
  ? First extends SchemaRule<infer U>
    ? Rest extends any[]
      ? Infer<U> & InferIntersection<Rest>
      : Infer<U>
    : never
  : unknown;

/**
 * Infer the item type of an array
 */
export type ItemsOf<T> = T extends (infer P)[] ? P : never;

export type AtLeastTwoItems<T extends any> = [T, T, ...T[]];

/**
 * The set of types eligible for literal narrowing (see {@link Narrow})
 */
type Narrowable = string | number | bigint | boolean;

/**
 * The recursive worker behind {@link Narrow}; not intended for direct use.
 * Note: referenced by the public `Narrow` type, so it must survive `stripInternal`.
 */
export type NarrowRaw<A> =
  | (A extends [] ? [] : never)
  | (A extends Narrowable ? A : never)
  | { [K in keyof A]: A[K] extends Function ? A[K] : NarrowRaw<A[K]> };

/**
 * Blocks literal widening by the shape of the inference target, without stamping
 * `readonly` the way a `const` type parameter would.
 */
export type Narrow<A> = A extends Function ? A : A extends [] ? A : NarrowRaw<A>;

/**
 * Distributes {@link Narrow} over the elements of a variadic argument tuple.
 * The type parameter must stay unconstrained — any constraint re-widens literals
 * inside object and array arguments.
 */
export type NarrowEach<T> = { [K in keyof T]: Narrow<T[K]> };

/**
 * Anything acceptable as a schema argument. Used as the constraint of the auxiliary
 * type parameter in variadic combinators: a constraint containing the {@link Narrowable}
 * primitives keeps bare literal arguments (`anyOf('1', '2')`) from widening, which the
 * unconstrained {@link NarrowEach} parameter alone cannot do.
 */
export type SchemaInput = Narrowable | object | null | undefined;

/**
 * A per-property {@link Narrow} with a plain fallback. Properties that survive the
 * Narrow round-trip get literal inference; exotic values that cannot round-trip the
 * mapped type (e.g. Error instances, whose `cause?: unknown` reconstructs as `{}`)
 * still type-check via the bare property type, at the cost of widened inference for
 * the whole argument.
 */
export type NarrowProps<T> = { [K in keyof T]: Narrow<T[K]> | T[K] };

/**
 * @internal
 */
export function __invalid(msg: string): ValidationResult {
  return [false, msg];
}

/**
 * @internal
 */
export type __TypeOf =
  | '[object String]'
  | '[object Number]'
  | '[object Boolean]'
  | '[object Null]'
  | '[object Undefined]'
  | '[object Date]'
  | '[object RegExp]'
  | '[object BigInt]'
  | '[object Symbol]'
  | '[object Object]'
  | '[object Error]'
  | '[object Function]';

/**
 * @internal
 */
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

/**
 * @internal
 */
export function __isArray<T>(schema: unknown): schema is ArrayRule<any> {
  return Array.isArray(schema);
}

/**
 * @internal
 */
export function __typeOf(v: any): __TypeOf {
  return Object.prototype.toString.call(v) as __TypeOf;
}

/**
 * @internal
 */
export function __isObject<T>(value: unknown): value is ObjectRule<any> {
  return __typeOf(value) === '[object Object]';
}

/**
 * @internal
 */
export function __isError<T>(schema: unknown): schema is ObjectRule<Error> {
  return __typeOf(schema) === '[object Error]';
}

/**
 * @internal
 */
export const __valid = [true] as const;

/**
 * @internal
 */
export function __stringify(value: any): string {
  const type = __typeOf(value);
  const render = __typeRender[type];

  if (render) {
    return render(value);
  }

  return type;
}

/**
 * @internal
 */
export const __typeRender: Record<__TypeOf, (value: any) => string> = {
  '[object String]': (value: any) => `String ${value}`,
  '[object Number]': (value: any) => `Number ${value}`,
  '[object Boolean]': (value: any) => `Boolean ${value}`,
  '[object Null]': () => `null`,
  '[object Undefined]': () => `undefined`,
  '[object Date]': (value: any) => `Date ${value.toISOString()}`,
  '[object RegExp]': (value: any) => `RegExp ${value}`,
  '[object BigInt]': (value: any) => `BigInt ${value}`,
  '[object Symbol]': (value: any) => `Symbol ${value.toString()}`,
  '[object Object]': () => `[object Object]`,
  '[object Error]': (value: any) => `${value.name} ${value.message}`,
  '[object Function]': (value: Function) => `function ${value.name || '<anonymous>'}`,
};
