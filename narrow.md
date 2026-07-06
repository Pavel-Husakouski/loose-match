# Plan: replace `const T` with a `Narrow` inference guard (Option A — recommended)

Goal: `tuple([{ id: 1 }])` infers `FunctionRule<[{ id: 1 }]>` — literal types kept, no
injected `readonly` — while explicitly readonly input keeps its modifiers:
`tuple([frozen])` with `const frozen = { id: 1 } as const` infers
`FunctionRule<[{ readonly id: 1 }]>`.

## Problem statement (confirmed 2026-07-06, tsc 5.9.3)

`tuple<const T extends SchemaRule<any>[]>` (`pckg.core/src/combinators.ts:137`) currently
infers `tuple([{ id: 1 }])` as `FunctionRule<[{ readonly id: 1 }]>`. Verified with
`StrictSameType` assertions: `[{ readonly id: 1 }]` matches, `[{ id: 1 }]` does not.

The cause is the `const` type parameter itself, not `Infer`. `const T` makes TypeScript
infer the argument as if written `as const` — one atomic feature: literal types are kept
**and** `readonly` is stamped on every property. `Infer`'s mapped types are homomorphic and
faithfully pass the modifiers through. Crucially, with `const T` the desired asymmetry is
*impossible*: `tuple([{ id: 1 }])` and `tuple([{ id: 1 } as const])` produce byte-identical
type arguments, so no downstream type can distinguish "readonly injected by const" from
"readonly the user declared."

Dropping `const` naively gives the opposite failure: `{ id: 1 }` widens to `{ id: number }`.

## Design: the `Narrow` trick

Block literal widening by the *shape of the inference target* (ts-toolbelt `F.Narrow` style)
instead of by const-context:

```ts
type Narrowable = string | number | bigint | boolean;

type NarrowRaw<A> =
  | (A extends [] ? [] : never)
  | (A extends Narrowable ? A : never)
  | { [K in keyof A]: A[K] extends Function ? A[K] : NarrowRaw<A[K]> };

export type Narrow<A> = A extends [] ? A : NarrowRaw<A>;

export function tuple<T>(items: Narrow<T> & SchemaRule<any>[]): FunctionRule<Infer<T>> { ... }
```

**Non-negotiable subtlety (found empirically):** `T` must be **unconstrained**; the
constraint moves into the parameter as an intersection (`Narrow<T> & SchemaRule<any>[]`).
Keeping `T extends SchemaRule<any>[]` silently re-widens literals back to `number`.

### Verified results (all pass, tsc 5.9.3)

| case | inferred |
|---|---|
| `tuple([{ id: 1 }])` | `[{ id: 1 }]` — literal kept, no readonly |
| `tuple([frozen])`, `frozen = { id: 1 } as const` | `[{ readonly id: 1 }]` |
| deep as-const nested in a fresh literal | inner `readonly` preserved, outer stays mutable |
| `tuple([aNumber(), aString(), { id: 1 }])` | `[number, string, { id: 1 }]` |
| nested object + nested tuple | `[{ user: { name: 'bob' }; tags: ['a', 1] }]` |
| primitive literals `['hello', 2, true]` | `['hello', 2, true]` |
| `[new Date(), /abc/]` | `[Date, RegExp]` — not mangled by the mapped branch |
| custom predicate function | parameter type inferred (`number`) |
| non-array input (`tuple(5)`) | still rejected |

### Costs

- Hover/signature is noisier: `items: Narrow<T> & SchemaRule<any>[]` instead of `items: T`.
- Error messages for invalid schemas point at the intersection type rather than a
  constraint violation — slightly less direct, same rejections.
- `T` being unconstrained allows nonsense explicit instantiation (`tuple<number>(...)`),
  which then fails at the parameter instead of the type argument. Acceptable: nobody
  instantiates these explicitly.

## Scope

The same `const T` readonly injection exists on every object schema passed to `arrayOf`,
`allOf`, `nullish`, `optional`, `nullable`, `oneOf`, `anyOf`, `strictEqual`
(`pckg.core/src/combinators.ts:153-416`). Meanwhile `tuple` in
`pckg.core/src/expressions.ts:442` has *no* `const` and widens to `[{ id: number }]` — a
third, inconsistent behavior. This plan unifies all of them on the `Narrow` semantics.

## Phase 0 — introduce `Narrow`

- [ ] Add `Narrowable`, `NarrowRaw`, `Narrow` to `pckg.core/src/types.ts`; export `Narrow`
      (mark `NarrowRaw` `@internal`).
- [ ] Re-export `Narrow` from `pckg.core/src/expressions.ts` alongside the other shared
      type aliases (`ObjectRule`, `SchemaRule`, …).

## Phase 1 — `tuple` in `combinators.ts`

- [ ] `export function tuple<T>(items: Narrow<T> & SchemaRule<any>[]): FunctionRule<Infer<T>>`
      — drop `const`, keep the body (`__tupleExact(items)` accepts the intersection as
      `SchemaRule<any>[]`; verified the implementation side compiles).
- [ ] Compile-time assertions in `pckg.core/test/tuple.spec.ts` using the existing
      `expect().isOfType<>().equals<true>()` helper (`test/@type-expect.ts`):
      inline literal → no readonly; as-const input → readonly preserved; mixed function
      rules; nested schema.

## Phase 2 — sweep the remaining `const` combinators (same file)

For each of `arrayOf`, `allOf`, `nullish`, `optional`, `nullable`, `oneOf`, `anyOf`:
replace `<const T extends X>` with `<T>` + parameter intersection `Narrow<T> & X`
(for rest-parameter rules: `...items: Narrow<T> & AtLeastTwoItems<SchemaRule<any>>`).

- [ ] `arrayOf`, `nullable`, `nullish`, `optional` (single-schema parameter).
- [ ] `oneOf`, `anyOf`, `allOf` (rest parameter — verify the intersection distributes over
      the tuple correctly before committing; add a repro first).
- [ ] `strictEqual` — decide separately: it compares by reference, so `const` readonly here
      only affects the *rendered* type, and `Narrow` on a bare `T` (not a schema) is the
      plain ts-toolbelt use. Apply the same treatment for consistency.
- [ ] Type assertions per combinator in the corresponding spec files.

## Phase 3 — parity in `expressions.ts`

- [ ] Apply the same signatures to the expression factories (`tuple`, `arrayOf`, `oneOf`,
      `anyOf`, `allOf`, `nullable`, `nullish`, `optional`, `strictEqual`, `literal`) so both
      APIs infer identically — this also *upgrades* expression `tuple` from the widened
      `[{ id: number }]` to literal-preserving.
- [ ] Extend `test/@declaration.expressions.spec.ts` with the same assertion trio.

## Phase 4 — verification

- [ ] `npx tsc --noEmit` over the package tsconfig (it includes `test/**/*.ts`).
- [ ] Run the test suite (`pckg.core` bootstrap + dependent `pckg.test.*` packages).
- [ ] Grep `lib/*.d.ts` output for `readonly` regressions in the public signatures.

## Rejected alternative

Stripping `readonly` inside `Infer` with `-readonly` mapped modifiers while keeping
`const T` — see `sledgehammer.md`. Fixes the inline-literal case but destroys declared
readonly (`tuple([frozen])` would infer mutable `[{ id: 1 }]`), violating the second
requirement.