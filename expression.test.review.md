# Review: tests of the experimental expression API (uncommitted, 2026-07-03)

Scope: `pckg.core/test/expression.spec.ts` (new), the `expectType` addition in
`pckg.core/test/@type-expect.ts`, and the gap between them and the plan in `expression.md`.
Formatting ignored; implementation code reviewed but only test issues reported.

Baseline: the suite runs green (`npm test`, 196 passing including the new `expression` suite)
and `tsc --noEmit` over the project tsconfig is clean.

## Design issues

### 1. The stated goal — parity with `Fn.*` — is never actually tested

`expression.md` Phase 5 plans a conformance spec: build each expression node, convert with
`toFunction`, and assert *identical* `ValidationResult` to the directly-constructed `Fn.*` rule
over a shared accept/reject table. What was written instead hardcodes copies of `src`'s message
strings (`expression.spec.ts:78,100,129,143,…`). Two costs:

- a renderer that maps a node to the wrong `Fn` rule with a coincidentally similar message passes;
- every wording tweak in `src` breaks a dozen spec lines without indicating a real parity break.

The drift guard (`keyof ExpressionVisitor` covers every `src` rule export) is also unimplemented —
the next rule added to `src` fails nothing here, defeating the file's purpose. Both are unchecked
boxes in the plan, but they are the two tests that matter most.

### 2. None of the type-level tests can fail under `npm test`

Mocha runs through `tsx`, which strips types without checking them; the test script has no
`tsc --noEmit` step and there is no CI workflow. So the entire "inference canaries" suite
(`expression.spec.ts:306-356`), the `@ts-expect-error` arity checks (`:155-160`), and
`infers union, intersection and literal types` (`:292-301`) are runtime no-ops that always print
`ok`. The suite's own comment — "they stop compiling" — only holds if someone runs `tsc` manually
or in an IDE. Either the test script needs a typecheck step, or the canaries belong in a
documented typecheck-only file. (The pre-existing `@declaration.spec.ts` convention shares the
weakness; this change doubles down on it.)

### 3. `expectType().is<X>()` is one-directional and cannot catch the regressions its call sites target

It checks only "asserted type assignable to inferred type" (`@type-expect.ts:28-34`).
Verified empirically:

- `expectType(anyExpr).is<ExpressionRule<never>>()` always compiles — a universally-passing input.
- Widening regressions pass silently: if `literal(true)` regressed to `ExpressionRule<boolean>`,
  `expectType(literal(true)).is<ExpressionRule<true>>()` (`:295`) still compiles. Same for a
  collapse to `any`/`unknown` — every `is<>()` in the file keeps passing.
- `expectType(union).is<ExpressionRule<string | number | true>>()` (`:297`) reads as an equality
  assertion but only checks a subset: the union actually infers tuple/array/`Date`/`bigint`/
  `null`/`undefined` members too. Any subset — even `never` — passes.
- `:298`/`:299` assert both the widened and the literal-intersection types against `mixed`;
  both would also pass if `InferIntersection` collapsed to `any`, so together they still don't
  pin the type.

The strict, bidirectional helper (`typeExpect(...).isOfType<>().equals<true|false>()`) already
exists in the same file and is used ten lines later for near-identical assertions; the weak
helper adds a second, less safe idiom whose call sites duplicate the canaries.

`expectType`'s own doc comment (`@type-expect.ts:23-27`) oversells what it asserts — it reads
as a type equality check when it's really one-directional and blind to `any`-collapse. Worth a
caveat there, since it's the tool other people will reach for first.

### 4. Mixed assertion styles

Rendering tests call raw `match(...).with(...)` from `../src` (`:62,136,150,198,248`) while every
behavioral test uses the `expect()` wrapper from `./@expect` — which exists precisely to attach
`actual`/`schema` to the `AssertionError`. Failures report differently for no reason. The import
renaming (`expect as typeExpect, expectType` alongside runtime `expect`) is a symptom of three
confusingly-named helpers doing two jobs.

### 5. Misplaced / duplicated coverage of `src` semantics

