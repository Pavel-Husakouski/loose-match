import {
  __toExpression,
  aBigInt,
  aBoolean,
  aDate,
  allOf,
  aNumber,
  anyOf,
  anything,
  array,
  arrayOf,
  aString,
  Built,
  ExpressionRule,
  ExpressionVisitor,
  instanceOf,
  isPrototypedBy,
  literal,
  nullable,
  nullish,
  objectLike,
  ObjectRule,
  objectShape,
  oneOf,
  optional,
  predicate,
  re,
  SchemaRule,
  strictEqual,
  toFunction,
  tuple,
} from '../src/expressions';
import * as Fn from '../src';
import { instanceOf as fnInstanceOf, match } from '../src';
import { expect } from './@expect';

type Rendered = Built<string>;

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
      expect(toFunction(oneOf(literal('9'), aNumber()))(true as any)).to.match([
        false,
        'expected one of 2 rules, got 0 matches',
      ]);
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
      expect(plain(new RangeError('boom'))).to.match([
        false,
        'expected instanceof TypeError got instanceof RangeError',
      ]);

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
      expect(() => oneOf(aString())).to.throw(
        fnInstanceOf(Error, { message: 'oneOf requires at least two arguments' })
      );
      // @ts-expect-error — a single rule is rejected at the type level
      expect(() => allOf(aString())).to.throw(
        fnInstanceOf(Error, { message: 'allOf requires at least two arguments' })
      );
      // @ts-expect-error — a single rule is rejected at the type level
      expect(() => anyOf(aString())).to.throw(
        fnInstanceOf(Error, { message: 'anyOf requires at least two arguments' })
      );
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
      // @ts-expect-error — the parameter is now narrowed to the literal 'a@gmail.com';
      // the call deliberately feeds a mismatching value to check the runtime rejection
      expect(rule({ id: '5', email: '', age: 8 })).to.match([
        false,
        '[email] expected String a@gmail.com, got String ',
      ]);
    });
  });

  describe('__toExpression converter parity with Fn.__toFunction (Phase 4)', () => {
    it('converts a bare array to array(...) semantics, matching main exactly', () => {
      const schema = ['a', 'b'];
      const rule = toFunction(__toExpression(schema));
      const mainRule = Fn.__toFunction(schema);

      expect(rule(['a', 'b'] as any)).to.match([true]);
      expect(mainRule(['a', 'b'] as any)).to.match([true]);

      // element mismatch is checked before the length check, so a short array fails on the
      // first missing element rather than on its length
      expect(rule(['a'] as any)).to.match([false, '[1] expected String b, got undefined']);
      expect(mainRule(['a'] as any)).to.match([false, '[1] expected String b, got undefined']);

      expect(rule(['a', 'c'] as any)).to.match([false, '[1] expected String b, got String c']);
      expect(mainRule(['a', 'c'] as any)).to.match([false, '[1] expected String b, got String c']);

      match(toString(__toExpression(schema))).with('array([exact("a"), exact("b")])');
    });

    it('converts a bare array embedded in an object schema (nested, not top-level)', () => {
      const rule = toFunction(objectShape({ list: ['a', 'b'] as any }));

      expect(rule({ list: ['a', 'b'] })).to.match([true]);
      expect(rule({ list: ['a'] })).to.match([false, '[list] [1] expected String b, got undefined']);
    });

    it('converts a bare Error to instanceOf(ctor, { message, ...ownProps }), matching main exactly', () => {
      const schema: any = Object.assign(new TypeError('boom'), { code: 'E1' });
      const rule = toFunction(__toExpression(schema));
      const mainRule = Fn.__toFunction(schema);

      const passing = Object.assign(new TypeError('boom'), { code: 'E1' });
      const wrongMessage = Object.assign(new TypeError('nope'), { code: 'E1' });
      const wrongCtor = Object.assign(new RangeError('boom'), { code: 'E1' });
      const missingProp = new TypeError('boom');

      expect(rule(passing)).to.match([true]);
      expect(mainRule(passing)).to.match([true]);

      expect(rule(wrongCtor)).to.match([false, 'expected instanceof TypeError got instanceof RangeError']);
      expect(mainRule(wrongCtor)).to.match([false, 'expected instanceof TypeError got instanceof RangeError']);

      expect(rule(wrongMessage)).to.match([false, '[message] expected String boom, got String nope']);
      expect(mainRule(wrongMessage)).to.match([false, '[message] expected String boom, got String nope']);

      expect(rule(missingProp as any)).to.match([false, '[code] expected String E1, got undefined']);
      expect(mainRule(missingProp as any)).to.match([false, '[code] expected String E1, got undefined']);

      match(toString(__toExpression(schema))).with(
        'instanceOf(TypeError, { message: exact("boom"), code: exact("E1") })'
      );
    });

    it('rejects bare functions explicitly instead of falling through to "hell knows"', () => {
      const bareFn = (x: number): Fn.ValidationResult => (x > 0 ? [true] : [false, 'must be positive']);

      expect(() => __toExpression(bareFn as any)).to.throw(
        fnInstanceOf(Error, { message: 'bare functions are not supported by expressions' })
      );

      // main, by contrast, passes a tuple-returning bare function through as-is (Phase 1 decision (b))
      const mainRule = Fn.__toFunction(bareFn as any);

      expect(mainRule(5)).to.match([true]);
      expect(mainRule(-1)).to.match([false, 'must be positive']);
    });

    it('keeps the final fallback error identical to main for genuinely unclassifiable schemas', () => {
      const exotic = new Map();

      expect(() => __toExpression(exotic as any)).to.throw(fnInstanceOf(Error, { message: 'hell knows' }));
      expect(() => Fn.__toFunction(exotic as any)).to.throw(fnInstanceOf(Error, { message: 'hell knows' }));
    });
  });

  describe('inference canaries', () => {
    it('end-to-end: the interpreter receives the inferred parameter type', () => {
      const smoke = toFunction(oneOf('9', aNumber()));

      // @ts-expect-error — a Date must be rejected; if this directive reports
      // "unused", toFunction has collapsed back to FunctionRule<any>
      expect(smoke(new Date())).to.match([false, 'expected one of 2 rules, got 0 matches']);
    });
  });
});

