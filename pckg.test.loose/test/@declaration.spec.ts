import { describe } from 'mocha';
import {
  aBoolean,
  aDate,
  allOf,
  aNumber,
  anyOf,
  array,
  arrayOf,
  aString,
  FunctionRule,
  Infer,
  InferIntersection,
  instanceOf,
  literal,
  nullable,
  nullish,
  objectLike,
  ObjectRule,
  objectShape,
  oneOf,
  optional,
  predicate,
  PredicateRule,
  re,
  SchemaRule,
  strictEqual,
  tuple,
  validate,
  ValidationResult,
} from '@beeff/loose-match';

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

describe('Type inference: FunctionRule', () => {
  expect<Infer<FunctionRule<string>>>().isOfType<string>().equals<true>();
  expect<Infer<FunctionRule<number>>>().isOfType<number>().equals<true>();
  expect<Infer<FunctionRule<bigint>>>().isOfType<bigint>().equals<true>();
  expect<Infer<FunctionRule<boolean>>>().isOfType<boolean>().equals<true>();
  expect<Infer<FunctionRule<null>>>().isOfType<null>().equals<true>();
  expect<Infer<FunctionRule<undefined>>>().isOfType<undefined>().equals<true>();
  expect<Infer<FunctionRule<Date>>>().isOfType<Date>().equals<true>();
  expect<Infer<FunctionRule<FunctionRule<RegExp>>>>().isOfType<FunctionRule<RegExp>>().equals<true>();
});

describe('Type inference: PredicateRule', () => {
  expect<Infer<PredicateRule<string>>>().isOfType<string>().equals<true>();
  expect<Infer<PredicateRule<number>>>().isOfType<number>().equals<true>();
  expect<Infer<PredicateRule<bigint>>>().isOfType<bigint>().equals<true>();
  expect<Infer<PredicateRule<boolean>>>().isOfType<boolean>().equals<true>();
  expect<Infer<PredicateRule<null>>>().isOfType<null>().equals<true>();
  expect<Infer<PredicateRule<undefined>>>().isOfType<undefined>().equals<true>();
  expect<Infer<PredicateRule<Date>>>().isOfType<Date>().equals<true>();
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
  expect<Infer<FunctionRule<string>[]>>().isOfType<string[]>().equals<true>();
  expect<Infer<PredicateRule<string>[]>>().isOfType<string[]>().equals<true>();
  expect<Infer<SchemaRule<number>[]>>().isOfType<number[]>().equals<true>();
  expect<Infer<ObjectRule<{ a: SchemaRule<string> }>[]>>().isOfType<{ a: string }[]>().equals<true>();
});

describe('Type inference: union and intersection', () => {
  expect<Infer<FunctionRule<string> | FunctionRule<number> | PredicateRule<string[]>>>()
    .isOfType<string | number | string[]>()
    .equals<true>();
  expect<InferIntersection<[{ id: string }, { email: string }]>>()
    .isOfType<{ id: string; email: string }>()
    .equals<true>();
  expect<InferIntersection<[{ id: string }, { email: FunctionRule<string> }]>>()
    .isOfType<{ id: string; email: string }>()
    .equals<true>();
});

describe('Type inference: object types', () => {
  expect<Infer<{ a: string; b: number; c: Date }>>().isOfType<{ a: string; b: number; c: Date }>().equals<true>();
});

describe('Type inference: complex type object', () => {
  expect<Infer<{ messages: (FunctionRule<string> | FunctionRule<number>)[] }>>()
    .isOfType<{ messages: (string | number)[] }>()
    .equals<true>();
});

describe('Type inference: complex type object', () => {
  expect<Infer<{ messages: (FunctionRule<{ id: string }> | FunctionRule<{ email: string }>)[] }>>()
    .isOfType<{ messages: ({ id: string } | { email: string })[] }>()
    .equals<true>();
});

describe('strictEqual', () => {
  const pattern = strictEqual(globalThis);

  expect(pattern).isOfType<FunctionRule<typeof globalThis>>().equals<true>();
});

describe('literal: string value', () => {
  const pattern = literal('1');

  expect(pattern).isOfType<FunctionRule<'1'>>().equals<true>();
});

describe('literal: Date value', () => {
  const pattern = literal(new Date());

  expect(pattern).isOfType<FunctionRule<Date>>().equals<true>();
});

describe('Array schema: union', () => {
  const pattern = [1, '2'];

  expect<Infer<typeof pattern>>().isOfType<(string | number)[]>().equals<true>();
});

