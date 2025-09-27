import { describe } from 'mocha';
import {
  aBoolean,
  aDate,
  allOf,
  aNullish,
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
  objectLike,
  ObjectRule,
  objectShape,
  oneOf,
  predicate,
  PredicateRule,
  re,
  SchemaRule,
  strictEqual,
  tuple,
  validate,
  ValidationResult,
} from '../src';
import { expectSameType, expectType } from './@expect';

describe('type from', () => {
  expectType<Infer<string>>().is<string>();

  expectType<Infer<number>>().is<number>();

  expectType<Infer<bigint>>().is<bigint>();

  expectType<Infer<boolean>>().is<boolean>();

  expectType<Infer<null>>().is<null>();

  expectType<Infer<undefined>>().is<undefined>();

  expectType<Infer<Date>>().is<Date>();

  expectType<Infer<['1']>>().is<['1']>();

  expectType<Infer<[]>>().is<[]>();

  expectType<Infer<null[]>>().is<null[]>();

  expectType<Infer<undefined[]>>().is<undefined[]>();

  expectType<Infer<[null, undefined]>>().is<[null, undefined]>();

  expectType<Infer<{ a: null; b: undefined }>>().is<{
    a: null;
    b: undefined;
  }>();

  expectType<Infer<string | number | Date | boolean | null | undefined>>().is<
    string | number | Date | boolean | null | undefined
  >();

  expectType<Infer<FunctionRule<string>>>().is<string>();

  expectType<Infer<FunctionRule<number>>>().is<number>();

  expectType<Infer<FunctionRule<bigint>>>().is<bigint>();

  expectType<Infer<FunctionRule<boolean>>>().is<boolean>();

  expectType<Infer<FunctionRule<null>>>().is<null>();

  expectType<Infer<FunctionRule<undefined>>>().is<undefined>();

  expectType<Infer<FunctionRule<Date>>>().is<Date>();

  expectType<Infer<FunctionRule<FunctionRule<RegExp>>>>().is<FunctionRule<RegExp>>();

  expectType<Infer<PredicateRule<string>>>().is<string>();

  expectType<Infer<PredicateRule<number>>>().is<number>();

  expectType<Infer<PredicateRule<bigint>>>().is<bigint>();

  expectType<Infer<PredicateRule<boolean>>>().is<boolean>();

  expectType<Infer<PredicateRule<null>>>().is<null>();

  expectType<Infer<PredicateRule<undefined>>>().is<undefined>();

  expectType<Infer<PredicateRule<Date>>>().is<Date>();

  expectType<Infer<any[]>>().is<any[]>();

  expectType<Infer<string[]>>().is<string[]>();

  expectType<Infer<number[]>>().is<number[]>();

  expectType<Infer<bigint[]>>().is<bigint[]>();

  expectType<Infer<boolean[]>>().is<boolean[]>();

  expectType<Infer<null[]>>().is<null[]>();

  expectType<Infer<undefined[]>>().is<undefined[]>();

  expectType<Infer<Date[]>>().is<Date[]>();

  expectType<Infer<FunctionRule<string>[]>>().is<string[]>();

  expectType<Infer<PredicateRule<string>[]>>().is<string[]>();

  expectType<Infer<SchemaRule<number>[]>>().is<number[]>();

  expectType<Infer<ObjectRule<{ a: SchemaRule<string> }>[]>>().is<{ a: string }[]>();

  expectType<Infer<FunctionRule<string> | FunctionRule<number> | PredicateRule<string[]>>>().is<
    string | number | string[]
  >();

  expectType<InferIntersection<[{ id: string }, { email: string }]>>().is<{ id: string; email: string }>();

  expectType<InferIntersection<[{ id: string }, { email: FunctionRule<string> }]>>().is<{
    id: string;
    email: string;
  }>();

  describe('equals', () => {
    const pattern = strictEqual(globalThis);

    expectType<typeof pattern>().is<FunctionRule<typeof globalThis>>();
  });

  describe('literal', () => {
    const pattern = literal('1');

    expectType<typeof pattern>().is<FunctionRule<'1'>>();
  });

  describe('literal', () => {
    const pattern = literal(new Date());

    expectType<typeof pattern>().is<FunctionRule<Date>>();
  });

  describe('array schema inference', () => {
    const pattern = [1, '2'];

    expectType<Infer<typeof pattern>>().is<(string | number)[]>();
  });

  describe('array schema inference', () => {
    const pattern = [1, '2'] as const;

    expectType<Infer<typeof pattern>>().is<[1, '2']>();
  });

  describe('arrayOf', () => {
    const item = allOf(re(/^xxx/), re(/yyy$/));
    const pattern = arrayOf(item);

    expectType<typeof pattern>().is<FunctionRule<string[]>>();
  });

  describe('arrayOf', () => {
    const item = anyOf(aNumber(), '2', new Date());
    const pattern = arrayOf(item);

    expectType<typeof pattern>().is<FunctionRule<(number | '2' | Date)[]>>();
  });

  describe('arrayOf', () => {
    const pattern = arrayOf(anyOf(1, 2, 's', aBoolean(), 5));

    expectType<typeof pattern>().is<FunctionRule<(1 | 2 | 5 | 's' | boolean)[]>>();
  });

  describe('tupleOf', () => {
    const pattern = tuple([aNumber(), '2', 8, new Date()]);

    expectType<typeof pattern>().is<FunctionRule<[number, string, number, Date]>>();
  });

  describe('tupleOf', () => {
    const pattern = tuple([aNumber(), '2', 8, new Date()]);

    expectType<typeof pattern>().is<FunctionRule<(number | string | Date)[]>>();
  });

  describe('tupleOf', () => {
    const pattern = tuple([1, 2, 3]);

    expectSameType<Infer<typeof pattern>, [1, 2, 3]>().is<true>();
    expectSameType<Infer<typeof pattern>, [number, number, number]>().is<false>();
  });

  describe('arrayWith', () => {
    const pattern = array();

    expectType<typeof pattern>().is<FunctionRule<never[]>>();
  });

  describe('arrayWith', () => {
    const pattern = array(1, 2, 3, 5, 's');

    expectType<typeof pattern>().is<FunctionRule<(string | number)[]>>();
  });

  describe('an enumeration', () => {
    const pattern = anyOf('1', 5, aDate(), aNumber());

    expectType<Infer<typeof pattern>>().is<'1' | Date | number>();
  });

  describe('array of enum', () => {
    const pattern = arrayOf(anyOf('1', 5, new Date()));

    expectType<typeof pattern>().is<FunctionRule<(string | Date | number)[]>>();
  });

  describe('shape', () => {
    const pattern = objectLike({ length: 5 });

    expectType<typeof pattern>().is<FunctionRule<Array<any>>>();
  });

  describe('shape', () => {
    const pattern = objectLike({ length: 5 });

    expectSameType<Infer<typeof pattern>, { length: number }>().is<true>();
  });

  describe('shape const', () => {
    const pattern = objectLike({ length: 5 } as const);

    expectSameType<Infer<typeof pattern>, { length: number }>().is<false>();
  });

  describe('record with array', () => {
    const pattern = {
      messages: [aNumber(), aString()],
    };

    expectType<Infer<typeof pattern>>().is<{ messages: (string | number)[] }>();
  });

  describe('record with regexp', () => {
    const pattern = {
      a: re(/xxx/),
    };

    expectType<Infer<typeof pattern>>().is<{ a: string }>();
  });

  describe('list of regexp rules', () => {
    const pattern = {
      a: arrayOf(anyOf(re(/xxx/), aNumber())),
    };

    expectType<Infer<typeof pattern>>().is<{ a: (string | number)[] }>();
  });

  describe('objectWith', () => {
    const pattern = objectShape({
      a: aString(),
      b: aNumber(),
    });

    expectType<typeof pattern>().is<FunctionRule<{ a: string; b: number }>>();
  });

  describe('objectWith', () => {
    const pattern = {
      a: aString(),
      b: aNumber(),
    };

    expectType<Infer<typeof pattern>>().is<{ a: string; b: number }>();
  });

  describe('nullable', () => {
    const pattern = nullable('1' as const);

    expectType<typeof pattern>().is<FunctionRule<'1'>>();
  });

  describe('nullable', () => {
    const pattern = nullable(aString());

    expectType<typeof pattern>().is<FunctionRule<string>>();
  });

  describe('nullable', () => {
    const pattern = nullable(aString());

    expectType<typeof pattern>().is<FunctionRule<string>>();
  });

  describe('nullable record', () => {
    const pattern = nullable(
      objectShape({
        a: aString(),
      })
    );

    expectType<typeof pattern>().is<FunctionRule<{ a: string }>>();
  });

  describe('record with exact values', () => {
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

  describe('allOf', () => {
    const pattern = allOf(aString(), aNumber(), aDate());

    expectType<typeof pattern>().is<FunctionRule<never>>();
  });

  describe('allOf', () => {
    const pattern = allOf(aString(), re(/x/));

    expectType<typeof pattern>().is<FunctionRule<string>>();
  });

  describe('allOf objectWith', () => {
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

  describe('allOf', () => {
    const pattern = allOf(
      {
        a: aString(),
      },
      {
        b: aNumber(),
      }
    );

    expectType<typeof pattern>().is<FunctionRule<{ a: string; b: number }>>();
    expectType<typeof pattern>().is<FunctionRule<{ a: string } & { b: number }>>();
  });

  describe('oneOf', () => {
    const pattern = oneOf({ id: '1' }, { name: '2' }, { email: '3' });

    expectType<typeof pattern>().is<FunctionRule<{ id: '1' } | { name: '2' } | { email: '3' }>>();
  });

  describe('oneOf', () => {
    const a = aNumber();
    const b = aString();
    const pattern = oneOf('test', 5, a, b, new Date());

    expectType<typeof pattern>().is<FunctionRule<string | number | Date>>();
  });

  describe('anyOf', () => {
    const pattern = anyOf(aString(), aNumber(), aDate());

    expectType<typeof pattern>().is<FunctionRule<string | number | Date>>();
  });

  describe('anyOf', () => {
    const pattern = anyOf({ id: re(/x/) }, { id: re(/y/) }, { id: re(/z/) });

    expectType<typeof pattern>().is<FunctionRule<{ id: string }>>();
  });

  describe('anyOf', () => {
    const pattern = anyOf(aString(), { id: re(/x/) }, arrayOf(aString()));

    expectType<typeof pattern>().is<FunctionRule<string | { id: string } | string[]>>();
  });

  describe('anyOf', () => {
    const pattern = anyOf('1', '2', '3');

    expectType<typeof pattern>().is<FunctionRule<string>>();
  });

  describe('anyOf', () => {
    const pattern = anyOf({ id: '1' }, { name: '2' }, { email: '4' });

    expectType<typeof pattern>().is<FunctionRule<{ id: '1' } | { name: '2' } | { email: '4' }>>();
  });

  describe('anyOf', () => {
    const pattern = anyOf({ id: '1' }, { id: '2' }, { id: '4' });

    expectType<typeof pattern>().is<
      FunctionRule<{
        id: '1' | '2' | '4';
      }>
    >();
  });

  describe('anyOf', () => {
    const pattern = anyOf({ id: '1' }, { id: '2' }, { id: '4' });

    expectType<typeof pattern>().is<FunctionRule<{ id: '1' } | { id: '2' } | { id: '4' }>>();
  });

  describe('instanceOf', () => {
    const pattern = isInstanceOf(Error);

    expectType<typeof pattern>().is<FunctionRule<Error>>();
  });

  describe('instanceOf', () => {
    const pattern = isInstanceOf(Error, { details: aString() });

    expectType<typeof pattern>().is<FunctionRule<Error & { details: string }>>();
  });

  describe('instanceOf', () => {
    const pattern = isInstanceOf(RegExp, { source: 'xxx' });

    expectType<typeof pattern>().is<FunctionRule<RegExp & { source: string }>>();
  });

  describe('nullish', () => {
    const pattern = aNullish();

    expectType<typeof pattern>().is<FunctionRule<null | undefined>>();
  });

  describe('nullish', () => {
    const pattern = aNullish<string>();

    expectType<typeof pattern>().is<FunctionRule<string | null | undefined>>();
  });

  describe('predicate', () => {
    const pattern = (value: string): boolean => String(value).length === 0;

    expectType<Infer<typeof pattern>>().is<string>();
  });

  describe('predicate', () => {
    const pattern = predicate((value: string): boolean => String(value).length === 0);

    expectType<typeof pattern>().is<FunctionRule<string>>();
  });

  describe('predicate', () => {
    const pattern = { id: predicate((value: string): boolean => String(value).length !== 0) };

    expectType<Infer<typeof pattern>>().is<{ id: string }>();
  });

  describe('validate', () => {
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
});

interface User {
  id: string;
  email: string[];
  born: Date;
  mask: RegExp;
}