const ExpressionRenderer = new (class implements ExpressionVisitor<string> {
  literal<T>(value: T): Rendered {
    return `exact(${JSON.stringify(value)})`;
  }

  anything(): Rendered {
    return 'anything()';
  }

  aBoolean(): Rendered {
    return 'aBoolean()';
  }

  aBigInt(): Built<string> {
    return 'aBigInt()';
  }

  aNumber(): Rendered {
    return 'aNumber()';
  }

  aString(options?: { length: number }): Rendered {
    return options == null ? 'aString()' : `aString(${JSON.stringify(options)})`;
  }

  aDate(): Rendered {
    return 'aDate()';
  }

  nullable(schema: SchemaRule<any>): Rendered {
    const expression = __toExpression(schema);

    return `nullable(${expression.accept(this)})`;
  }

  nullish(schema: SchemaRule<any>): Rendered {
    const expression = __toExpression(schema);

    return `nullish(${expression.accept(this)})`;
  }

  optional(schema: SchemaRule<any>): Rendered {
    const expression = __toExpression(schema);

    return `optional(${expression.accept(this)})`;
  }

  oneOf(schema: SchemaRule<any>[]): Rendered {
    const args = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return `oneOf(${args.join(', ')})`;
  }

  allOf(schema: SchemaRule<any>[]): Rendered {
    const args = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return `allOf(${args.join(', ')})`;
  }

  anyOf(schema: SchemaRule<any>[]): Rendered {
    const args = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return `anyOf(${args.join(', ')})`;
  }

  re(rule: RegExp): Rendered {
    return `re(${rule.toString()})`;
  }

  strictEqual(value: unknown): Rendered {
    return `strictEqual(${JSON.stringify(value)})`;
  }

  instanceOf(ctor: abstract new (...args: any[]) => any, extraRule?: ObjectRule<any>): Rendered {
    if (!extraRule) {
      return `instanceOf(${ctor.name})`;
    }

    const entries = Object.entries(extraRule).map(([key, value]) => {
      const expression = __toExpression(value);

      return `${key}: ${expression.accept(this)}`;
    });

    return `instanceOf(${ctor.name}, { ${entries.join(', ')} })`;
  }

  isPrototypedBy(ctor: abstract new (...args: any[]) => any): Rendered {
    return `isPrototypedBy(${ctor.name})`;
  }

  predicate(fn: Fn.PredicateRule<any>, message?: string): Rendered {
    const name = fn.name || '<anonymous>';

    return message == null ? `predicate(${name})` : `predicate(${name}, ${JSON.stringify(message)})`;
  }

  objectShape(schema: ObjectRule<any>): Rendered {
    const entries = Object.entries(schema).map(([key, value]) => {
      const expression = __toExpression(value);

      return `${key}: ${expression.accept(this)}`;
    });

    return `objectShape({ ${entries.join(', ')} })`;
  }

  objectLike(schema: ObjectRule<any>): Rendered {
    const entries = Object.entries(schema).map(([key, value]) => {
      const expression = __toExpression(value);

      return `${key}: ${expression.accept(this)}`;
    });

    return `objectLike({ ${entries.join(', ')} })`;
  }

  tuple(schema: SchemaRule<any>[]): Rendered {
    const items = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return `tuple([${items.join(', ')}])`;
  }

  array(schema: SchemaRule<any>[]): Rendered {
    const items = schema.map((item) => {
      const expression = __toExpression(item);

      return expression.accept(this);
    });

    return `array([${items.join(', ')}])`;
  }

  arrayOf(schema: SchemaRule<any>, options?: { length: number }): Rendered {
    const expression = __toExpression(schema);

    return options == null
      ? `arrayOf(${expression.accept(this)})`
      : `arrayOf(${expression.accept(this)}, ${JSON.stringify(options)})`;
  }
})();

function toString(expression: ExpressionRule<any>): string {
  return expression.accept(ExpressionRenderer);
}
