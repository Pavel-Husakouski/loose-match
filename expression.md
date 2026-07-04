# Plan: bring `test/expression.ts` to parity with the main package API

Goal: the expression (visitor) API in `pckg.core/test/expression.ts` should cover every public
rule of `pckg.core/src` with the same signatures, the same type inference, and the same runtime
guards, so that `toFunction(expr)` is behaviorally indistinguishable from calling the `Fn.*`
factory directly.

Reference inventory of the gap: see the comparison from 2026-07-03 — 7 missing rules
(`anything`, `anyOf`, `objectLike`, `instanceOf`, `isPrototypedBy`, `strictEqual`, `predicate`),
dropped option parameters (`aString`, `arrayOf`), lost arity constraints (`oneOf`/`allOf`),
and diverged private copies of `InferIntersection`, `__isObject`, and the schema converter.

## Design note: rules bound to runtime values

Expressions support rules whose arguments are bound to runtime values — an object reference in
`strictEqual`, a constructor function in `instanceOf`/`isPrototypedBy`, a predicate function in
`predicate`, a `RegExp` instance in `re`. The node stores such values as-is, without copying or
serializing them; identity is part of the rule's meaning.

It is the **visitor's responsibility** to handle these arguments correctly for its own output
domain. `FunctionRenderer` passes them through by reference, so the produced rule is exactly as
strict as the main-API counterpart. A textual visitor like `ExpressionRenderer` cannot round-trip
them and renders a best-effort, lossy representation (e.g. `strictEqual({"id":1})`,
`instanceOf(TypeError)`) — that is acceptable and by design; a rendered string is documentation,
not a serialization format.

---

## Phase 0 — prerequisite: multi-argument visitor nodes

Several main-API rules take more than one argument (`instanceOf(ctor, extraRule?)`,
`arrayOf(schema, options?)`, `aString(options?)`, `predicate(fn, message?)`). The current node
protocol carries a single `arg` and `accept` dispatches `visitor[this.type](this.arg)`
(`expression.ts:138-140`), so it cannot express them.

- [x] Change `__Exp` to carry `args: any[]` instead of `arg: any`; `accept` becomes
      `visitor[this.type](...this.args)`.
- [x] Update every existing node class (`__literal`, `__aBoolean`, …) to the new shape; nullary
      rules carry `[]` instead of `null`.
- [x] Visitor method signatures then mirror the main factory signatures 1:1
      (e.g. `arrayOf(schema: SchemaRule<any>, options?: { length: number }): Built<X>`) —
      signatures unchanged in this step (all current rules are 0/1-arg); options arrive in
      Phase 2. `toString`/`toFunction` exported early (pulled forward from Phase 5) to make
      the smoke spec possible.

Rationale for spread-args over packing options into an object: the `ExpressionVisitor` interface
becomes a literal transcription of the public API surface, which is exactly what we want to keep
in sync.

## Phase 1 — add the seven missing rules

For each: visitor method on `ExpressionVisitor`, node class, exported factory, and an
implementation in **both** renderers (`ExpressionRenderer`, `FunctionRenderer`) — the interface
change makes the compiler enforce the renderer updates.

- [x] `anything(): ExpressionRule<any>` — trivially nullary.
- [x] `anyOf(...items)` — un-comment `expression.ts:38`; clone the `oneOf` node.
- [x] `objectLike(rule)` — finish the stub at `expression.ts:312-325`; make the class generic
      (`__objectLike<T> extends __Exp<T>`) like the others.
- [x] `strictEqual(value)` — new node; note it is *not* a `literal`: it carries an arbitrary
      value compared by reference, so its arg type is `unknown` and the factory uses a
      `const T` type parameter like `src/combinators.ts:411`.
- [x] `instanceOf(ctor, extraRule?)` — two-arg node (needs Phase 0). Keep the overloaded
      signature from `src/combinators.ts:353-362`.
- [x] `isPrototypedBy(ctor)`.
- [x] `predicate(fn, message?)` — two-arg node. **Decision (b), taken 2026-07-03:** bare
      functions stay *out* of the expression `SchemaRule` union AND are *not* auto-wrapped by
      `__toExpression`; an explicit `predicate(...)` call is required. Rationale: main's
      `__toFunction` passes bare functions through as-is (assuming a tuple-returning
      `FunctionRule`), so a bare truthiness predicate crashes at destructuring, and wrapping
      them as predicate nodes instead would silently accept a `FunctionRule`'s truthy
      `[false, msg]` tuple. Requiring the explicit wrap is a deliberate improvement over main,
      not drift.

Out of scope, on purpose: `match`, `validate`, `AssertionError` — they *consume* rules rather
than being rules; the expression layer's equivalent is `toFunction(expr)` feeding the main
implementations. Document this in the file header instead of porting them.

## Phase 2 — restore parameters, arity, and runtime guards

- [x] `aString(options?: { length: number })` — carry options through the node
      (main: `src/literals.ts:18`).
