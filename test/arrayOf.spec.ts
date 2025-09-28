import { describe, it } from 'mocha';
import { aNumber, anyOf, anything, arrayOf, aString, literal, objectLike, predicate, validate } from '../src';
import { expect } from './@expect';

describe('arrayOf', () => {
  it('arrayOf with null values', () => {
    const schema = arrayOf(null);

    expect(validate(schema, [null])).to.match([true]);
    expect(validate(schema, [undefined])).to.match([false, `[0] expected null, got undefined`]);
    expect(validate(schema, null)).to.match([false, `expected array, got [object Null]`]);
  });

  it('arrayOf with string literals', () => {
    const literalSchema = arrayOf(literal('test'));
    const directStringSchema = arrayOf('test');

    expect(validate(literalSchema, ['test'])).to.match([true]);
    expect(validate(literalSchema, [5])).to.match([false, `[0] expected String test, got Number 5`]);
    expect(validate(directStringSchema, [5])).to.match([false, `[0] expected String test, got Number 5`]);
  });

  it('arrayOf with nested arrays', () => {
    const schema = arrayOf(arrayOf(aString()));

    expect(validate(schema, [['1'], ['2'], ['3']])).to.match([true]);
    expect(validate(schema, [[1, 2, 3]])).to.match([false, `[0] [0] expected a string, got [object Number]`]);
  });

  it('objectLike with length property (array-like objects)', () => {
    const schema = objectLike({ length: 2 });

    expect(validate(schema, function (a: any, b: any) {})).to.match([true]);
    expect(validate(schema, ['1', '2'])).to.match([true]);
    expect(validate(schema, 'xe')).to.match([true]);
    expect(validate(schema, { length: 2 })).to.match([true]);
    expect(validate(schema, [])).to.match([false, '[length] expected Number 2, got Number 0']);
    expect(validate(schema, null)).to.match([false, 'expected non null value, got null']);
    expect(validate(schema, { length: 4 })).to.match([false, '[length] expected Number 2, got Number 4']);
    expect(validate(schema, {})).to.match([false, '[length] expected Number 2, got undefined']);
  });

  it('arrayOf with anything rule', () => {
    const schema = arrayOf(anything());

    expect(validate(schema, ['1', '2'])).to.match([true]);
    expect(validate(schema, [1, 2])).to.match([true]);
    expect(validate(schema, [true, false])).to.match([true]);
    expect(validate(schema, [null, undefined])).to.match([true]);
    expect(validate(schema, [])).to.match([true]);
    expect(validate(schema, 'xe')).to.match([false, 'expected array, got [object String]']);
    expect(validate(schema, { length: 2 })).to.match([false, 'expected array, got [object Object]']);
    expect(validate(schema, null)).to.match([false, 'expected array, got [object Null]']);
    expect(validate(schema, undefined)).to.match([false, 'expected array, got [object Undefined]']);
    expect(validate(schema, {})).to.match([false, 'expected array, got [object Object]']);
    expect(validate(schema, 1)).to.match([false, 'expected array, got [object Number]']);
  });

  it('arrayOf with empty and multiple element arrays', () => {
    const schema = arrayOf(literal('test'));

    expect(validate(schema, [])).to.match([true]);
    expect(validate(schema, ['test', 'test', 'test'])).to.match([true]);
  });

  it('arrayOf with number literals', () => {
    const schema = arrayOf(42);

    expect(validate(schema, [42, 42, 42])).to.match([true]);
    expect(validate(schema, [42, 43, 42])).to.match([false, '[1] expected Number 42, got Number 43']);
  });

  it('arrayOf with undefined values', () => {
    const schema = arrayOf(undefined);

    expect(validate(schema, [undefined, undefined])).to.match([true]);
    expect(validate(schema, [undefined, null])).to.match([false, '[1] expected undefined, got null']);
  });

  it('arrayOf with predicate rule', () => {
    const schema = arrayOf(predicate((x: number) => typeof x === 'number' && x > 0));

    expect(validate(schema, [1, 2, 3, 4, 5])).to.match([true]);
    expect(validate(schema, [1, 2, 3, 4, 5, 'test'])).to.match([false, '[5] predicate failed for String test']);
  });

  it('arrayOf with object shapes', () => {
    const schema = arrayOf({ name: 'John', age: 30 });

    expect(
      validate(schema, [
        { name: 'John', age: 30 },
        { name: 'John', age: 30 },
      ])
    ).to.match([true]);
    expect(
      validate(schema, [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 30 },
      ])
    ).to.match([false, '[1] [name] expected String John, got String Jane']);
  });

  it('arrayOf with nested arrays (3D array)', () => {
    const schema = arrayOf(arrayOf(arrayOf('x')));

    expect(validate(schema, [[['x', 'x']], [['x']]])).to.match([true]);
    expect(validate(schema, [[['x', 'y']], [['x']]])).to.match([false, '[0] [0] [1] expected String x, got String y']);
  });

  it('arrayOf error reporting with large arrays', () => {
    const schema = arrayOf('correct');
    const testArray = new Array(100).fill('correct');
    testArray[99] = 'wrong';

    expect(validate(schema, testArray)).to.match([false, '[99] expected String correct, got String wrong']);
  });

  it('arrayOf with complex nested structure', () => {
    const schema = arrayOf(
      objectLike({
        id: aNumber(),
        data: arrayOf(objectLike({ value: 'test' })),
      })
    );

    const validData = [
      { id: 1, data: [{ value: 'test' }, { value: 'test' }] },
      { id: 2, data: [{ value: 'test' }] },
    ];

    const invalidData = [{ id: 1, data: [{ value: 'test' }, { value: 'wrong' }] }];

    expect(validate(schema, validData)).to.match([true]);
    expect(validate(schema, invalidData)).to.match([
      false,
      '[0] [data] [1] [value] expected String test, got String wrong',
    ]);
  });

  it('arrayOf with Symbol values', () => {
    const testSymbol = Symbol('test');
    const schema = arrayOf(testSymbol);

    expect(validate(schema, [testSymbol, testSymbol])).to.match([true]);
    expect(validate(schema, [testSymbol, Symbol('other')])).to.match([
      false,
      '[1] expected Symbol Symbol(test), got Symbol Symbol(other)',
    ]);
  });

  it('arrayOf error positioning at different indices', () => {
    const schema = arrayOf('valid');

    expect(validate(schema, ['invalid'])).to.match([false, '[0] expected String valid, got String invalid']);
    expect(validate(schema, ['valid', 'invalid'])).to.match([false, '[1] expected String valid, got String invalid']);
    expect(validate(schema, ['valid', 'valid', 'invalid'])).to.match([
      false,
      '[2] expected String valid, got String invalid',
    ]);
  });

  it('arrayOf with sparse arrays', () => {
    const schema = arrayOf(anyOf('test', undefined));
    const sparseArray = new Array(3);
    sparseArray[0] = 'test';
    sparseArray[2] = 'test';

    expect(validate(schema, sparseArray)).to.match([true]);
  });

  it('arrayOf performance with large arrays', () => {
    const schema = arrayOf('item');
    const largeArray = new Array(10000).fill('item');

    expect(validate(schema, largeArray)).to.match([true]);

    largeArray[9999] = 'wrong';
    expect(validate(schema, largeArray)).to.match([false, '[9999] expected String item, got String wrong']);
  });
});
