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
  isInstanceOf,
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
} from '../src';

describe('Type inference: primitives', () => {
  expectType<Infer<string>>().sameType<string>().is<true>();
  expectType<Infer<number>>().sameType<number>().is<true>();
  expectType<Infer<bigint>>().sameType<bigint>().is<true>();
  expectType<Infer<boolean>>().sameType<boolean>().is<true>();
  expectType<Infer<null>>().sameType<null>().is<true>();
  expectType<Infer<undefined>>().sameType<undefined>().is<true>();
  expectType<Infer<Date>>().sameType<Date>().is<true>();
  expectType<Infer<['1']>>().sameType<['1']>().is<true>();
  expectType<Infer<[]>>().sameType<[]>().is<true>();
  expectType<Infer<null[]>>().sameType<null[]>().is<true>();
  expectType<Infer<undefined[]>>().sameType<undefined[]>().is<true>();
  expectType<Infer<[null, undefined]>>().sameType<[null, undefined]>().is<true>();
  expectType<Infer<{ a: null; b: undefined }>>().sameType<{ a: null; b: undefined }>().is<true>();
  expectType<Infer<string | number | Date | boolean | null | undefined>>()
    .sameType<string | number | Date | boolean | null | undefined>()
    .is<true>();
});

describe('Type inference: FunctionRule', () => {
  expectType<Infer<FunctionRule<string>>>().sameType<string>().is<true>();
  expectType<Infer<FunctionRule<number>>>().sameType<number>().is<true>();
  expectType<Infer<FunctionRule<bigint>>>().sameType<bigint>().is<true>();
  expectType<Infer<FunctionRule<boolean>>>().sameType<boolean>().is<true>();
  expectType<Infer<FunctionRule<null>>>().sameType<null>().is<true>();
  expectType<Infer<FunctionRule<undefined>>>().sameType<undefined>().is<true>();
  expectType<Infer<FunctionRule<Date>>>().sameType<Date>().is<true>();
  expectType<Infer<FunctionRule<FunctionRule<RegExp>>>>().sameType<FunctionRule<RegExp>>().is<true>();
});

describe('Type inference: PredicateRule', () => {
  expectType<Infer<PredicateRule<string>>>().sameType<string>().is<true>();
  expectType<Infer<PredicateRule<number>>>().sameType<number>().is<true>();
  expectType<Infer<PredicateRule<bigint>>>().sameType<bigint>().is<true>();
  expectType<Infer<PredicateRule<boolean>>>().sameType<boolean>().is<true>();
  expectType<Infer<PredicateRule<null>>>().sameType<null>().is<true>();
  expectType<Infer<PredicateRule<undefined>>>().sameType<undefined>().is<true>();
  expectType<Infer<PredicateRule<Date>>>().sameType<Date>().is<true>();
});

describe('Type inference: array types', () => {
  expectType<Infer<any[]>>().sameType<any[]>().is<true>();
  expectType<Infer<string[]>>().sameType<string[]>().is<true>();
  expectType<Infer<number[]>>().sameType<number[]>().is<true>();
  expectType<Infer<bigint[]>>().sameType<bigint[]>().is<true>();
  expectType<Infer<boolean[]>>().sameType<boolean[]>().is<true>();
  expectType<Infer<null[]>>().sameType<null[]>().is<true>();
  expectType<Infer<undefined[]>>().sameType<undefined[]>().is<true>();
  expectType<Infer<Date[]>>().sameType<Date[]>().is<true>();
  expectType<Infer<FunctionRule<string>[]>>().sameType<string[]>().is<true>();
  expectType<Infer<PredicateRule<string>[]>>().sameType<string[]>().is<true>();
  expectType<Infer<SchemaRule<number>[]>>().sameType<number[]>().is<true>();
  expectType<Infer<ObjectRule<{ a: SchemaRule<string> }>[]>>().sameType<{ a: string }[]>().is<true>();
});

