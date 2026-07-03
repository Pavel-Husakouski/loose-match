/**
 * Compile-time type assertion utilities.
 *
 * `SameType<B, A>` resolves to `true` when A and B are mutually assignable
 * (a TypeScript proxy for structural equality), and `false` otherwise.
 *
 * Usage:
 *
 *   // assert the inferred type of a runtime value
 *   expect(pattern).isOfType<FunctionRule<string>>().equals<true>();
 *
 *   // assert a purely type-level expression
 *   expect<Infer<typeof pattern>>().isOfType<string>().equals<true>();
 *
 *   // assert two types are NOT the same
 *   expect<typeof x>().isOfType<string>().equals<false>();
 */

export type SameType<B, A> = A extends B ? (B extends A ? true : false) : false;

export type StrictSameType<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

/**
 * Assert that an explicitly supplied type X is assignable to the inferred type A:
 *
 *   expectType(pattern).is<ExpressionRule<string>>();
 */
export function expectType<A>(_arg?: A): { is<X extends A>(): void } {
  return {
    is<X extends A>() {
      // compile-time only — no runtime behaviour
    },
  };
}

export function expect<A>(_arg?: A): {
  isOfType<B>(): { equals<Y extends SameType<A, B>>(): void };
} {
  return {
    isOfType<B>(): { equals<Y extends SameType<A, B>>(): void } {
      return {
        equals<Y extends SameType<A, B>>() {
          // compile-time only — no runtime behaviour
        },
      };
    },
  };
}
