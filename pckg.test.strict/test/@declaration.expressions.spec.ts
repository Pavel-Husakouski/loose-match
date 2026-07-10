import { describe } from 'mocha';
import { expect } from './@type-expect';
import {
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
  ExpressionRule as TheRule,
  Infer,
  InferIntersection,
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
} from '@beeff/loose-match/lib/expressions.js';
import { FunctionRule, ItemsOf, LiteralRule, validate, ValidationResult } from '@beeff/loose-match';

describe('Hell', () => {
  const d = oneOf(
    tuple([aBoolean(), aNumber()]),
    array([aString(), aNumber()]),
    [aString(), aNumber()],
    [1, 2, 3],
    literal('9'),
    // b,
    optional(aBoolean()),
    nullish(aBigInt()),
    nullable(aDate()),
    arrayOf(literal(7))
  );

  expect<Infer<typeof d>>()
    .isOfType<
      | [boolean, number]
      | (string | number)[]
      | [string, number]
      | [1, 2, 3]
      | '9'
      | boolean
      | bigint
      | Date
      | 7[]
      | null
      | undefined
    >()
    .equals<true>();
});

describe('Type inference: primitives', () => {
  expect<Infer<string>>().isOfType<string>().equals<true>();
  expect<Infer<number>>().isOfType<number>().equals<true>();
  expect<Infer<bigint>>().isOfType<bigint>().equals<true>();
  expect<Infer<boolean>>().isOfType<boolean>().equals<true>();
  expect<Infer<null>>().isOfType<null>().equals<true>();
  expect<Infer<undefined>>().isOfType<undefined>().equals<true>();
  expect<Infer<Date>>().isOfType<Date>().equals<true>();
  expect<Infer<['1']>>().isOfType<['1']>().equals<true>();
  expect<Infer<[]>>().isOfType<[]>().equals<true>();
  expect<Infer<null[]>>().isOfType<null[]>().equals<true>();
  expect<Infer<undefined[]>>().isOfType<undefined[]>().equals<true>();
  expect<Infer<[null, undefined]>>().isOfType<[null, undefined]>().equals<true>();
  expect<Infer<{ a: null; b: undefined }>>().isOfType<{ a: null; b: undefined }>().equals<true>();
  expect<Infer<string | number | Date | boolean | null | undefined>>()
    .isOfType<string | number | Date | boolean | null | undefined>()
    .equals<true>();
});

describe('Type inference: TheRule', () => {
  expect<Infer<TheRule<string>>>().isOfType<string>().equals<true>();
  expect<Infer<TheRule<number>>>().isOfType<number>().equals<true>();
  expect<Infer<TheRule<bigint>>>().isOfType<bigint>().equals<true>();
  expect<Infer<TheRule<boolean>>>().isOfType<boolean>().equals<true>();
  expect<Infer<TheRule<null>>>().isOfType<null>().equals<true>();
  expect<Infer<TheRule<undefined>>>().isOfType<undefined>().equals<true>();
  expect<Infer<TheRule<Date>>>().isOfType<Date>().equals<true>();
  expect<Infer<TheRule<TheRule<RegExp>>>>().isOfType<TheRule<RegExp>>().equals<true>();
  // canary: if the phantom type stops binding, Infer collapses to unknown instead of number
  expect<Infer<TheRule<number>>>().isOfType<unknown>().equals<false>();
});

describe('Type inference: array types', () => {
  expect<Infer<any[]>>().isOfType<any[]>().equals<true>();
  expect<Infer<string[]>>().isOfType<string[]>().equals<true>();
  expect<Infer<number[]>>().isOfType<number[]>().equals<true>();
  expect<Infer<bigint[]>>().isOfType<bigint[]>().equals<true>();
  expect<Infer<boolean[]>>().isOfType<boolean[]>().equals<true>();
  expect<Infer<null[]>>().isOfType<null[]>().equals<true>();
  expect<Infer<undefined[]>>().isOfType<undefined[]>().equals<true>();
  expect<Infer<Date[]>>().isOfType<Date[]>().equals<true>();
  expect<Infer<TheRule<string>[]>>().isOfType<string[]>().equals<true>();
  expect<Infer<SchemaRule<number>[]>>().isOfType<number[]>().equals<true>();
  expect<Infer<ObjectRule<{ a: SchemaRule<string> }>[]>>().isOfType<{ a: string }[]>().equals<true>();
});