describe('Type inference: union and intersection', () => {
  expectType<Infer<FunctionRule<string> | FunctionRule<number> | PredicateRule<string[]>>>()
    .sameType<string | number | string[]>()
    .is<true>();
  expectType<InferIntersection<[{ id: string }, { email: string }]>>()
    .sameType<{ id: string; email: string }>()
    .is<true>();
  expectType<InferIntersection<[{ id: string }, { email: FunctionRule<string> }]>>()
    .sameType<{ id: string; email: string }>()
    .is<true>();
});

describe('Type inference: object types', () => {
  expectType<Infer<{ a: string; b: number; c: Date }>>().sameType<{ a: string; b: number; c: Date }>().is<true>();
});

describe('strictEqual', () => {
  const pattern = strictEqual(globalThis);

  expectType<typeof pattern>().sameType<FunctionRule<typeof globalThis>>().is<true>();
});

describe('literal: string value', () => {
  const pattern = literal('1');

  expectType<typeof pattern>().is<FunctionRule<'1'>>();
});

describe('literal: Date value', () => {
  const pattern = literal(new Date());

  expectType<typeof pattern>().is<FunctionRule<Date>>();
});

describe('Array schema: union', () => {
  const pattern = [1, '2'];

  expectType<Infer<typeof pattern>>().is<(string | number)[]>();
});

describe('Array schema: tuple (as const)', () => {
  const pattern = [1, '2'] as const;

  expectType<Infer<typeof pattern>>().is<[1, '2']>();
});

describe('arrayOf: allOf combinator', () => {
  const item = allOf(re(/^xxx/), re(/yyy$/));
  const pattern = arrayOf(item);

  expectType<typeof pattern>().is<FunctionRule<string[]>>();
});

describe('arrayOf: anyOf with mixed types', () => {
  const item = anyOf(aNumber(), '2', new Date());
  const pattern = arrayOf(item);

  expectType<typeof pattern>().is<FunctionRule<(number | '2' | Date)[]>>();
});

describe('arrayOf: anyOf with primitives and boolean', () => {
  const pattern = arrayOf(anyOf(1, 2, 's', aBoolean(), 5));

  expectType<typeof pattern>().is<FunctionRule<(1 | 2 | 5 | 's' | boolean)[]>>();
});

describe('tuple: mixed types', () => {
  const pattern = tuple([aNumber(), '2', 8, new Date()]);

  expectType<typeof pattern>().is<FunctionRule<[number, string, number, Date]>>();
});

describe('tuple: union type', () => {
  const pattern = tuple([aNumber(), '2', 8, new Date()]);

  expectType<typeof pattern>().is<FunctionRule<(number | string | Date)[]>>();
});

describe('tuple: literal numbers', () => {
  const pattern = tuple([1, 2, 3]);

  expectType<Infer<typeof pattern>>().sameType<[1, 2, 3]>().is<true>();
  expectType<Infer<typeof pattern>>().sameType<[number, number, number]>().is<false>();
});

describe('array: empty', () => {
  const pattern = array([]);

  expectType<typeof pattern>().is<FunctionRule<never[]>>();
});

describe('array: mixed values', () => {
  const pattern = array([1, 2, 3, 5, 's']);

  expectType<typeof pattern>().is<FunctionRule<(string | number)[]>>();
});

describe('anyOf: primitives and Date', () => {
  const pattern = anyOf('1', 5, aDate(), aNumber());

  expectType<Infer<typeof pattern>>().is<'1' | Date | number>();
});

describe('arrayOf: anyOf with primitives and Date', () => {
  const pattern = arrayOf(anyOf('1', 5, new Date()));

  expectType<typeof pattern>().is<FunctionRule<(string | Date | number)[]>>();
});

describe('objectLike: with length property', () => {
  const pattern = objectLike({ length: 5 });

  expectType<typeof pattern>().is<FunctionRule<Array<any>>>();
});