describe('Array schema: tuple (as const)', () => {
  const pattern = [1, '2'] as const;

  expect<Infer<typeof pattern>>().isOfType<readonly [1, '2']>().equals<true>();
});

describe('arrayOf: allOf combinator', () => {
  const item = allOf(re(/^xxx/), re(/yyy$/));
  const pattern = arrayOf(item);

  expect(pattern).isOfType<FunctionRule<string[]>>().equals<true>();
});

describe('arrayOf: anyOf with mixed types', () => {
  const item = anyOf(aNumber(), '2' as const, new Date());
  const pattern = arrayOf(item);

  expect<typeof pattern>().isOfType<FunctionRule<(number | '2' | Date)[]>>().equals<true>();
  expect<typeof pattern>().isOfType<FunctionRule<(number | string | Date)[]>>().equals<true>();
});

describe('arrayOf: anyOf with primitives and boolean', () => {
  const pattern = arrayOf(anyOf(1, 2, 's', aBoolean(), 5));

  expect(pattern).isOfType<FunctionRule<(string | number | boolean)[]>>().equals<true>();
});

describe('tuple: mixed types', () => {
  const pattern = tuple([aNumber(), '2', 8, new Date()]);

  expect(pattern).isOfType<FunctionRule<[number, '2', 8, Date]>>().equals<true>();
});

describe('tuple: union type', () => {
  const pattern = tuple([aNumber(), '2', 8, new Date()]);

  expect(pattern).isOfType<FunctionRule<[number, '2', 8, Date]>>().equals<true>();
  expect(pattern).isOfType<FunctionRule<(number | string | Date)[]>>().equals<true>();
});

describe('tuple: literal numbers', () => {
  const pattern = tuple([1, 2, 3]);

  expect<Infer<typeof pattern>>().isOfType<[1, 2, 3]>().equals<true>();
  expect<Infer<typeof pattern>>().isOfType<[number, number, number]>().equals<false>();
});

describe('array: empty', () => {
  const pattern = array([]);

  expect(pattern).isOfType<FunctionRule<never[]>>().equals<true>();
});

describe('array: mixed values', () => {
  const pattern = array([1, 2, 3, 5, 's']);

  expect(pattern).isOfType<FunctionRule<(string | number)[]>>().equals<true>();
});

describe('anyOf: primitives and Date', () => {
  const pattern = anyOf('1', 5, aDate(), aNumber());

  expect<Infer<typeof pattern>>().isOfType<'1' | Date | number>().equals<true>();
});

describe('arrayOf: anyOf with primitives and Date', () => {
  const pattern = arrayOf(anyOf('1', 5, new Date()));

  expect(pattern).isOfType<FunctionRule<(string | Date | number)[]>>().equals<true>();
});

describe('objectLike: with length property', () => {
  const pattern = objectLike({ length: 5 });

  expect(pattern).isOfType<FunctionRule<{ length: number }>>().equals<true>();
  expect(pattern).isOfType<FunctionRule<Array<any>>>().equals<true>();
});

describe('objectLike: type check', () => {
  const pattern = objectLike({ length: 5 });

  expect<Infer<typeof pattern>>().isOfType<{ length: number }>().equals<true>();
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

  expect(pattern).isOfType<FunctionRule<{ a: string; b: number }>>().equals<true>();
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

  expect(pattern).isOfType<FunctionRule<'1' | undefined>>().equals<true>();
});

describe('nullable: string literal', () => {
  const pattern = nullable('1' as const);

  expect(pattern).isOfType<FunctionRule<'1'>>().equals<true>();
});

describe('nullable: aString', () => {
  const pattern = nullable(aString());

  expect(pattern).isOfType<FunctionRule<string>>().equals<true>();
});

describe('nullable: objectShape', () => {
  const pattern = nullable(
    objectShape({
      a: aString(),
    })
  );

  expect(pattern).isOfType<FunctionRule<{ a: string }>>().equals<true>();
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

  expect(pattern).isOfType<FunctionRule<never>>().equals<true>();
});

describe('allOf: string and regexp', () => {
  const pattern = allOf(aString(), re(/x/));

  expect(pattern).isOfType<FunctionRule<string>>().equals<true>();
});

