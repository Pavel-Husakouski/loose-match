import { describe, it } from 'mocha';
import { array, arrayOf, objectLike, predicate, validate } from '../src';
import { expect } from './@expect';

describe('array', () => {
  it('array with single element', () => {
    const schema = array('test');

    expect(validate(schema, ['test'])).to.match([true]);
    expect(validate(schema, ['wrong'])).to.match([false, '[0] expected String test, got String wrong']);
    expect(validate(schema, [])).to.match([false, '[0] expected String test, got undefined']);
    expect(validate(schema, ['test', 'extra'])).to.match([false, 'expected array of 1 items, got 2']);
  });

  it('array with multiple fixed elements', () => {
    const schema = array('first', 42, true);

    expect(validate(schema, ['first', 42, true])).to.match([true]);
    expect(validate(schema, ['wrong', 42, true])).to.match([false, '[0] expected String first, got String wrong']);
    expect(validate(schema, ['first', 43, true])).to.match([false, '[1] expected Number 42, got Number 43']);
    expect(validate(schema, ['first', 42, false])).to.match([false, '[2] expected Boolean true, got Boolean false']);
    expect(validate(schema, ['first', 42])).to.match([false, '[2] expected Boolean true, got undefined']);
    expect(validate(schema, ['first', 42, true, 'extra'])).to.match([false, 'expected array of 3 items, got 4']);
  });

  it('array with null and undefined values', () => {
    const schema = array(null, undefined);

    expect(validate(schema, [null, undefined])).to.match([true]);
    expect(validate(schema, [undefined, null])).to.match([false, '[0] expected null, got undefined']);
    expect(validate(schema, [null, null])).to.match([false, '[1] expected undefined, got null']);
  });

  it('array with literal rules', () => {
    const schema = array('test', 123);

    expect(validate(schema, ['test', 123])).to.match([true]);
    expect(validate(schema, ['test', 456])).to.match([false, '[1] expected Number 123, got Number 456']);
  });

  it('array with nested arrays', () => {
    const schema = array(array('x'), array(1, 2));

    expect(validate(schema, [['x'], [1, 2]])).to.match([true]);
    expect(validate(schema, [['y'], [1, 2]])).to.match([false, '[0] [0] expected String x, got String y']);
    expect(validate(schema, [['x'], [1, 3]])).to.match([false, '[1] [1] expected Number 2, got Number 3']);
    expect(validate(schema, [['x'], [1]])).to.match([false, '[1] [1] expected Number 2, got undefined']);
  });

  it('array with object shapes', () => {
    const schema = array({ name: 'John' }, { age: 30 });

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

  it('array with predicate rules', () => {
    const schema = array(
      predicate((x: number) => x > 0),
      predicate((x: string) => x.length > 2)
    );

    expect(validate(schema, [5, 'hello'])).to.match([true]);
    expect(validate(schema, [-1, 'hello'])).to.match([false, '[0] predicate failed for Number -1']);
    expect(validate(schema, [5, 'hi'])).to.match([false, '[1] predicate failed for String hi']);
  });

  it('array with mixed types', () => {
    const schema = array('string', 42, true, null, undefined, { key: 'value' });

    expect(validate(schema, ['string', 42, true, null, undefined, { key: 'value' }])).to.match([true]);
    expect(validate(schema, ['string', 42, true, null, undefined, { key: 'wrong' }])).to.match([
      false,
      '[5] [key] expected String value, got String wrong',
    ]);
  });

  it('array with non-array input', () => {
    const schema = array('test');

    expect(validate(schema, 'test')).to.match([false, 'expected array, got [object String]']);
    expect(validate(schema, null)).to.match([false, 'expected array, got [object Null]']);
    expect(validate(schema, undefined)).to.match([false, 'expected array, got [object Undefined]']);
    expect(validate(schema, {})).to.match([false, 'expected array, got [object Object]']);
    expect(validate(schema, 42)).to.match([false, 'expected array, got [object Number]']);
  });

  it('array with empty schema', () => {
    const schema = array();

    expect(validate(schema, [])).to.match([true]);
    expect(validate(schema, ['anything'])).to.match([false, 'expected array of 0 items, got 1']);
  });

  it('array error positioning at different indices', () => {
    const schema = array('a', 'b', 'c', 'd');

    expect(validate(schema, ['wrong', 'b', 'c', 'd'])).to.match([false, '[0] expected String a, got String wrong']);
    expect(validate(schema, ['a', 'wrong', 'c', 'd'])).to.match([false, '[1] expected String b, got String wrong']);
    expect(validate(schema, ['a', 'b', 'wrong', 'd'])).to.match([false, '[2] expected String c, got String wrong']);
    expect(validate(schema, ['a', 'b', 'c', 'wrong'])).to.match([false, '[3] expected String d, got String wrong']);
  });

  it('array with complex nested structure', () => {
    const schema = array(
      { user: { name: 'John', age: 30 } },
      array('nested', 42),
      objectLike({ items: arrayOf('item') })
    );

    const validData = [{ user: { name: 'John', age: 30 } }, ['nested', 42], { items: ['item', 'item'] }];

    const invalidData1 = [{ user: { name: 'Jane', age: 30 } }, ['nested', 42], { items: ['item'] }];

    const invalidData2 = [{ user: { name: 'John', age: 30 } }, ['nested', 43], { items: ['item'] }];

    expect(validate(schema, validData)).to.match([true]);
    expect(validate(schema, invalidData1)).to.match([false, '[0] [user] [name] expected String John, got String Jane']);
    expect(validate(schema, invalidData2)).to.match([false, '[1] [1] expected Number 42, got Number 43']);
  });
});