describe('LiteralRule: poisoned when non literal', () => {
  expect<LiteralRule<{ id: string }>>().isOfType<never>().equals<true>();
});

describe('ItemsOf', () => {
  expect<ItemsOf<[string, number]>>().isOfType<string | number>().equals<true>();
});

describe('Type inference: union and intersection', () => {
  expect<InferIntersection<[{ id: string }, { email: string }]>>()
    .isOfType<{ id: string } & { email: string }>()
    .equals<true>();
  expect<InferIntersection<[{ id: string }, { email: TheRule<string> }]>>()
    .isOfType<{ id: string } & { email: string }>()
    .equals<true>();
  // members already wrapped in TheRule must not lose precision through Infer<U>
  expect<InferIntersection<[TheRule<{ id: string }>, TheRule<{ age: 8 }>]>>()
    .isOfType<{ id: string } & { age: 8 }>()
    .equals<true>();
  // bare literal object schemas go through the same Infer<U> path
  expect<InferIntersection<[{ id: '5' }, { age: 8 }]>>().isOfType<{ id: '5' } & { age: 8 }>().equals<true>();
});

describe('Type inference: object types', () => {
  expect<Infer<{ a: string; b: number; c: Date }>>().isOfType<{ a: string; b: number; c: Date }>().equals<true>();
});

describe('Type inference: complex type object', () => {
  expect<Infer<{ messages: (TheRule<string> | TheRule<number>)[] }>>()
    .isOfType<{ messages: (string | number)[] }>()
    .equals<true>();
});

describe('Type inference: complex type object', () => {
  expect<Infer<{ messages: (TheRule<{ id: string }> | TheRule<{ email: string }>)[] }>>()
    .isOfType<{ messages: ({ id: string } | { email: string })[] }>()
    .equals<true>();
});

describe('anything: matches any value', () => {
  const pattern = anything();

  expect(pattern).isOfType<TheRule<any>>().equals<true>();
});

describe('strictEqual', () => {
  const pattern = strictEqual(globalThis);

  expect(pattern).isOfType<TheRule<typeof globalThis>>().equals<true>();
});

describe('strictEqual: literal narrowing', () => {
  const pattern = strictEqual(8);

  expect(pattern).isOfType<TheRule<8>>().equals<true>();
  expect(pattern).isOfType<TheRule<number>>().equals<false>();
});

describe('literal: string value', () => {
  const pattern = literal('1');

  expect(pattern).isOfType<TheRule<'1'>>().equals<true>();
});

describe('literal: Date value', () => {
  const pattern = literal(new Date());

  expect(pattern).isOfType<TheRule<Date>>().equals<true>();
});

describe('literal: number value, not widened', () => {
  const pattern = literal(8);

  expect(pattern).isOfType<TheRule<8>>().equals<true>();
  expect(pattern).isOfType<TheRule<number>>().equals<false>();
});

describe('Array schema: union', () => {
  const pattern = [1, '2'];

  expect<Infer<typeof pattern>>().isOfType<(string | number)[]>().equals<true>();
});

describe('Array schema: tuple (as const)', () => {
  const pattern = [1, '2'] as const;

  expect<Infer<typeof pattern>>().isOfType<readonly [1, '2']>().equals<true>();
});

describe('Array schema: tuple const', () => {
  const pattern = tuple([1, { id: '2' }]);

  expect<Infer<typeof pattern>>().isOfType<[1, { id: '2' }]>().equals<true>();
});

