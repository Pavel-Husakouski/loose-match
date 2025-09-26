import { describe, it } from 'mocha';
import { anyOf, anything, arrayOf, objectLike, predicate, tuple, validate } from '../src';
import { expect } from './@expect';

describe('tuple', () => {
  it('tuple with single element', () => {
    const schema = tuple('test');

    expect(validate(schema, ['test'])).to.match([true]);
    expect(validate(schema, ['wrong'])).to.match([false, '[0] expected String test, got String wrong']);
    expect(validate(schema, [])).to.match([false, 'expected tuple of 1 items, got 0']);
    expect(validate(schema, ['test', 'extra'])).to.match([false, 'expected tuple of 1 items, got 2']);
  });

  it('tuple with multiple fixed elements', () => {
    const schema = tuple('first', 42, true);

    expect(validate(schema, ['first', 42, true])).to.match([true]);
    expect(validate(schema, ['wrong', 42, true])).to.match([false, '[0] expected String first, got String wrong']);
    expect(validate(schema, ['first', 43, true])).to.match([false, '[1] expected Number 42, got Number 43']);
    expect(validate(schema, ['first', 42, false])).to.match([false, '[2] expected Boolean true, got Boolean false']);
    expect(validate(schema, ['first', 42])).to.match([false, 'expected tuple of 3 items, got 2']);
    expect(validate(schema, ['first', 42, true, 'extra'])).to.match([false, 'expected tuple of 3 items, got 4']);
  });

  it('tuple with null and undefined values', () => {
    const schema = tuple(null, undefined);

    expect(validate(schema, [null, undefined])).to.match([true]);
    expect(validate(schema, [undefined, null])).to.match([false, '[0] expected null, got undefined']);
    expect(validate(schema, [null, null])).to.match([false, '[1] expected undefined, got null']);
  });

  it('tuple with literal rules', () => {
    const schema = tuple('test', 123);

    expect(validate(schema, ['test', 123])).to.match([true]);
    expect(validate(schema, ['test', 456])).to.match([false, '[1] expected Number 123, got Number 456']);
  });

  it('tuple with nested tuples', () => {
    const schema = tuple(tuple('x'), tuple(1, 2));

    expect(validate(schema, [['x'], [1, 2]])).to.match([true]);
    expect(validate(schema, [['y'], [1, 2]])).to.match([false, '[0] [0] expected String x, got String y']);
    expect(validate(schema, [['x'], [1, 3]])).to.match([false, '[1] [1] expected Number 2, got Number 3']);
    expect(validate(schema, [['x'], [1]])).to.match([false, '[1] expected tuple of 2 items, got 1']);
  });

  it('tuple with mixed tuple and array types', () => {
    const schema = tuple(tuple('a', 'b'), arrayOf('item'));

    expect(
      validate(schema, [
        ['a', 'b'],
        ['item', 'item'],
      ])
    ).to.match([true]);
    expect(validate(schema, [['a', 'c'], ['item']])).to.match([false, '[0] [1] expected String b, got String c']);
    expect(validate(schema, [['a', 'b'], ['wrong']])).to.match([
      false,
      '[1] [0] expected String item, got String wrong',
    ]);
  });

  it('tuple with object shapes', () => {
    const schema = tuple({ name: 'John' }, { age: 30 });

    expect(validate(schema, [{ name: 'John' }, { age: 30 }])).to.match([true]);
    expect(validate(schema, [{ name: 'Jane' }, { age: 30 }])).to.match([
      false,
      '[0] [name] expected String John, got String Jane',
    ]);
    expect(validate(schema, [{ name: 'John' }, { age: 25 }])).to.match([
      false,
      '[1] [age] expected Number 30, got Number 25',
    ]);
  });

  it('tuple with predicate rules', () => {
    const schema = tuple(
      predicate((x: number) => x > 0),
      predicate((x: string) => x.length > 2)
    );

    expect(validate(schema, [5, 'hello'])).to.match([true]);
    expect(validate(schema, [-1, 'hello'])).to.match([false, '[0] predicate failed for Number -1']);
    expect(validate(schema, [5, 'hi'])).to.match([false, '[1] predicate failed for String hi']);
  });

  it('tuple with mixed types', () => {
    const schema = tuple('string', 42, true, null, undefined, { key: 'value' });

    expect(validate(schema, ['string', 42, true, null, undefined, { key: 'value' }])).to.match([true]);
    expect(validate(schema, ['string', 42, true, null, undefined, { key: 'wrong' }])).to.match([
      false,
      '[5] [key] expected String value, got String wrong',
    ]);
  });

  it('tuple with non-array input', () => {
    const schema = tuple('test');

    expect(validate(schema, 'test')).to.match([false, 'expected tuple, got [object String]']);
    expect(validate(schema, null)).to.match([false, 'expected tuple, got [object Null]']);
    expect(validate(schema, undefined)).to.match([false, 'expected tuple, got [object Undefined]']);
    expect(validate(schema, {})).to.match([false, 'expected tuple, got [object Object]']);
    expect(validate(schema, 42)).to.match([false, 'expected tuple, got [object Number]']);
  });

  it('tuple with empty schema', () => {
    const schema = tuple();

    expect(validate(schema, [])).to.match([true]);
    expect(validate(schema, ['anything'])).to.match([false, 'expected tuple of 0 items, got 1']);
  });

  it('tuple error positioning at different indices', () => {
    const schema = tuple('a', 'b', 'c', 'd');

    expect(validate(schema, ['wrong', 'b', 'c', 'd'])).to.match([false, '[0] expected String a, got String wrong']);
    expect(validate(schema, ['a', 'wrong', 'c', 'd'])).to.match([false, '[1] expected String b, got String wrong']);
    expect(validate(schema, ['a', 'b', 'wrong', 'd'])).to.match([false, '[2] expected String c, got String wrong']);
    expect(validate(schema, ['a', 'b', 'c', 'wrong'])).to.match([false, '[3] expected String d, got String wrong']);
  });

  it('tuple length validation with various sizes', () => {
    const singleTuple = tuple('one');
    const pairTuple = tuple('first', 'second');
    const tripleTuple = tuple('a', 'b', 'c');

    expect(validate(singleTuple, ['one'])).to.match([true]);
    expect(validate(singleTuple, [])).to.match([false, 'expected tuple of 1 items, got 0']);
    expect(validate(singleTuple, ['one', 'two'])).to.match([false, 'expected tuple of 1 items, got 2']);

    expect(validate(pairTuple, ['first', 'second'])).to.match([true]);
    expect(validate(pairTuple, ['first'])).to.match([false, 'expected tuple of 2 items, got 1']);
    expect(validate(pairTuple, ['first', 'second', 'third'])).to.match([false, 'expected tuple of 2 items, got 3']);

    expect(validate(tripleTuple, ['a', 'b', 'c'])).to.match([true]);
    expect(validate(tripleTuple, ['a', 'b'])).to.match([false, 'expected tuple of 3 items, got 2']);
    expect(validate(tripleTuple, ['a', 'b', 'c', 'd'])).to.match([false, 'expected tuple of 3 items, got 4']);
  });

  it('tuple with complex nested structure', () => {
    const schema = tuple(
      { user: { name: 'John', age: 30 } },
      tuple('nested', 42),
      objectLike({ items: arrayOf('item') })
    );

    const validData = [{ user: { name: 'John', age: 30 } }, ['nested', 42], { items: ['item', 'item'] }];

    const invalidData1 = [{ user: { name: 'Jane', age: 30 } }, ['nested', 42], { items: ['item'] }];

    const invalidData2 = [{ user: { name: 'John', age: 30 } }, ['nested', 43], { items: ['item'] }];

    expect(validate(schema, validData)).to.match([true]);
    expect(validate(schema, invalidData1)).to.match([false, '[0] [user] [name] expected String John, got String Jane']);
    expect(validate(schema, invalidData2)).to.match([false, '[1] [1] expected Number 42, got Number 43']);
  });

  it('tuple type semantics vs array semantics', () => {
    const tupleSchema = tuple('a', 'b');
    const arraySchema = arrayOf(anyOf('a', 'b'));

    expect(validate(tupleSchema, ['a', 'b'])).to.match([true]);
    expect(validate(arraySchema, ['a', 'b'])).to.match([true]);
    expect(validate(arraySchema, ['b', 'a'])).to.match([true]);
    expect(validate(tupleSchema, ['b', 'a'])).to.match([false, '[0] expected String a, got String b']);
    expect(validate(arraySchema, ['a', 'b', 'a'])).to.match([true]);
    expect(validate(tupleSchema, ['a', 'b', 'a'])).to.match([false, 'expected tuple of 2 items, got 3']);
  });
});