describe('allOf: explicit objectShape', () => {
  const obj = {
    id: '1',
    name: '2',
    email: '3',
  };
  const pattern = allOf(objectShape({ id: '1' }), objectShape({ name: '2' }), objectShape({ email: aString() }));

  pattern(obj);

  expect(pattern)
    .isOfType<
      FunctionRule<{
        id: string;
        name: string;
        email: string;
      }>
    >()
    .equals<true>();
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

  expect<Infer<typeof pattern>>().isOfType<{ id: string } | { name: string } | { email: string }>().equals<true>();
  expect<Infer<typeof pattern>>().isOfType<{ id: '1' } | { name: '2' } | { email: '3' }>().equals<false>();
});

describe('oneOf: primitives and combinators', () => {
  const a = aNumber();
  const b = aString();
  const pattern = oneOf('test', 5, a, b, new Date());

  expect(pattern).isOfType<FunctionRule<string | number | Date>>().equals<true>();
});

describe('anyOf: primitives, number, Date', () => {
  const pattern = anyOf(aString(), aNumber(), aDate());

  expect(pattern).isOfType<FunctionRule<string | number | Date>>().equals<true>();
});

describe('anyOf: object with regexp', () => {
  const pattern = anyOf({ id: re(/x/) }, { id: re(/y/) }, { id: re(/z/) });

  expect(pattern).isOfType<FunctionRule<{ id: string }>>().equals<true>();
});

describe('anyOf: string, object, array', () => {
  const pattern = anyOf(aString(), { id: re(/x/) }, arrayOf(aString()));

  expect(pattern).isOfType<FunctionRule<string | { id: string } | string[]>>().equals<true>();
});

describe('anyOf: string literals', () => {
  const pattern = anyOf('1', '2', '3');

  expect(pattern).isOfType<FunctionRule<string>>().equals<true>();
});

describe('anyOf: object literals', () => {
  const pattern = anyOf({ id: '1' }, { name: '2' }, { email: '4' });

  expect<Infer<typeof pattern>>().isOfType<{ id: string } | { name: string } | { email: string }>().equals<true>();
  expect<Infer<typeof pattern>>().isOfType<{ id: '1' } | { name: '2' } | { email: '3' }>().equals<false>();
});

describe('anyOf: object id union', () => {
  const pattern = anyOf({ id: '1' } as const, { id: '2' } as const, { id: '4' } as const);

  expect(pattern).isOfType<FunctionRule<{ id: '1' | '2' | '4' }>>().equals<true>();
  expect(pattern).isOfType<FunctionRule<{ id: '1' } | { id: '2' } | { id: '4' }>>().equals<true>();
});

describe('anyOf: object id union as union type', () => {
  const pattern = anyOf({ id: '1' as const }, { id: '2' as const }, { id: '4' as const });

  expect<typeof pattern>().isOfType<FunctionRule<{ id: '1' | '2' | '4' }>>().equals<true>();
  expect<typeof pattern>().isOfType<FunctionRule<{ id: '1' | '2' | '5' }>>().equals<false>();
});

describe('instanceOf: Error', () => {
  const pattern = instanceOf(Error);

  expect(pattern).isOfType<FunctionRule<Error>>().equals<true>();
});

describe('instanceOf: Error with details', () => {
  const pattern = instanceOf(Error, { details: aString() });

  expect(pattern).isOfType<FunctionRule<Error & { details: string }>>().equals<true>();
});

describe('instanceOf: RegExp with source', () => {
  const pattern = instanceOf(RegExp, { source: 'xxx' });

  expect(pattern).isOfType<FunctionRule<RegExp & { source: string }>>().equals<true>();
});

describe('nullish: aString', () => {
  const pattern = nullish(aString());

  expect(pattern).isOfType<FunctionRule<string | null | undefined>>().equals<true>();
});

describe('predicate: function', () => {
  const pattern = (value: string): boolean => String(value).length === 0;

  expect<Infer<typeof pattern>>().isOfType<string>().equals<true>();
});

describe('predicate: PredicateRule', () => {
  const pattern = predicate((value: string): boolean => String(value).length === 0);

  expect(pattern).isOfType<FunctionRule<string>>().equals<true>();
});

describe('predicate: in object', () => {
  const pattern = { id: predicate((value: string): boolean => String(value).length !== 0) };

  expect<Infer<typeof pattern>>().isOfType<{ id: string }>().equals<true>();
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

type SameType<B, A> = A extends B ? (B extends A ? true : false) : false;

function expect<A>(arg?: A): {
  isOfType<B>(): { equals<Y extends SameType<A, B>>(): void };
} {
  return {
    isOfType<B>(): { equals<Y extends SameType<A, B>>(): void } {
      return {
        equals<Y extends SameType<A, B>>() {
          // do nothing
        },
      };
    },
  };
}