describe('Array schema: tuple with as-const input keeps readonly', () => {
  const frozen = { id: '2' } as const;
  const pattern = tuple([1, frozen]);

  expect<Infer<typeof pattern>>().isOfType<[1, { readonly id: '2' }]>().equals<true>();
});

describe('Array schema: array const', () => {
  const pattern = array([1, literal('1'), { id: literal('2'), _id: 3 }]);

  expect<Infer<typeof pattern>>().isOfType<(1 | '1' | { id: '2'; _id: 3 })[]>().equals<true>();
});

describe('arrayOf: length', () => {
  const pattern = arrayOf(aString(), { length: 5 });

  expect(pattern).isOfType<TheRule<string[]>>().equals<true>();
});

describe('literal regexp', () => {
  const pattern = literal(/xxx/);

  expect(pattern).isOfType<TheRule<RegExp>>().equals<true>();
});

describe('arrayof regexp', () => {
  const pattern = arrayOf(/xxx/);

  expect(pattern).isOfType<TheRule<RegExp[]>>().equals<true>();
});

describe('regexp string', () => {
  const pattern = re(/xxx/);

  expect(pattern).isOfType<TheRule<string>>().equals<true>();
});

describe('arrayOf: allOf combinator', () => {
  const item = allOf(re(/^xxx/), re(/yyy$/));
  const pattern = arrayOf(item);

  expect(pattern).isOfType<TheRule<string[]>>().equals<true>();
});

describe('arrayOf: anyOf with mixed types', () => {
  const item = anyOf(aNumber(), '2' as const, new Date());
  const pattern = arrayOf(item);

  expect<typeof pattern>().isOfType<TheRule<(number | '2' | Date)[]>>().equals<true>();
  expect<typeof pattern>().isOfType<TheRule<(number | string | Date)[]>>().equals<false>();
});

describe('arrayOf: anyOf with primitives and boolean', () => {
  const pattern = arrayOf(anyOf(1, 2, 's', aBoolean(), 5));

  expect(pattern).isOfType<TheRule<(1 | 2 | 's' | boolean | 5)[]>>().equals<true>();
});

describe('tuple: mixed types', () => {
  const pattern = tuple([aNumber(), '2', 8, new Date()]);

  expect(pattern).isOfType<TheRule<[number, '2', 8, Date]>>().equals<true>();
});

describe('tuple: union type', () => {
  const pattern = tuple([aNumber(), '2', 8, new Date()]);

  expect(pattern).isOfType<TheRule<[number, '2', 8, Date]>>().equals<true>();
  expect(pattern).isOfType<TheRule<(number | string | Date)[]>>().equals<false>();
});

describe('tuple: literal numbers', () => {
  const pattern = tuple([1, 2, 3]);

  expect<Infer<typeof pattern>>().isOfType<[1, 2, 3]>().equals<true>();
  expect<Infer<typeof pattern>>().isOfType<[number, number, number]>().equals<false>();
});

describe('array: empty', () => {
  const pattern = array([]);

  expect(pattern).isOfType<TheRule<never[]>>().equals<true>();
});

describe('array: mixed values', () => {
  const pattern = array([1, 2, 3, 5, 's']);

  expect(pattern).isOfType<TheRule<(1 | 2 | 3 | 5 | 's')[]>>().equals<true>();
});

describe('anyOf: primitives and Date', () => {
  const pattern = anyOf('1', 5, aDate(), aNumber());

  expect<Infer<typeof pattern>>().isOfType<'1' | Date | number>().equals<true>();
});

describe('arrayOf: anyOf with primitives and Date', () => {
  const pattern = arrayOf(anyOf('1', 5, new Date()));

  expect(pattern).isOfType<TheRule<('1' | 5 | Date)[]>>().equals<true>();
});

describe('objectLike: with length property', () => {
  const pattern = objectLike({ length: 5 });

  expect(pattern).isOfType<TheRule<{ length: 5 }>>().equals<true>();
  expect(pattern).isOfType<TheRule<{ length: number }>>().equals<false>();
  expect(pattern).isOfType<TheRule<Array<any>>>().equals<false>();
});