describe('objectLike: type check', () => {
  const pattern = objectLike({ length: 5 });

  expectType<Infer<typeof pattern>>().sameType<{ length: number }>().is<true>();
});

describe('objectLike: as const type check', () => {
  const pattern = objectLike({ length: 5 } as const);

  expectType<Infer<typeof pattern>>().sameType<{ length: number }>().is<false>();
});

describe('record: with array property', () => {
  const pattern = {
    messages: [aNumber(), aString()],
  };

  expectType<Infer<typeof pattern>>().is<{ messages: (string | number)[] }>();
});

describe('record: with regexp property', () => {
  const pattern = {
    a: re(/xxx/),
  };

  expectType<Infer<typeof pattern>>().is<{ a: string }>();
});

describe('record: with arrayOf and anyOf', () => {
  const pattern = {
    a: arrayOf(anyOf(re(/xxx/), aNumber())),
  };

  expectType<Infer<typeof pattern>>().is<{ a: (string | number)[] }>();
});

describe('objectShape: string and number', () => {
  const pattern = objectShape({
    a: aString(),
    b: aNumber(),
  });

  expectType<typeof pattern>().is<FunctionRule<{ a: string; b: number }>>();
});

describe('objectShape: plain object', () => {
  const pattern = {
    a: aString(),
    b: aNumber(),
  };

  expectType<Infer<typeof pattern>>().is<{ a: string; b: number }>();
});

describe('optional: string literal', () => {
  const pattern = optional('1' as const);

  expectType<typeof pattern>().is<FunctionRule<'1' | undefined>>();
});

describe('nullable: string literal', () => {
  const pattern = nullable('1' as const);

  expectType<typeof pattern>().is<FunctionRule<'1'>>();
});

describe('nullable: aString', () => {
  const pattern = nullable(aString());

  expectType<typeof pattern>().is<FunctionRule<string>>();
});

describe('nullable: aString (duplicate)', () => {
  const pattern = nullable(aString());

  expectType<typeof pattern>().is<FunctionRule<string>>();
});

describe('nullable: objectShape', () => {
  const pattern = nullable(
    objectShape({
      a: aString(),
    })
  );

  expectType<typeof pattern>().is<FunctionRule<{ a: string }>>();
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

  expectType<Infer<typeof pattern>>().is<{
    a: string;
    b: 6;
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
  }>();
});

describe('allOf: incompatible types', () => {
  const pattern = allOf(aString(), aNumber(), aDate());

  expectType<typeof pattern>().is<FunctionRule<never>>();
});

describe('allOf: string and regexp', () => {
  const pattern = allOf(aString(), re(/x/));

  expectType<typeof pattern>().is<FunctionRule<string>>();
});

describe('allOf: explicit objectShape', () => {
  const obj = {
    id: '1',
    name: '2',
    email: '3',
  };
  const pattern = allOf(objectShape({ id: '1' }), objectShape({ name: '2' }), objectShape({ email: aString() }));

  pattern(obj);

  expectType<typeof pattern>().is<
    FunctionRule<{
      id: string;
      name: string;
      email: string;
    }>
  >();
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

  expectType<Infer<typeof pattern1>>().sameType<Infer<typeof pattern2>>().is<true>();
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

  expectType<Infer<typeof pattern1>>().sameType<Infer<typeof pattern2>>().is<true>();
});

describe('oneOf: object literals', () => {
  const pattern = oneOf({ id: '1' }, { name: '2' }, { email: '3' });

  expectType<Infer<typeof pattern>>().sameType<{ id: string } | { name: string } | { email: string }>().is<true>();
  expectType<Infer<typeof pattern>>().sameType<{ id: '1' } | { name: '2' } | { email: '3' }>().is<false>();
});

describe('oneOf: primitives and combinators', () => {
  const a = aNumber();
  const b = aString();
  const pattern = oneOf('test', 5, a, b, new Date());

  expectType<typeof pattern>().is<FunctionRule<string | number | Date>>();
});