- [x] `arrayOf(schema, options?: { length: number })` (main: `src/combinators.ts:153`).
- [x] `oneOf`/`allOf`/`anyOf`: type the rest parameter as `AtLeastTwoItems<SchemaRule<any>>`
      (import from `../src`) and add the runtime `__assert(items.length >= 2, …)`, matching
      `src/combinators.ts:182,262,300`.
- [x] Add `const` to `literal`'s type parameter (`<const T extends LiteralTypes>`) to match
      `src/literals.ts:109`.
- [x] Port the remaining `__assert` guards: `objectShape`/`objectLike` non-null rule,
      `nullable`/`nullish`/`optional` non-null schema, `re` requires a `RegExp`,
      `predicate` requires a function, `instanceOf`/`isPrototypedBy` require a constructor.
      Import `__assert` from `../src` rather than duplicating it. (Used via the existing
      `Fn.*` namespace import: `Fn.__assert`, `Fn.__typeOf`.)

## Phase 3 — unify the type layer

- [x] Delete the local `LiteralRule` alias; import and use `PrimitiveRule` (same definition,
      `src/types.ts:32`) or re-export it under one agreed name in both places.
      `LiteralRule<T>` is now `Fn.PrimitiveRule<T>`; the dead `T extends LiteralRule<infer P>`
      branch in `Infer` (review issue #10, could never fire) is gone with it.
- [x] Import `ItemsOf`, `AtLeastTwoItems`, `LiteralTypes` from `../src` instead of redefining /
      aliasing them. `ItemsOf<T>` now forwards to `Fn.ItemsOf<T>`; `oneOf`/`allOf`/`anyOf`
      already used `Fn.AtLeastTwoItems` directly; `LiteralTypes` stays a re-export of
      `Fn.LiteralTypes` under the same public name (no redefinition of the union).
- [x] Fix the local `InferIntersection` (`expression.ts:119-125`) to wrap each member in
      `Infer<U> & …` exactly as `src/types.ts:68-74` does. It must stay a local type (it
      resolves against the expression `SchemaRule`), but the structure must match.
- [x] Keep `Infer` structurally parallel to `src/types.ts:52-63`; per Phase 1's decision (b),
      no predicate/function branch is added — `ExpressionRule` remains the only rule branch.

## Phase 4 — converter and helper parity (`__toExpression` vs `__toFunction`)

Reference: `src/combinators.ts:424-446`.

- [x] Replace the local `__isLiteral`/`__isObject` copies with imports from `../src`.
      In particular the local `__isObject` (`expression.ts:384-386`) matches `null`, `Date`,
      `RegExp`, and `Error`; main's checks `[object Object]`. — done: `__toExpression` now calls
      `Fn.__isLiteral`/`Fn.__isArray`/`Fn.__isError`/`Fn.__isObject` directly; the local copies
      are deleted (nothing else imported them).
- [x] Add the bare-array branch: an array schema becomes an `array(items)` node (main maps it
      to `__arrayExact`, which is `array` semantics). Un-comment and fix `expression.ts:398-400`.
- [x] Add the `Error` branch: an `Error` instance becomes
      `instanceOf(ctor, { message, ...ownProps })`, matching `src/combinators.ts:434-440`
      (name intentionally excluded there — keep that quirk).
- [x] Bare functions, per Phase 1's decision (b): `__toExpression` must keep rejecting them —
      but explicitly, with a clear error message (not the generic fall-through), and the
      conformance spec asserts the rejection.
- [x] Keep the final `throw new Error('hell knows')` message identical to main (or change both).
      — verified identical for genuinely unclassifiable schemas (e.g. `new Map()`).

## Phase 5 — tests and conformance guard

- [x] Move the API (`ExpressionVisitor`, nodes, factories, `__toExpression`) out of the ad-hoc
      script parts of `expression.ts`; keep the console-log experiments in a separate spec or
      delete them. Export `toFunction`/`toString` (the two renderers) as the reference visitors.
      — done early (pulled forward after Phase 0): demo script converted to
      `expression.spec.ts` "composite expressions" tests; inference canaries moved to the
      spec's "inference canaries" suite; `expectType` relocated to `@type-expect.ts`.
      `expression.ts` is now a pure module — nothing executes at import.
- [ ] Conformance spec: for every rule, build the expression node, convert with `toFunction`,
      and assert identical `ValidationResult` output to the directly-constructed `Fn.*` rule on
      a shared table of accept/reject sample values (including the option parameters and the
      arity failures).
- [ ] Extend the inference smoke tests (`expression.ts:686-720`) to the new nodes:
      `strictEqual`, `instanceOf`, `predicate`, `anyOf`, `objectLike`, plus
      `StrictSameType` canaries.
- [ ] Drift guard: a type-level test asserting
      `keyof ExpressionVisitor<any>` covers every rule factory exported by `../src`
      (e.g. via a `Record<PublicRuleName, unknown>` assignability check), so the next rule
      added to `src` fails compilation here until the visitor learns it.

---

### Explicitly *not* diffs (leave alone)

- `tuple`/`array` signatures already match main.
- `Built<X>`, the `__infer` phantom symbol, and the visitor pattern itself are the point of
  this file, not drift.