describe('objectLike: type check', () => {
  const pattern = objectLike({ length: 5, message: [{ id: 1 }] });

  expect<Infer<typeof pattern>>().isOfType<{ length: 5; message: [{ id: 1 }] }>().equals<true>();
});

describe('objectLike: as const type check', () => {
  const pattern = objectLike({ length: 5 } as const);

  expect<Infer<typeof pattern>>().isOfType<{ length: number }>().equals<false>();
});

describe('record: with array property', () => {
  const pattern = {
    messages: [aNumber(), aString()],
  };

  expect<Infer<typeof pattern>>().isOfType<{ messages: (string | number)[] }>().equals<true>();
});

describe('record: with array property', () => {
  const pattern = {
    messages: array([aNumber(), aString()]),
  };

  expect<Infer<typeof pattern>>().isOfType<{ messages: (string | number)[] }>().equals<true>();
});

describe('record: with regexp property', () => {
  const pattern = {
    a: re(/xxx/),
  };

  expect<Infer<typeof pattern>>().isOfType<{ a: string }>().equals<true>();
});

describe('record: with arrayOf and anyOf', () => {
  const pattern = {
    a: arrayOf(anyOf(re(/xxx/), aNumber())),
  };

  expect<Infer<typeof pattern>>().isOfType<{ a: (string | number)[] }>().equals<true>();
});

describe('objectShape: string and number', () => {
  const pattern = objectShape({
    a: aString(),
    b: aNumber(),
  });

  expect(pattern).isOfType<TheRule<{ a: string; b: number }>>().equals<true>();
});

describe('objectShape: plain object', () => {
  const pattern = {
    a: aString(),
    b: aNumber(),
  };

  expect<Infer<typeof pattern>>().isOfType<{ a: string; b: number }>().equals<true>();
});

describe('objectShape: plain object', () => {
  const pattern = {
    a: 'test' as string,
    b: 6 as number,
  };

  expect<Infer<typeof pattern>>().isOfType<{ a: string; b: number }>().equals<true>();
});

describe('optional: string literal', () => {
  const pattern = optional('1' as const);

  expect(pattern).isOfType<TheRule<'1' | undefined>>().equals<true>();
});

describe('nullable: string literal', () => {
  const pattern = nullable('1' as const);

  expect(pattern).isOfType<TheRule<'1' | null>>().equals<true>();
  expect(pattern).isOfType<TheRule<'1'>>().equals<false>();
  expect(pattern).isOfType<TheRule<null>>().equals<false>();
});

describe('nullable: aString', () => {
  const pattern = nullable(aString());

  expect(pattern).isOfType<TheRule<string | null>>().equals<true>();
  expect(pattern).isOfType<TheRule<string>>().equals<false>();
});

describe('nullable: objectShape', () => {
  const pattern = nullable(
    objectShape({
      a: aString(),
    })
  );

  expect(pattern).isOfType<TheRule<{ a: string } | null>>().equals<true>();
});

describe('record: exact values', () => {
  const pattern = {
    a: aString(),
    b: 6,
    date: new Date(),
    array: ['1', '2'],
    boolean: true,
    null: null,
    undefined: undefined,
    record: {
      a: '8',
      b: 6,
      date: new Date(),
      array: ['1', '2'],
      boolean: true,
      null: null,
      undefined: undefined,
    },
  };

  expect<Infer<typeof pattern>>()
    .isOfType<{
      a: string;
      b: number;
      date: Date;
      array: string[];
      boolean: boolean;
      null: null;
      undefined: undefined;
      record: {
        a: string;
        b: number;
        date: Date;
        array: string[];
        boolean: boolean;
        null: null;
        undefined: undefined;
      };
    }>()
    .equals<true>();
});

describe('allOf: incompatible types', () => {
  const pattern = allOf(aString(), aNumber(), aDate());

  expect(pattern).isOfType<TheRule<never>>().equals<true>();
});