describe('anyOf: primitives, number, Date', () => {
  const pattern = anyOf(aString(), aNumber(), aDate());

  expectType<typeof pattern>().is<FunctionRule<string | number | Date>>();
});

describe('anyOf: object with regexp', () => {
  const pattern = anyOf({ id: re(/x/) }, { id: re(/y/) }, { id: re(/z/) });

  expectType<typeof pattern>().is<FunctionRule<{ id: string }>>();
});

describe('anyOf: string, object, array', () => {
  const pattern = anyOf(aString(), { id: re(/x/) }, arrayOf(aString()));

  expectType<typeof pattern>().is<FunctionRule<string | { id: string } | string[]>>();
});

describe('anyOf: string literals', () => {
  const pattern = anyOf('1', '2', '3');

  expectType<typeof pattern>().is<FunctionRule<string>>();
});

describe('anyOf: object literals', () => {
  const pattern = anyOf({ id: '1' }, { name: '2' }, { email: '4' });

  expectType<Infer<typeof pattern>>().sameType<{ id: string } | { name: string } | { email: string }>().is<true>();
  expectType<Infer<typeof pattern>>().sameType<{ id: '1' } | { name: '2' } | { email: '3' }>().is<false>();
});

describe('anyOf: object id union', () => {
  const pattern = anyOf({ id: '1' }, { id: '2' }, { id: '4' });

  expectType<typeof pattern>().is<
    FunctionRule<{
      id: '1' | '2' | '4';
    }>
  >();
});

describe('anyOf: object id union as union type', () => {
  const pattern = anyOf({ id: '1' }, { id: '2' }, { id: '4' });

  expectType<typeof pattern>().is<FunctionRule<{ id: '1' } | { id: '2' } | { id: '4' }>>();
});

describe('isInstanceOf: Error', () => {
  const pattern = isInstanceOf(Error);

  expectType<typeof pattern>().is<FunctionRule<Error>>();
});

describe('isInstanceOf: Error with details', () => {
  const pattern = isInstanceOf(Error, { details: aString() });

  expectType<typeof pattern>().is<FunctionRule<Error & { details: string }>>();
});

describe('isInstanceOf: RegExp with source', () => {
  const pattern = isInstanceOf(RegExp, { source: 'xxx' });

  expectType<typeof pattern>().is<FunctionRule<RegExp & { source: string }>>();
});

describe('nullish: aString', () => {
  const pattern = nullish(aString());

  expectType<typeof pattern>().is<FunctionRule<string | null | undefined>>();
});

describe('predicate: function', () => {
  const pattern = (value: string): boolean => String(value).length === 0;

  expectType<Infer<typeof pattern>>().is<string>();
});

describe('predicate: PredicateRule', () => {
  const pattern = predicate((value: string): boolean => String(value).length === 0);

  expectType<typeof pattern>().is<FunctionRule<string>>();
});

describe('predicate: in object', () => {
  const pattern = { id: predicate((value: string): boolean => String(value).length !== 0) };

  expectType<Infer<typeof pattern>>().is<{ id: string }>();
});

describe('validate: object and pattern', () => {
  const obj = {
    id: '1',
    email: ['2'],
    born: new Date(),
    mask: /x/,
  };
  const pattern = {
    id: aString(),
    email: arrayOf(aString()),
    born: aDate(),
    mask: re(/x/),
  };

  expectType(validate(pattern, obj)).is<ValidationResult<Infer<typeof pattern>>>();
});

export type SameType<B, A> = A extends B ? (B extends A ? true : false) : false;

export function expectType<A>(arg?: A): {
  is<X extends A>(): void;
  sameType<B>(): { is<Y extends SameType<A, B>>(): void };
} {
  return {
    is<X extends A>() {
      // do nothing
    },
    sameType<B>(): { is<Y extends SameType<A, B>>(): void } {
      return {
        is<Y extends SameType<A, B>>() {
          // do nothing
        },
      };
    },
  };
}
