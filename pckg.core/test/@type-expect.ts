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