describe('allOf: string and regexp', () => {
  const pattern = allOf(aString(), re(/x/));

  expect(pattern).isOfType<TheRule<string>>().equals<true>();
});

describe('allOf: explicit objectShape', () => {
  const obj = {
    id: '1',
    name: '2',
    email: '3',
  } as const;
  const pattern = allOf(objectShape({ id: '1' }), objectShape({ name: '2' }), objectShape({ email: aString() }));

  expect(pattern)
    .isOfType<
      TheRule<
        {
          id: '1';
        } & {
          name: '2';
        } & { email: string }
      >
    >()
    .equals<true>();
  expect(pattern)
    .isOfType<
      TheRule<
        {
          id: string;
        } & {
          name: string;
        } & { email: string }
      >
    >()
    .equals<false>();
  expect(pattern)
    .isOfType<
      TheRule<{
        id: '1';
        name: '2';
        email: string;
      }>
    >()
    .equals<false>();
});

describe('allOf: combined with a nested nullable member', () => {
  const pattern = allOf({ id: '5' }, { email: 'a@gmail.com' }, nullable({ age: 8 }));

  expect(pattern).isOfType<TheRule<{ id: '5' } & { email: 'a@gmail.com' } & { age: 8 }>>().equals<true>();
  expect(pattern).isOfType<TheRule<never>>().equals<false>();
});

describe('allOf: objectShape vs plain object', () => {
  const pattern1 = allOf(objectShape({ id: '1' }), objectShape({ name: '2' }));
  const pattern2 = allOf(
    {
      id: '1',
    },
    {
      name: '2',
    }
  );

  expect<Infer<typeof pattern1>>().isOfType<Infer<typeof pattern2>>().equals<true>();
});

describe('allOf: objectShape as const vs plain object as const', () => {
  const pattern1 = allOf(objectShape({ id: '1' } as const), objectShape({ name: '2' } as const));
  const pattern2 = allOf(
    {
      id: '1',
    } as const,
    {
      name: '2',
    } as const
  );

  expect<Infer<typeof pattern1>>().isOfType<Infer<typeof pattern2>>().equals<true>();
});

describe('oneOf: object literals', () => {
  const pattern = oneOf({ id: '1' }, { name: '2' }, { email: '3' });

  expect<Infer<typeof pattern>>().isOfType<{ id: '1' } | { name: '2' } | { email: '3' }>().equals<true>();
  expect<Infer<typeof pattern>>()
    .isOfType<{ readonly id: '1' } | { readonly name: '2' } | { readonly email: '3' }>()
    .equals<false>();
});

describe('oneOf: primitives and combinators', () => {
  const a = aNumber();
  const b = aString();
  const pattern = oneOf('test', 5, a, b, new Date());

  expect(pattern).isOfType<TheRule<string | number | Date>>().equals<true>();
});

describe('anyOf: primitives, number, Date', () => {
  const pattern = anyOf(aString(), aNumber(), aDate());

  expect(pattern).isOfType<TheRule<string | number | Date>>().equals<true>();
});

describe('anyOf: object with regexp', () => {
  const pattern = anyOf({ id: re(/x/) }, { id: re(/y/) }, { id: re(/z/) });

  expect(pattern).isOfType<TheRule<{ id: string } | { id: string } | { id: string }>>().equals<true>();
  expect(pattern).isOfType<TheRule<{ readonly id: string }>>().equals<false>();
});

describe('anyOf: string, object, array', () => {
  const pattern = anyOf(aString(), { id: re(/x/) }, arrayOf(aString()));

  expect(pattern).isOfType<TheRule<string | { id: string } | string[]>>().equals<true>();
});

describe('anyOf: string literals', () => {
  const pattern = anyOf('1', '2', '3');

  expect(pattern).isOfType<TheRule<'1' | '2' | '3'>>().equals<true>();
});

