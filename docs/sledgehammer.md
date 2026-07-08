# Plan: keep `const T`, strip `readonly` inside `Infer` (Option B — the sledgehammer)

**Status: Rejected** — superseded by `narrow.md`

Goal: `tuple([{ id: 1 }])` infers `FunctionRule<[{ id: 1 }]>` instead of
`FunctionRule<[{ readonly id: 1 }]>`, with the smallest possible diff — only the `Infer`
type changes, every combinator signature stays as it is today.

## Problem statement (confirmed 2026-07-06, tsc 5.9.3)

See `narrow.md` for the full analysis. Short version: `const T` on
`tuple<const T extends SchemaRule<any>[]>` (`pckg.core/src/combinators.ts:137`) makes
TypeScript infer arguments as if written `as const`, which keeps literal types **and**
stamps `readonly` on every property. `Infer` passes the modifiers through because its
mapped types are homomorphic.

## Design: `-readonly` mapped modifiers in `Infer`

Add explicit `-readonly` to the two mapped types in `Infer`
(`pckg.core/src/types.ts:52-62`), and mirror in the `Infer` of
`pckg.core/src/expressions.ts:100-106`:

```ts
export type Infer<T> = T extends LiteralTypes
  ? T
  : T extends PredicateRule<infer P>
    ? P
    : T extends FunctionRule<infer P>
      ? P
      : T extends readonly any[]
        ? { -readonly [K in keyof T]: Infer<T[K]> }
        : T extends ObjectRule<infer P>
          ? { -readonly [K in keyof P]: Infer<P[K]> }
          : never;
```

Verified (tsc 5.9.3): `tuple([{ id: 1 }])` then infers `[{ id: 1 }]`.

## The trade-off that names this file

`readonly` is stripped **everywhere**, including where the user declared it:

```ts
const frozen = { id: 1 } as const;   // { readonly id: 1 }
tuple([frozen]);                     // infers [{ id: 1 }] — readonly LOST (verified)
```

There is no way to be selective: with `const T`, the type argument for a fresh inline
literal and for an `as const` variable are byte-identical, so `Infer` cannot tell the
injected `readonly` from the declared one. It either passes all of them through (today)
or strips all of them (this plan).

Choose this option only if declared-readonly preservation does not matter for the
library's users. Otherwise use `narrow.md`.

## Phase 0 — change `Infer`

- [ ] `pckg.core/src/types.ts`: add `-readonly` to the array clause and the `ObjectRule`
      clause of `Infer` (the modifier also normalizes readonly tuples inferred through
      `const` rest parameters of `oneOf`/`anyOf`/`allOf`).
- [ ] `pckg.core/src/expressions.ts`: same edit in its private `Infer`
      (`ObjectRule` clause; add an array clause guard if the readonly-tuple case surfaces
      there too).
- [ ] Check `InferIntersection` output for both files — it composes `Infer`, so it inherits
      the fix; assert rather than assume.

## Phase 1 — tests

- [ ] Compile-time assertions in `pckg.core/test/tuple.spec.ts` via
      `expect().isOfType<>().equals<true>()` (`test/@type-expect.ts`):
      `tuple([{ id: 1 }])` → `FunctionRule<[{ id: 1 }]>`.
- [ ] Document the intentional loss with an explicit assertion:
      `tuple([frozen])` → `FunctionRule<[{ id: 1 }]>` (equals `true` — readonly stripped
      by design), so the behavior change is pinned and visible in the spec.
- [ ] Spot-check the other `const` combinators (`arrayOf`, `oneOf`, `anyOf`, `allOf`,
      `nullable`, `nullish`, `optional`) — they share `Infer`, so they are fixed by the
      same edit; one assertion each.

## Phase 2 — verification

- [ ] `npx tsc --noEmit` over the package tsconfig (includes `test/**/*.ts`).
- [ ] Run the test suite (`pckg.core` bootstrap + dependent `pckg.test.*` packages).
- [ ] Grep `lib/*.d.ts` for leftover `readonly` in inferred public signatures.

## Out of scope (unchanged by this option)

- `tuple` in `pckg.core/src/expressions.ts:442` has no `const`, so it keeps widening
  inline literals to `[{ id: number }]` — this option does not unify the two APIs.
- `strictEqual<const T>` carries the same readonly injection for object values; harmless
  for its reference-equality semantics, untouched here.