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

export function tuple<T>(items: Narrow<T> & SchemaRule<any>[]): FunctionRule<Infer<T>> { ...
}
```

**Non-negotiable subtlety (found empirically):** `T` must be **unconstrained**; the
constraint moves into the parameter as an intersection (`Narrow<T> & SchemaRule<any>[]`).
Keeping `T extends SchemaRule<any>[]` silently re-widens literals back to `number`.

**Trap (found 2026-07-07):** the intersection carrier must not be `any`. `SchemaRule<any>`
*is* `any` (`PrimitiveRule<any>` = `any extends LiteralTypes ? any : never` → `any`), so
`Narrow<T> & SchemaRule<any>` collapses to `any` and kills inference entirely — T gets no
candidate, becomes `unknown`, and `Infer<unknown>` = `never` (`arrayOf(literal(7))` inferred
`FunctionRule<never[]>`). For single-schema combinators use **bare `Narrow<T>`** — the
constraint added nothing anyway since `SchemaRule<any>` accepts everything. The array form
`Narrow<T> & SchemaRule<any>[]` is fine: `any[]` ≠ `any`.

Also note the top-level `A extends Function ? A : ...` branch in `Narrow` (this repo's
addition over ts-toolbelt) is required for bare function-rule arguments like `literal(7)`.
And beware probe methodology: `const x: 'reveal' = fn(...)` poisons inference via the
contextual return type — always split into `const x = fn(...); const y: 'reveal' = x;`.

### Verified results (all pass, tsc 5.9.3)

| case                                             | inferred                                            |
|--------------------------------------------------|-----------------------------------------------------|
| `tuple([{ id: 1 }])`                             | `[{ id: 1 }]` — literal kept, no readonly           |
| `tuple([frozen])`, `frozen = { id: 1 } as const` | `[{ readonly id: 1 }]`                              |
| deep as-const nested in a fresh literal          | inner `readonly` preserved, outer stays mutable     |
| `tuple([aNumber(), aString(), { id: 1 }])`       | `[number, string, { id: 1 }]`                       |
| nested object + nested tuple                     | `[{ user: { name: 'bob' }; tags: ['a', 1] }]`       |
| primitive literals `['hello', 2, true]`          | `['hello', 2, true]`                                |
| `[new Date(), /abc/]`                            | `[Date, RegExp]` — not mangled by the mapped branch |
| custom predicate function                        | parameter type inferred (`number`)                  |
| non-array input (`tuple(5)`)                     | still rejected                                      |

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

- [x] Add `Narrowable`, `NarrowRaw`, `Narrow` to `pckg.core/src/types.ts`; export `Narrow`
  (mark `NarrowRaw` `@internal`).
- [x] Re-export `Narrow` from `pckg.core/src/expressions.ts` alongside the other shared
  type aliases (`ObjectRule`, `SchemaRule`, …).

## Phase 1 — `tuple` in `combinators.ts`

- [x] `export function tuple<T>(items: Narrow<T> & SchemaRule<any>[]): FunctionRule<Infer<T>>`
  — drop `const`, keep the body (`__tupleExact(items)` accepts the intersection as
  `SchemaRule<any>[]`; verified the implementation side compiles).
- [x] `array` given the same signature (was widening; the pre-existing
  `array([1, 2, 3, 5, 's'])` literal expectation now passes; the stale widened
  expectation at `@declaration.spec.ts` "Array schema: array const" updated).

## Phase 2 — sweep the remaining `const` combinators (same file)

For each of `arrayOf`, `allOf`, `nullish`, `optional`, `nullable`, `oneOf`, `anyOf`:
replace `<const T extends X>` with `<T>` + parameter intersection `Narrow<T> & X`
(for rest-parameter rules: `...items: Narrow<T> & AtLeastTwoItems<SchemaRule<any>>`).

- [x] `arrayOf`, `nullable`, `nullish`, `optional` (single-schema parameter) — bare
  `Narrow<T>`, **no** `& SchemaRule<any>` (see trap above). Verified: `arrayOf(literal(7))`
  → `FunctionRule<7[]>`, `{ id: 1 }` keeps literals, `as const` keeps readonly,
  `@declaration.spec.ts` fully green incl. the Hell union.
- [x] `oneOf`, `anyOf`, `allOf` — done, but **not** via `Narrow<T> & rest-tuple` (that
  widens everything: per-element `& any` poisons, and even `& [unknown, ...]` defeats
  the reverse-mapped inversion). The working shape (found empirically 2026-07-07) needs
  **two** type parameters:

      ```ts
      oneOf<T, C extends AtLeastTwoItems<SchemaInput>>(...items: NarrowEach<T> & C)
      ```

      where `NarrowEach<T> = { [K in keyof T]: Narrow<T[K]> }` (T unconstrained — any
      constraint on T re-widens object/array elements) and
      `SchemaInput = Narrowable | object | null | undefined`. The roles split: `NarrowEach`
      reverse-maps structure (objects/tuples keep literals, no readonly, as-const
      preserved); `C`'s Narrowable-bearing constraint is what keeps **bare** primitive
      literal args (`anyOf('1', '2', '3')`) from widening — the checker only preserves an
      argument-level literal when its contextual type is a type variable whose constraint
      contains that primitive kind. Neither parameter alone does both. `C` also carries the
      min-two-items arity. `InferIntersection` relaxed to unconstrained `T`.
- [x] `strictEqual<T>(value: Narrow<T> | T): FunctionRule<T>` — the `| T` fallback is
  required: bare `Narrow<T>` *rejects* exotic objects that don't survive the mapped
  round-trip (`strictEqual(globalThis)` errored); the union keeps narrowing for
  literals/objects while letting anything else match plain `T`.
- [x] `objectLike<T>(rule: Narrow<T> & object)` — was `T extends ObjectRule<any>`, which
  widened (`{ length: 5 }` → `{ length: number }`) while the runtime builds
  `literal(5)` and matches exactly 5. `& object` keeps rejecting primitive arguments
  without poisoning inference. `NarrowRaw` must NOT be `@internal`: `stripInternal`
  would drop it from `lib/types.d.ts` while public `Narrow` references it, breaking
  the emitted declarations.
- [x] `objectShape<T>(rule: NarrowProps<T> & object)` — same for `objectLike`, where
  `NarrowProps<T> = { [K in keyof T]: Narrow<T[K]> | T[K] }`. Plain `Narrow<T> & object`
  broke `error.spec`: schemas holding `Error` *values* fail the Narrow round-trip
  (`cause?: unknown` reconstructs as `{}` — `keyof unknown` is `never`, so the mapped
  branch collapses it). Attempted global fixes all poison inference: a top-level
  `unknown extends A ? A : never` branch, a per-key `unknown extends A[K]` guard inside
  the mapped type, and `A extends {} ? never : A` each re-widen everything (naked-`A`
  inference sites / broken reverse-mapped invertibility). The per-property `| T[K]`
  fallback keeps literal inference for well-behaved props and lets exotic values
  type-check; an Error-bearing schema degrades to `FunctionRule<never>` (compiles; at
  HEAD it was already degenerate — `Infer<Error>` = `never` via the same
  `cause: unknown` in `ObjectRule`). `null`/`undefined` properties also pass through
  the `| T[K]` fallback (`NarrowRaw` itself maps them to `{}`; adding them to its leaf
  branch was verified safe if ever needed). The allOf expectations flipped:
  `objectShape({ id: '1' })` now infers `{ id: '1' }` and *equals* the plain-object
  schema (`allOf: objectShape vs plain object` asserts `true`).
- [x] Type assertions updated in `@declaration.spec.ts`: readonly expectations flipped to
  mutable for non-as-const args (Hell union, oneOf/anyOf object literals); as-const
  cases still assert readonly. All green; 206 runtime tests pass; emitted `.d.ts` clean.

## Phase 3 — parity in `expressions.ts`

- [x] Apply the same signatures to the expression factories (`tuple`, `array`, `arrayOf`,
  `oneOf`, `anyOf`, `allOf`, `nullable`, `nullish`, `optional`, `strictEqual`,
  `objectShape`, `objectLike`) so both APIs infer identically — this also *upgrades*
  expression `tuple` from the widened `[{ id: number }]` to literal-preserving.
  `oneOf`/`anyOf`/`allOf` use `NarrowProps<T> & C` rather than the plan's `NarrowEach`:
  plain `NarrowEach` rejects `ExpressionRule` arguments whose phantom `[__infer]` type
  can't round-trip the mapped type (e.g. `ExpressionRule<Error>` — the same
  `cause?: unknown` failure as `objectShape`); the per-element `| T[K]` fallback admits
  them. The expression-side `InferIntersection` relaxed to unconstrained `T`, matching
  `types.ts`. `literal` deliberately left as `<const T extends LiteralTypes>`: its domain
  has no object shapes to stamp `readonly` on, so `const` is harmless and identical to
  the function-API `literal`. Fallout absorbed in `expressions.spec.ts`: stale widened
  expectations tightened (`oneOf('9', aNumber())` → `'9' | number`, `allOf` fixture →
  `{ id: '5' } & { email: 'a@gmail.com' } & { age: 8 }`), and the runtime-rejection call
  feeding a mismatching literal now needs `@ts-expect-error`.
- [x] Extend `test/@declaration.expressions.spec.ts` with the same assertion trio.

## Phase 4 — verification

- [x] `npx tsc --noEmit` over the package tsconfig (it includes `test/**/*.ts`) — clean,
  including `@infer-nested-array.repro.ts` (needs a built `lib/`; the base tsconfig's new
  `noEmit: true` had silently broken `npm run build` — fixed by overriding
  `noEmit: false` in `tsconfig.build.json`).
- [x] Run the test suite — 206 passing in `pckg.core`, plus `pckg.test.loose`,
  `pckg.test.strict`, `pckg.test.esm` all green.
- [x] Grep `lib/*.d.ts` output for `readonly` regressions — none; the only `readonly`
  occurrences are the `Valid`/`Invalid` result tuples, `Infer`'s homomorphic
  `readonly any[]` branch, the `[__infer]` phantom, and doc comments. No `const T`
  remains in the emitted signatures except `literal` (intentional).

## Rejected alternative

Stripping `readonly` inside `Infer` with `-readonly` mapped modifiers while keeping
`const T` — see `sledgehammer.md`. Fixes the inline-literal case but destroys declared
readonly (`tuple([frozen])` would infer mutable `[{ id: 1 }]`), violating the second
requirement.