describe('anyOf: object literals', () => {
  const pattern = anyOf({ id: '1' }, { name: '2' }, { email: '4' });

  expect<Infer<typeof pattern>>().isOfType<{ id: '1' } | { name: '2' } | { email: '4' }>().equals<true>();
});

describe('anyOf: object id union', () => {
  const pattern = anyOf({ id: '1' } as const, { id: '2' } as const, { id: '4' } as const);

  expect(pattern)
    .isOfType<TheRule<{ readonly id: '1' } | { readonly id: '2' } | { readonly id: '4' }>>()
    .equals<true>();
});

describe('anyOf: object id union as union type', () => {
  const pattern = anyOf({ id: '1' }, { id: '2' }, { id: '4' });

  expect<typeof pattern>().isOfType<TheRule<{ id: '1' } | { id: '2' } | { id: '4' }>>().equals<true>();
  expect<typeof pattern>().isOfType<TheRule<{ id: '1' | '2' | '5' }>>().equals<false>();
});

describe('instanceOf: Error', () => {
  const pattern = instanceOf(Error);

  expect(pattern).isOfType<TheRule<Error>>().equals<true>();
});

describe('instanceOf: Error with details', () => {
  const pattern = instanceOf(Error, { details: aString() });

  expect(pattern).isOfType<TheRule<Error & { details: string }>>().equals<true>();
});

describe('instanceOf: RegExp with source', () => {
  const pattern = instanceOf(RegExp, { source: 'xxx' });

  expect(pattern).isOfType<TheRule<RegExp & { source: string }>>().equals<true>();
});

describe('isPrototypedBy: TypeError', () => {
  const pattern = isPrototypedBy(TypeError);

  expect(pattern).isOfType<TheRule<TypeError>>().equals<true>();
});

describe('nullish: aString', () => {
  const pattern = nullish(aString());

  expect(pattern).isOfType<TheRule<string | null | undefined>>().equals<true>();
});

describe('predicate: function', () => {
  const pattern = (value: string): boolean => String(value).length === 0;
  type Pattern = Infer<typeof pattern>;

  expect<Pattern>().isOfType<never>().equals<true>();
});

describe('predicate: PredicateRule', () => {
  const pattern = predicate((value: string): boolean => String(value).length === 0);

  expect(pattern).isOfType<TheRule<string>>().equals<true>();
});

describe('predicate: in object', () => {
  const pattern = { id: predicate((value: string): boolean => String(value).length !== 0) };

  expect<Infer<typeof pattern>>().isOfType<{ id: string }>().equals<true>();
});

describe('predicate: in object', () => {
  const pattern = { id: (value: string): boolean => String(value).length !== 0 };
  type Pattern = Infer<typeof pattern>;

  expect<Pattern>().isOfType<{ id: never }>().equals<true>();
});

describe('validate: object and pattern', () => {
  const obj = {
    id: '1',
    email: ['2'],
    born: new Date(),
    mask: /x/,
  };
  const pattern = {
    email: arrayOf(aString()),
    born: aDate(),
    mask: re(/x/),
  };

  expect(validate(pattern, obj)).isOfType<ValidationResult<Infer<typeof pattern>>>().equals<true>();
});

describe('aString: with length option', () => {
  const pattern = aString({ length: 5 });

  expect(pattern).isOfType<TheRule<string>>().equals<true>();
});

describe('aString: distinguishable from other primitive types', () => {
  const pattern = aString();

  expect(pattern).isOfType<TheRule<string>>().equals<true>();
  expect(pattern).isOfType<TheRule<number>>().equals<false>();
});

describe('toFunction: converts an expression to a callable FunctionRule', () => {
  const pattern = toFunction(literal(8));

  expect(pattern).isOfType<FunctionRule<8>>().equals<true>();
});

describe('toFunction: the resulting callable narrows its parameter type', () => {
  const pattern = toFunction(oneOf('9', aNumber()));

  expect<Parameters<typeof pattern>[0]>().isOfType<'9' | number>().equals<true>();
});