`isPrototypedBy walks the prototype chain` (`:201-208`), `objectLike accepts any non-null object…`
(`:210-218`), `anyOf tolerates multiple matches…` (`:220-230`), and the strictEqual
reference-vs-value test (`:106-123`) re-verify main-API rule *behavior* already owned by
`isPrototypedBy.spec.ts`, `objectLike.spec.ts`, `oneOf.spec.ts`/`anyOf.spec.ts`, and
`strictEqual.spec.ts`. Through `toFunction` they exercise `src` again; the expression-layer fact
("this node maps to that factory with args intact") is tested only incidentally — exactly what
the missing conformance table would cover without duplication. All of these also sit under
`describe('node protocol')`, which they are not.

## Tautological / weak tests

### 6. Conversion tests are positive-only for most rules

In `converts nullary nodes` (`:76-85`) only `aString` has a rejection; a `FunctionRenderer`
mapping `aNumber`/`aBoolean`/`aBigInt`/`aDate` to `Fn.anything()` would pass every other line.
Same shape in `converts single argument nodes` (`:87-96` — `re`, `nullable`, `nullish`,
`optional`, `objectShape`, `arrayOf` positive-only) and `converts list argument nodes`
(`:98-104` — `allOf`, `tuple`, `array` positive-only). Some rules get negatives later, but only
incidentally inside semantic tests, so the node→factory mapping is largely unpinned.

### 7. Assertions can't support the comments/names

`oneOf matches exactly one of nine rules` (`:262-275`) annotates each value with *which* member
matched (`// aNumber(), not arrayOf(exact(7))`), but `[true]` cannot distinguish members — the
comments are unverified claims and the test name overstates what is proven.

## Duplicate code / coverage

### 8. Composite render test is nearly a subset of the mega-render test

`:247-260` repeats the node kinds of `:36-74` inside `oneOf`; even the bare-object-literal-in-
`allOf` case is already in test one. The only new coverage is a bare `'9'` string literal inside
a combinator.

### 9. Straight repeats

- `arrayOf(literal(7))` converted against the identical value `[7,7,7]` at `:94` and `:272`;
- oneOf zero-match message at `:100` and `:280`;
- oneOf multiple-match at `:222-225` and `:281-282`;
- type assertions `:293-295` are weaker duplicates of canaries `:313`, `:319-320`; `:297` of
  `:332`; `:300` of the end-to-end check at `:349-355`.

### 10. Granularity

The mega-render test is one 22-node string equality — a failure yields one giant diff with no
isolation of which renderer method broke. `factories validate their arguments` (`:163-189`)
packs nine factories into one `it()`; the first failure hides the other eight.

## Functional gaps the tests step around

### 11. The renderer's documented "lossy but acceptable" contract is untested — and violated — on the interesting inputs

Render tests only cover `strictEqual(42)` and string/number literals. Probed the untested paths:

- `toString(literal(3n))` **throws** (`JSON.stringify` can't serialize BigInt — yet bigint is a
  first-class `LiteralTypes` member the suite uses everywhere);
- `toString(strictEqual(circularObj))` **throws**;
- symbol literals / function values render as `exact(undefined)` / `strictEqual(undefined)`.

`expression.md`'s design note promises best-effort lossy rendering for exactly these value-bound
rules; no test pins that promise, and throwing is not lossy rendering.

### 12. `__toExpression` edge branches have zero coverage

Phase 4 explicitly says the spec must assert the bare-function rejection (currently it falls
through to the generic `'hell knows'` throw — no test touches it). The bare-array schema branch
(`expression.ts:508-510`, commented out) also falls through to `'hell knows'`; no test documents
either current behavior, so the planned fixes will land without a red-to-green signal.

### 13. `@ts-expect-error` doubles as type assertion and error suppressor

At `:155-160` it swallows *any* compile error on that line (e.g. a signature regression in
`expect().to.throw`), not just the intended arity violation — and per issue 2 it is never
evaluated by the test script anyway.

## Bottom line

The runtime tests are green but thin (positive-only mappings, hardcoded message copies instead of
the planned `Fn.*` conformance table), and the type tests are structurally unable to fail — half
because `npm test` never typechecks them, half because `expectType().is()` only checks the
direction that regressions don't break. Fix issues **1, 2, 3, 6** before committing.