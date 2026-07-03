import {
  aBigInt,
  aBoolean,
  aDate,
  aNumber,
  anyOf,
  anything,
  arrayOf,
  aString,
  allOf,
  array,
  ExpressionRule,
  Infer,
  instanceOf,
  isPrototypedBy,
  literal,
  nullable,
  nullish,
  objectLike,
  objectShape,
  oneOf,
  optional,
  predicate,
  re,
  strictEqual,
  toFunction,
  toString,
  tuple,
} from './expression';
import { expect } from './@expect';
import { expect as typeExpect, expectType, StrictSameType } from './@type-expect';
import { FunctionRule, instanceOf as fnInstanceOf, match } from '../src';

describe('expression', () => {
  describe('node protocol', () => {
    it('renders every node kind through the visitor', () => {
      const expression = oneOf(
        literal('9'),
        anything(),
        aBoolean(),
        aBigInt(),
        aNumber(),
        aString(),
        aDate(),
        re(/^hell/),
        strictEqual(42),
        instanceOf(TypeError),
        isPrototypedBy(Error),
        predicate((x: number) => x > 0),
        nullable(aDate()),
        nullish(aBigInt()),
        optional(aBoolean()),
        allOf({ id: '5' }, { age: 8 }),
        anyOf(aString(), aNumber()),
        objectShape({ id: aString() }),
        objectLike({ id: aString() }),
        tuple([aBoolean(), aNumber()]),
        array([aString(), aString()]),
        arrayOf(literal(7))
      );

      match(toString(expression)).with(
        'oneOf(' +
          'exact("9"), anything(), aBoolean(), aBigInt(), aNumber(), aString(), aDate(), re(/^hell/), strictEqual(42), ' +
          'instanceOf(TypeError), isPrototypedBy(Error), predicate(<anonymous>), ' +
          'nullable(aDate()), nullish(aBigInt()), optional(aBoolean()), ' +
          'allOf(objectShape({ id: exact("5") }), objectShape({ age: exact(8) })), ' +
          'anyOf(aString(), aNumber()), ' +
          'objectShape({ id: aString() }), ' +
          'objectLike({ id: aString() }), ' +
          'tuple([aBoolean(), aNumber()]), array([aString(), aString()]), arrayOf(exact(7))' +
          ')'
      );
    });

    it('converts nullary nodes', () => {
      expect(toFunction(aString())('hello')).to.match([true]);
      expect(toFunction(aString())(42 as any)).to.match([false, 'expected a string, got [object Number]']);
      expect(toFunction(aNumber())(42)).to.match([true]);
      expect(toFunction(aBoolean())(true)).to.match([true]);
      expect(toFunction(aBigInt())(3n)).to.match([true]);
      expect(toFunction(aDate())(new Date())).to.match([true]);
      expect(toFunction(anything())('whatever')).to.match([true]);
      expect(toFunction(anything())(undefined)).to.match([true]);
    });

    it('converts single argument nodes', () => {
      expect(toFunction(literal('9'))('9')).to.match([true]);
      expect(toFunction(literal('9'))('8' as any)).to.match([false, 'expected String 9, got String 8']);
      expect(toFunction(re(/^hell/))('hello')).to.match([true]);
      expect(toFunction(nullable(aDate()))(null)).to.match([true]);
      expect(toFunction(nullish(aBigInt()))(undefined)).to.match([true]);
      expect(toFunction(optional(aBoolean()))(undefined)).to.match([true]);
      expect(toFunction(arrayOf(literal(7)))([7, 7, 7])).to.match([true]);
      expect(toFunction(objectShape({ id: aString() }))({ id: 'x' })).to.match([true]);
    });

    it('converts list argument nodes', () => {
      expect(toFunction(oneOf(literal('9'), aNumber()))(8)).to.match([true]);
      expect(toFunction(oneOf(literal('9'), aNumber()))(true as any)).to.match([false, 'expected one of 2 rules, got 0 matches']);
      expect(toFunction(allOf({ id: '5' }, { age: 8 }))({ id: '5', age: 8 })).to.match([true]);
      expect(toFunction(tuple([aBoolean(), aNumber()]))([true, 42])).to.match([true]);
      expect(toFunction(array([aString(), aString()]))(['a', 'b'])).to.match([true]);
    });

    it('strictEqual compares by reference, literal by value', () => {
      const when = new Date(0);

      expect(toFunction(strictEqual(when))(when)).to.match([true]);
      expect(toFunction(literal(when))(new Date(0))).to.match([true]);
      expect(toFunction(strictEqual(when))(new Date(0))).to.match([
        false,
        'expected strict equals Date 1970-01-01T00:00:00.000Z, got Date 1970-01-01T00:00:00.000Z',
      ]);

      const ref = { id: 1 } as const;

      expect(toFunction(strictEqual(ref))(ref)).to.match([true]);
      expect(toFunction(strictEqual(ref))({ id: 1 })).to.match([
        false,
        'expected strict equals [object Object], got [object Object]',
      ]);
    });

    it('instanceOf checks the prototype chain and the optional extra shape', () => {
      const plain = toFunction(instanceOf(TypeError));

      expect(plain(new TypeError('boom'))).to.match([true]);
      expect(plain(new RangeError('boom'))).to.match([false, 'expected instanceof TypeError got instanceof RangeError']);

      const withShape = toFunction(instanceOf(TypeError, { message: re(/^boom/) }));

      expect(withShape(new TypeError('boom!'))).to.match([true]);
      expect(withShape(new TypeError('bang'))).to.match([false, '[message] expected /^boom/, got String bang']);

      match(toString(instanceOf(TypeError, { message: re(/^boom/) }))).with(
        'instanceOf(TypeError, { message: re(/^boom/) })'
      );
    });

    it('aString and arrayOf carry their options through', () => {
      expect(toFunction(aString({ length: 5 }))('hello')).to.match([true]);
      expect(toFunction(aString({ length: 5 }))('hi')).to.match([false, 'expected string of length 5, got length 2']);
      expect(toFunction(arrayOf(aNumber(), { length: 2 }))([1, 2])).to.match([true]);
      expect(toFunction(arrayOf(aNumber(), { length: 2 }))([1])).to.match([
        false,
        'expected array of length 2, got length 1',
      ]);

      match(toString(aString({ length: 5 }))).with('aString({"length":5})');
      match(toString(arrayOf(aNumber(), { length: 2 }))).with('arrayOf(aNumber(), {"length":2})');
    });

    it('oneOf, allOf and anyOf require at least two rules', () => {
      // @ts-expect-error — a single rule is rejected at the type level
      expect(() => oneOf(aString())).to.throw(fnInstanceOf(Error, { message: 'oneOf requires at least two arguments' }));
      // @ts-expect-error — a single rule is rejected at the type level
      expect(() => allOf(aString())).to.throw(fnInstanceOf(Error, { message: 'allOf requires at least two arguments' }));
      // @ts-expect-error — a single rule is rejected at the type level
      expect(() => anyOf(aString())).to.throw(fnInstanceOf(Error, { message: 'anyOf requires at least two arguments' }));
    });

    it('factories validate their arguments', () => {
      expect(() => re(null as any)).to.throw(fnInstanceOf(Error, { message: 'rule must be a RegExp' }));
      expect(() => nullable(null as any)).to.throw(
        fnInstanceOf(Error, { message: 'nullable null or undefined? interesting...' })
      );
      expect(() => nullish(null as any)).to.throw(
        fnInstanceOf(Error, { message: 'nullish null or undefined? interesting...' })
      );
      expect(() => optional(undefined as any)).to.throw(
        fnInstanceOf(Error, { message: 'optional undefined? interesting...' })
      );
      expect(() => objectShape(null as any)).to.throw(
        fnInstanceOf(Error, { message: 'object shape rule cannot be null or undefined' })
      );
      expect(() => objectLike(null as any)).to.throw(
        fnInstanceOf(Error, { message: 'object like rule cannot be null or undefined' })
      );
      expect(() => predicate(42 as any)).to.throw(
        fnInstanceOf(Error, { message: 'predicate requires a function argument' })
      );
      expect(() => instanceOf(42 as any)).to.throw(
        fnInstanceOf(Error, { message: 'argument must be a constructor function' })
      );
      expect(() => isPrototypedBy(42 as any)).to.throw(
        fnInstanceOf(Error, { message: 'argument must be a constructor function' })
      );
    });

    it('predicate wraps a custom function, message optional', () => {
      const isEven = (x: number) => x % 2 === 0;

      expect(toFunction(predicate(isEven))(4)).to.match([true]);
      expect(toFunction(predicate(isEven))(5)).to.match([false, 'predicate failed for Number 5']);
      expect(toFunction(predicate(isEven, 'must be even'))(5)).to.match([false, 'must be even']);

      match(toString(predicate(isEven, 'must be even'))).with('predicate(isEven, "must be even")');
    });

    it('isPrototypedBy walks the prototype chain of objects and constructors', () => {
      const rule = toFunction(isPrototypedBy(Error));

      expect(rule(new TypeError('boom'))).to.match([true]);
      expect(rule(TypeError as any)).to.match([true]); // subclass constructors are prototyped by Error too
      expect(rule({} as any)).to.match([false, 'expected object prototyped by Error got Object']);
      expect(rule(null as any)).to.match([false, 'expected object prototyped by Error got null']);
    });

    it('objectLike accepts any non-null object, objectShape only plain objects', () => {
      const shape = toFunction(objectShape({ length: aNumber() }));
      const like = toFunction(objectLike({ length: aNumber() }));

      expect(like({ length: 5 })).to.match([true]);
      expect(like([1, 2, 3] as any)).to.match([true]);
      expect(shape([1, 2, 3] as any)).to.match([false, 'expected object, got [object Array]']);
      expect(like(null as any)).to.match([false, 'expected non null value, got null']);
    });

    it('anyOf tolerates multiple matches, oneOf does not', () => {
      expect(toFunction(anyOf(aNumber(), literal(7)))(7)).to.match([true]);
      expect(toFunction(oneOf(aNumber(), literal(7)))(7)).to.match([
        false,
        'expected one of 2 rules, got multiple matches at index 1',
      ]);
      expect(toFunction(anyOf(literal('9'), aNumber()))(true as any)).to.match([
        false,
        'expected at least one of 2 rules, got 0 matches',
      ]);
    });
  });

  describe('composite expressions', () => {
    const union = oneOf(
      tuple([aBoolean(), aNumber()]),
      array([aString(), aString()]),
      '9',
      aNumber(),
      re(/^hell/),
      optional(aBoolean()),
      nullish(aBigInt()),
      nullable(aDate()),
      arrayOf(literal(7))
    );
    const mixed = allOf({ id: '5' }, { email: 'a@gmail.com' }, nullable({ age: 8 }));

    it('renders bare literals and object schemas embedded in combinators', () => {
      match(toString(union)).with(
        'oneOf(' +
          'tuple([aBoolean(), aNumber()]), array([aString(), aString()]), exact("9"), aNumber(), re(/^hell/), ' +
          'optional(aBoolean()), nullish(aBigInt()), nullable(aDate()), arrayOf(exact(7))' +
          ')'
      );
      match(toString(mixed)).with(
        'allOf(' +
          'objectShape({ id: exact("5") }), objectShape({ email: exact("a@gmail.com") }), ' +
          'nullable(objectShape({ age: exact(8) }))' +
          ')'
      );
    });

    it('oneOf matches exactly one of nine rules', () => {
      const rule = toFunction(union);

      expect(rule(true)).to.match([true]); // optional(aBoolean())
      expect(rule(9)).to.match([true]); // aNumber()
      expect(rule('9')).to.match([true]); // exact('9')
      expect(rule('hello')).to.match([true]); // re(/^hell/)
      expect(rule(7)).to.match([true]); // aNumber(), not arrayOf(exact(7))
      expect(rule(3n)).to.match([true]); // nullish(aBigInt())
      expect(rule(new Date())).to.match([true]); // nullable(aDate())
      expect(rule([7, 7, 7])).to.match([true]); // arrayOf(exact(7))
      expect(rule([true, 42])).to.match([true]); // tuple([aBoolean(), aNumber()])
      expect(rule(['test', 'test'])).to.match([true]); // array([aString(), aString()])
    });

    it('oneOf rejects zero and multiple matches', () => {
      const rule = toFunction(union);

      expect(rule('zzz')).to.match([false, 'expected one of 9 rules, got 0 matches']);
      expect(rule(null)).to.match([false, 'expected one of 9 rules, got multiple matches at index 7']); // nullish + nullable
      expect(rule(undefined)).to.match([false, 'expected one of 9 rules, got multiple matches at index 6']); // optional + nullish
    });

    it('allOf intersects object schemas', () => {
      const rule = toFunction(mixed);

      expect(rule({ id: '5', email: 'a@gmail.com', age: 8 })).to.match([true]);
      expect(rule({ id: '5', email: '', age: 8 })).to.match([false, '[email] expected String a@gmail.com, got String ']);
    });

    it('infers union, intersection and literal types', () => {
      expectType(aString()).is<ExpressionRule<string>>();
      expectType(aNumber()).is<ExpressionRule<number>>();
      expectType(literal(true)).is<ExpressionRule<true>>();
      expectType(anything()).is<ExpressionRule<any>>();
      expectType(union).is<ExpressionRule<string | number | true>>();
      expectType(mixed).is<ExpressionRule<{ id: string; email: string; age: number }>>();
      expectType(mixed).is<ExpressionRule<{ id: '5' } & { email: 'a@gmail.com' } & { age: 8 }>>();
      expectType(toFunction(literal(8))).is<FunctionRule<8>>();
    });
  });

  // The equals<false>() lines are the canaries: if the phantom stops binding,
  // Infer collapses to unknown, every SameType flips, and they stop compiling.
  describe('inference canaries', () => {
    it('Infer recovers the exact type from a rule — not unknown', () => {
      typeExpect<Infer<ExpressionRule<number>>>().isOfType<number>().equals<true>();
      typeExpect<Infer<ExpressionRule<number>>>().isOfType<unknown>().equals<false>();
    });

    it('rules with different value types are distinguishable', () => {
      typeExpect(aString()).isOfType<ExpressionRule<string>>().equals<true>();
      typeExpect(aString()).isOfType<ExpressionRule<number>>().equals<false>();
      typeExpect(predicate((x: number) => x > 0)).isOfType<ExpressionRule<number>>().equals<true>();
    });

    it('literals are preserved, not widened', () => {
      typeExpect(literal(8)).isOfType<ExpressionRule<8>>().equals<true>();
      typeExpect(literal(8)).isOfType<ExpressionRule<number>>().equals<false>();
      typeExpect(strictEqual(8)).isOfType<ExpressionRule<8>>().equals<true>();
      typeExpect(strictEqual(8)).isOfType<ExpressionRule<number>>().equals<false>();
    });

    it('modifiers carry their unions through', () => {
      typeExpect(nullable(aDate())).isOfType<ExpressionRule<Date | null>>().equals<true>();
      typeExpect(optional(aBoolean())).isOfType<ExpressionRule<boolean | undefined>>().equals<true>();
      typeExpect(nullish(aBigInt())).isOfType<ExpressionRule<bigint | null | undefined>>().equals<true>();
    });

    it('combinators infer through their children', () => {
      typeExpect(oneOf('9', aNumber())).isOfType<ExpressionRule<string | number>>().equals<true>();
      typeExpect(anyOf('9', aNumber())).isOfType<ExpressionRule<string | number>>().equals<true>();
      typeExpect(arrayOf(literal(7))).isOfType<ExpressionRule<7[]>>().equals<true>();
      typeExpect(objectShape({ id: aString() })).isOfType<ExpressionRule<{ id: string }>>().equals<true>();
      typeExpect(objectLike({ id: aString() })).isOfType<ExpressionRule<{ id: string }>>().equals<true>();
      typeExpect(instanceOf(TypeError)).isOfType<ExpressionRule<TypeError>>().equals<true>();
      typeExpect(isPrototypedBy(TypeError)).isOfType<ExpressionRule<TypeError>>().equals<true>();
      typeExpect(instanceOf(TypeError, { message: aString() }))
        .isOfType<ExpressionRule<TypeError & { message: string }>>()
        .equals<true>();
    });

    it('any-collapse canary — SameType is blind to any, StrictSameType is not', () => {
      typeExpect<StrictSameType<Infer<ExpressionRule<number>>, number>>().isOfType<true>().equals<true>();
    });

    it('end-to-end: the interpreter receives the inferred parameter type', () => {
      const smoke = toFunction(oneOf('9', aNumber()));

      typeExpect<Parameters<typeof smoke>[0]>().isOfType<string | number>().equals<true>();
      // @ts-expect-error — a Date must be rejected; if this directive reports
      // "unused", toFunction has collapsed back to FunctionRule<any>
      expect(smoke(new Date())).to.match([false, 'expected one of 2 rules, got 0 matches']);
    });
  });
});
