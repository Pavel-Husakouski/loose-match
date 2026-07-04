# Review: expression API (uncommitted changes, 2026-07-03)

Scope: `expression.md` (plan/spec), `pckg.core/test/expression.ts` (implementation).
Tests reviewed only as evidence of implementation issues. Formatting ignored.
`pckg.core/test/@type-expect.ts` is a test-only helper; issues with it are tracked in
`expression.test.review.md`.

**Verdict.** The core visitor mechanics are sound: typecheck is clean, all 196 tests pass,
and `toFunction` parity was verified by runtime probes on edge cases. The real problem is
`__toExpression`, whose known-pending Phase 4 gaps are not just missing features — one of
them silently changes the meaning of a schema that is legal in the main API.

## Functional issues

1. **A nested `Error` instance silently means the opposite of main**
   (`expression.ts:494-496`, `expression.ts:501-516`). Main's `__toFunction` converts an
   `Error` schema to `instanceOf(ctor, { message, … })`; the expression's `__isObject`
   (`typeof === 'object' && !Array.isArray`) routes it into `objectShape(error)`. Since
   `Error#message` is non-enumerable, that becomes `objectShape({})`, which requires
   `[object Object]` and therefore **rejects every Error value**. Verified:
   `Fn.objectShape({e: err})` matches an equivalent TypeError; the expression version
   returns `[false, '[e] expected object, got TypeError boom']`. This is Phase 4 in the
   plan, but unlike the other pending items it's a silent semantic divergence, not a loud
   gap — worth pulling forward or guarding with an explicit throw.

2. **Nested bare arrays throw `'hell knows'`** (`expression.ts:508-510`, commented out).
   Verified: `toFunction(objectShape({ tags: ['a'] }))` throws, while main accepts the
   same schema. Acknowledged in Phase 4, but it contradicts the goal statement at the top
   of `expression.md` ("behaviorally indistinguishable") for schemas that are legal today
   in main.

3. **Bare functions fail with the generic `'hell knows'`** (`expression.ts:515`). Phase 4
   itself requires the rejection to be "explicit, with a clear error message" — that half
   of decision (b) isn't implemented; a user embedding a predicate function in an object
   schema gets an inscrutable error with no hint that `predicate(...)` is required.

4. **`__isObject` is wrong as an exported predicate** (`expression.ts:494-496`). It
   returns `true` for `null`, `Date`, `RegExp`, `Map`, class instances, etc. Inside
   `__toExpression` most of these are shadowed by the earlier `__isLiteral` check, but
   the function is exported, so the broken contract is public. Main's
   `__typeOf(value) === '[object Object]'` is the correct body (and Phase 4 already says
   to import it).

## Design issues

5. **Structural public type, nominal runtime check.** `ExpressionRule<T>` is exported as
   a structural type ("just like in the visitor pattern... an acceptor"), but
   `__isExpression` (`expression.ts:490-492`) only recognizes `instanceof __Exp`, a
   private class. A hand-rolled object satisfying the exported type falls through to
   `__isObject` → gets treated as an object *schema* → its `accept` function hits the
   fall-through and throws `'hell knows'`. Either brand the type (a runtime symbol, not
   just the phantom), check structurally (`typeof value.accept === 'function'`), or
   document that only factory-produced rules are valid and stop exporting the structural
   type as if it were implementable.

6. **`__Exp` is instantiable and lies about its fields** (`expression.ts:132-141`).
   `type: ExpressionType = null as any; args: any[] = null as any` exist only to appease
   the compiler; `new __Exp().accept(v)` crashes on `...null`. Make the class `abstract`
   with `abstract readonly type` / `declare readonly args`, and the `null as any`
   initializers disappear.

7. **The public `ExpressionRule` type is looser than every implementation.** `type` is
   mutable and `args?: any[]` is optional (`expression.ts:66-68`), yet `accept` requires
   `args` at runtime and every node declares both `readonly`. Since the visitor never
   reads them, consider dropping `type`/`args` from the public type entirely — they're
   implementation detail; if kept, they should be `readonly` and `args` required.

8. **Visitor signatures don't actually mirror the factories 1:1**, though both
    `expression.md` Phase 0 (checked as done) and the plan's rationale claim they do:
    main's `oneOf/allOf/anyOf` are variadic, the visitor methods take a single array
    (`expression.ts:26-30`), and the nodes double-wrap (`args: [SchemaRule<any>[]]`).
    Making the visitor variadic (`oneOf(...schemas)`, `args = items`) would fulfill the
    stated design and remove the wrapping; otherwise fix the claim in the doc.

9. **Type-layer copies have already drifted** (Phase 3, acknowledged pending, but the
    drift is present, not hypothetical): local `InferIntersection`
    (`expression.ts:119-125`) intersects raw `U` where main wraps `Infer<U>`
    (`src/types.ts:71`); `LiteralRule` duplicates `PrimitiveRule` under a different name;
    `ItemsOf` and `__isLiteral` are verbatim copies that nothing keeps in sync.

10. **Dead branch in `Infer`** (`expression.ts:103-104`):
    `T extends LiteralRule<infer P>` can never fire — anything it could match was already
    caught by the first `T extends LiteralTypes` branch (and inferring through a
    conditional alias doesn't work anyway). Delete it.

11. **`anything()` lost main's warning** (`expression.ts:165-167` vs
    `src/literals.ts:5-7`). Main documents that `anything` poisons inference inside
    `oneOf/anyOf/allOf`; the expression counterpart has no doc comment at all, and the
    spec's own node-protocol test wraps `anything()` in `oneOf`, collapsing that union to
    `ExpressionRule<any>`.

## Style / documentation

12. Stale commented code contradicting a final decision: `// nullish(): Built<X>;`
    (`expression.ts:18`), the `/*| PredicateRule<T>*/` remnants in `SchemaRule` and
    `Infer` (`expression.ts:96`, `105-107`). Decision (b) in the plan is final, so these
    should be removed (a one-line comment referencing the decision would say more than
    the fossils do).

13. `__isObject<T>` declares an unused type parameter `T` (`expression.ts:494`) —
    inherited from main's copy, but new code needn't replicate the quirk.

## Non-issues (checked and ruled out)

- `aString`/`arrayOf` capture their options object by reference and read it at match
  time — main behaves identically, so it's parity, not a bug.
- The `this`-binding through `accept`'s dispatch cast
  (`(visitor[this.type] as …)(...this.args)`) — parentheses preserve the receiver;
  recursive renderer methods work.
- `Object.entries` in the object renderers vs main's `for...in` + `hasOwnProperty` —
  equivalent (own enumerable string keys in both).

## Priority

The highest-value fix is #1 (the Error-schema silent divergence) — everything else is
either cheap cleanup or already scheduled in the plan's remaining phases.
