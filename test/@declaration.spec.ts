import { describe, it } from 'mocha';
import {
  aBoolean,
  aDate,
  allOf,
  aNull,
  aNumber,
  anUndefined,
  anyOf,
  arrayOf,
  aString,
  ctorOf,
  equals,
  errorOf,
  exact,
  FunctionRule,
  Infer,
  instanceOf,
  isNull,
  noneOf,
  not,
  nullable,
  oneOf,
  PredicateRule,
  re,
  record,
  RecordRule,
  SchemaRule,
  tupleOf,
  validate,
  ValidationResult,
} from '../src';
import { expectType } from './@expect';

describe('type from', () => {
  expectType<Infer<RegExp>>().is<RegExp>();

  expectType<Infer<string>>().is<string>();

  expectType<Infer<number>>().is<number>();

  expectType<Infer<bigint>>().is<bigint>();

  expectType<Infer<boolean>>().is<boolean>();

  expectType<Infer<null>>().is<null>();

  expectType<Infer<undefined>>().is<undefined>();

  expectType<Infer<Date>>().is<Date>();

  expectType<Infer<RegExp[]>>().is<RegExp[]>();

  expectType<Infer<{ a: RegExp }>>().is<{ a: RegExp }>();

  expectType<Infer<['1']>>().is<['1']>();

  expectType<Infer<[]>>().is<[]>();

  expectType<Infer<[RegExp, string]>>().is<[RegExp, string]>();

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

  expectType<Infer<RegExp[]>>().is<RegExp[]>();

  expectType<Infer<FunctionRule<string>[]>>().is<string[]>();

  expectType<Infer<PredicateRule<string>[]>>().is<string[]>();

  expectType<Infer<SchemaRule<number>[]>>().is<number[]>();

  expectType<Infer<RecordRule<{ a: SchemaRule<string> }>[]>>().is<{ a: string }[]>();

  expectType<Infer<[RecordRule<{ a: SchemaRule<User> }>]>>().is<[{ a: User }]>();

  expectType<Infer<[{ a: SchemaRule<User> }]>>().is<[{ a: User }]>();

  expectType<Infer<[RecordRule<{ a: SchemaRule<User> }>, User, string]>>().is<[{ a: User }, User, string]>();

  expectType<Infer<FunctionRule<string> | FunctionRule<number> | PredicateRule<string[]>>>().is<
    string | number | string[]
  >();

  it('equals', () => {
    const pattern = equals(1);

    expectType<Infer<typeof pattern>>().is<1>();
  });

  it('exact', () => {
    const pattern = exact('1');

    expectType<Infer<typeof pattern>>().is<'1'>();
  });

  it('exact', () => {
    const pattern = exact('1');

    expectType<Infer<typeof pattern>>().is<'1'>();
  });

  it('arrayOf', () => {
    const pattern = [1, '2'];

    expectType<Infer<typeof pattern>>().is<(string | number)[]>();
  });

  it('arrayOf', () => {
    const item = allOf(re(/^xxx/), re(/yyy$/));
    const pattern = arrayOf(item);

    expectType<Infer<typeof pattern>>().is<string[]>();
  });

  it('arrayOf', () => {
    const item = anyOf(aNumber(), '2', new Date());
    const pattern = arrayOf(item);

    expectType<Infer<typeof pattern>>().is<(number | '2' | Date)[]>();
  });

  it('arrayOf', () => {
    const pattern = arrayOf(anyOf(1, 2, 's', aBoolean(), 5));

    expectType<Infer<typeof pattern>>().is<(1 | 2 | 5 | 's' | boolean)[]>();
  });

  it('tupleOf', () => {
    const pattern = tupleOf(aNumber(), '2', 8, new Date());

    expectType<typeof pattern>().is<FunctionRule<[number, string, number, Date]>>();
  });

  it('tupleOf', () => {
    const pattern = tupleOf(1, 2, 3, 5, 's');

    expectType<typeof pattern>().is<FunctionRule<(string | number)[]>>();
  });

  it('tupleOf', () => {
    const pattern = tupleOf(1, 2, 3, 5, 6);

    expectType<typeof pattern>().is<FunctionRule<[number, number, number, number, number]>>();
  });

  it('an enumeration', () => {
    const pattern = anyOf('1', 5, aDate(), aNumber());

    expectType<Infer<typeof pattern>>().is<'1' | Date | number>();
  });

  it('array of enum', () => {
    const pattern = arrayOf(anyOf('1', 5, new Date()));

    expectType<Infer<typeof pattern>>().is<(string | Date | number)[]>();
  });

  it('record with array', () => {
    const pattern = {
      messages: [aNumber(), aString()],
    };

    expectType<Infer<typeof pattern>>().is<{ messages: (string | number)[] }>();
  });

  it('record with regexp', () => {
    const pattern = {
      a: re(/xxx/),
    };

    expectType<Infer<typeof pattern>>().is<{ a: string }>();
  });

  it('list of regexps', () => {
    const pattern = {
      a: arrayOf(anyOf(/xxx/, '2')),
    };

    expectType<Infer<typeof pattern>>().is<{ a: (RegExp | string)[] }>();
  });

  it('list of regexp rules', () => {
    const pattern = {
      a: arrayOf(anyOf(re(/xxx/), aNumber())),
    };

    expectType<Infer<typeof pattern>>().is<{ a: (string | number)[] }>();
  });

  it('record', () => {
    const pattern = record({
      a: aString(),
      b: aNumber(),
    });

    expectType<Infer<typeof pattern>>().is<{ a: string; b: number }>();
  });

  it('nullable', () => {
    const pattern = nullable('1' as const);

    expectType<Infer<typeof pattern>>().is<'1'>();
  });

  it('nullable', () => {
    const pattern = nullable(aString());

    expectType<Infer<typeof pattern>>().is<string>();
  });

  it('nullable', () => {
    const pattern = nullable(aString());

    expectType<Infer<typeof pattern>>().is<string>();
  });

  it('nullable record', () => {
    const pattern = nullable(
      record({
        a: aString(),
      })
    );

    expectType<Infer<typeof pattern>>().is<{ a: string }>();
  });

  it('record with exact values', () => {
    const pattern = {
      a: aString(),
      b: 6,
      date: new Date(),
      array: ['1', '2'],
      boolean: true,
      null: null,
      undefined: undefined,
      regexp: /xxx/,
      record: {
        a: '8',
        b: 6,
        date: new Date(),
        array: ['1', '2'],
        boolean: true,
        null: null,
        undefined: undefined,
        regexp: /xxx/,
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
      regexp: RegExp;
      record: {
        a: string;
        b: number;
        date: Date;
        array: string[];
        boolean: boolean;
        null: null;
        undefined: undefined;
        regexp: RegExp;
      };
    }>();
  });

  it('allOf', () => {
    const pattern = allOf(aString(), aNumber(), aDate());

    expectType<Infer<typeof pattern>>().is<never>();
  });

  it('allOf', () => {
    const pattern = allOf(aString(), re(/x/));

    expectType<Infer<typeof pattern>>().is<string>();
  });

  it('allOf', () => {
    const obj = {
      id: '1',
      name: '2',
      email: '3',
    };
    const pattern = allOf(record({ id: '1' }), record({ name: '2' }), record({ email: aString() }));

    pattern(obj);

    expectType<Infer<typeof pattern>>().is<{
      id: string;
      name: string;
      email: string;
    }>();
  });

  it('noneOf', () => {
    const pattern = noneOf({ id: '1' }, { name: '2' }, { email: '3' });

    expectType<Infer<typeof pattern>>().is<never>();
  });

  it('oneOf', () => {
    const pattern = oneOf({ id: '1' }, { name: '2' }, { email: '3' });

    expectType<Infer<typeof pattern>>().is<{ id: '1' } | { name: '2' } | { email: '3' }>();
  });

  it('oneOf', () => {
    const a = aNumber();
    const b = aString();
    const pattern = oneOf('test', 5, a, b, new Date());

    expectType<Infer<typeof pattern>>().is<string | number | Date>();
  });

  it('not', () => {
    const pattern = oneOf({ id: '1' });

    expectType<Infer<typeof pattern>>().is<never>();
  });

  it('oneOf not', () => {
    const pattern = oneOf({ id: '1' }, not({ name: '2' }), { email: '3' });

    expectType<Infer<typeof pattern>>().is<{ id: '1' } | { email: '3' }>();
  });

  it('anyOf', () => {
    const pattern = anyOf(aString(), aNumber(), aDate());

    expectType<typeof pattern>().is<FunctionRule<string | number | Date>>();
  });

  it('anyOf', () => {
    const pattern = anyOf({ id: re(/x/) }, { id: re(/y/) }, { id: re(/z/) });

    expectType<typeof pattern>().is<FunctionRule<{ id: string }>>();
  });

  it('anyOf', () => {
    const pattern = anyOf(aString(), { id: re(/x/) }, arrayOf(aString()));

    expectType<Infer<typeof pattern>>().is<string | { id: string } | string[]>();
  });

  it('anyOf', () => {
    const pattern = anyOf('1', '2', '3');

    expectType<Infer<typeof pattern>>().is<string>();
  });

  it('anyOf', () => {
    const pattern = anyOf({ id: '1' }, { name: '2' }, { email: '4' });

    expectType<typeof pattern>().is<FunctionRule<{ id: '1' } | { name: '2' } | { email: '4' }>>();
  });

  it('anyOf', () => {
    const pattern = anyOf({ id: '1' }, { id: '2' }, { id: '4' });

    expectType<Infer<typeof pattern>>().is<{
      id: '1' | '2' | '4';
    }>();
  });

  it('anyOf', () => {
    const pattern = anyOf({ id: '1' }, { id: '2' }, { id: '4' });

    expectType<Infer<typeof pattern>>().is<{ id: '1' } | { id: '2' } | { id: '4' }>();
  });

  it('ctorOf', () => {
    const pattern = ctorOf(Date);

    expectType<Infer<typeof pattern>>().is<Date>();
  });

  it('instanceOf', () => {
    const pattern = instanceOf(Object);

    expectType<Infer<typeof pattern>>().is<Object>();
  });

  it('errorOf', () => {
    const pattern = errorOf({ message: 'a message' });

    expectType<Infer<typeof pattern>>().is<{ message: string }>();
  });

  it('errorOf', () => {
    const pattern = errorOf({ message: 'a message' });

    expectType<Infer<typeof pattern>>().is<Error>();
  });

  it('errorOf', () => {
    class MyError extends Error {
      code: number;

      constructor(message: string, code: number) {
        super(message);
        this.code = code;
      }
    }

    const pattern = errorOf({ message: 'a message', code: 5 }, MyError);

    expectType<Infer<typeof pattern>>().is<{ message: string; code: number }>();
  });

  it('isNull', () => {
    const pattern = isNull();

    expectType<Infer<typeof pattern>>().is<null>();
  });

  it('aNull', () => {
    const pattern = aNull();

    expectType<Infer<typeof pattern>>().is<null>();
  });

  it('anUndefined', () => {
    const pattern = anUndefined();

    expectType(pattern).is<FunctionRule<undefined>>();
  });

  it('validate', () => {
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
