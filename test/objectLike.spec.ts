import { arrayOf, aString, isInstanceOf, nullable, objectLike, strictEqual, validate } from '../src';
import { expect } from './@expect';

describe('objectLike', () => {
  it('validation with null input', () => {
    const schema = objectLike({
      test: 'a test',
    });

    expect(validate(schema, null)).to.match([false, 'expected non null value, got null']);
  });

  it('validates string with length property', () => {
    const schema = objectLike({ length: 2 });

    expect(validate(schema, 'xe')).to.match([true]);
  });

  it('fails when string length property mismatches', () => {
    const schema = objectLike({ length: 2 });

    expect(validate(schema, 'xexe')).to.match([false, '[length] expected Number 2, got Number 4']);
  });

  it('fails when object lacks required property', () => {
    const schema = objectLike({ length: 2 });

    expect(validate(schema, 5)).to.match([false, '[length] expected Number 2, got undefined']);
  });

  it('validates array constructor property', () => {
    const schema = objectLike({ constructor: strictEqual(Array) });

    expect(validate(schema, [])).to.match([true]);
  });

  it('constructor property Function', () => {
    const schema = objectLike({ constructor: isInstanceOf(Function) });

    expect(validate(schema, function () {})).to.match([true]);
  });

  it('fails when constructor property mismatches', () => {
    const schema = objectLike({ constructor: strictEqual(Array) });

    expect(validate(schema, function () {})).to.match([
      false,
      '[constructor] expected strict equals function Array, got function Function',
    ]);
  });

  it('validates function with length property', () => {
    const schema = objectLike({ length: 2 });

    expect(validate(schema, function (a: any, b: any) {})).to.match([true]);
  });

  it('validates object with nullable property', () => {
    const schema = objectLike({
      id: 9,
      title: nullable(3),
      items: [1, 2, 3, '4'],
    });

    expect(
      validate(schema, {
        id: 9,
        items: [1, 2, 3, '4'],
      })
    ).to.match([true]);
  });

  it('fails with invalid nested array property', () => {
    const schema = objectLike({
      id: 9,
      title: nullable(arrayOf(aString())),
      items: [1, 2, 3, '4'],
    });

    expect(
      validate(schema, {
        id: 9,
        title: ['3', new Date()],
        items: [1, 2, 3, '4'],
      })
    ).to.match([false, '[title] [1] expected a string, got [object Date]']);
  });

  it('validation with undefined input', () => {
    const schema = objectLike({ test: 'value' });

    expect(validate(schema, undefined)).to.match([false, 'expected non null value, got undefined']);
  });

  it('validates Date object with getTime method', () => {
    const schema = objectLike({ getTime: strictEqual(Date.prototype.getTime) });
    const date = new Date();

    expect(validate(schema, date)).to.match([true]);
  });

  it('validates RegExp object with source property', () => {
    const schema = objectLike({ source: 'test', flags: 'g' });
    const regex = /test/g;

    expect(validate(schema, regex)).to.match([true]);
  });

  it('validates Error object with message property', () => {
    const schema = objectLike({ message: 'error message', name: 'Error' });
    const error = new Error('error message');

    expect(validate(schema, error)).to.match([true]);
  });

  it('validates object with mixed property types', () => {
    const schema = objectLike({
      name: 'John',
      age: 30,
      active: true,
      score: null,
      metadata: undefined,
    });

    expect(
      validate(schema, {
        name: 'John',
        age: 30,
        active: true,
        score: null,
        extra: 'ignored',
      })
    ).to.match([true]);
  });

  it('validates empty schema against any non-null value', () => {
    const schema = objectLike({});

    expect(validate(schema, {})).to.match([true]);
    expect(validate(schema, [])).to.match([true]);
    expect(validate(schema, 'string')).to.match([true]);
    expect(validate(schema, 42)).to.match([true]);
    expect(validate(schema, true)).to.match([true]);
    expect(validate(schema, function () {})).to.match([true]);
  });

  it('fails when multiple properties are invalid', () => {
    const schema = objectLike({
      name: 'John',
      age: 30,
      active: true,
    });

    expect(
      validate(schema, {
        name: 'Jane',
        age: 25,
        active: false,
      })
    ).to.match([false, '[name] expected String John, got String Jane']);
  });

  it('validates primitive wrapper objects', () => {
    const stringObj = new String('test');

    expect(validate(objectLike({ length: 4 }), stringObj)).to.match([true]);
  });

  it('validates object with inherited properties', () => {
    class Parent {
      parentProp = 'parent';
    }
    class Child extends Parent {
      childProp = 'child';
    }

    const instance = new Child();
    const schema = objectLike({ childProp: 'child', parentProp: 'parent' });

    expect(validate(schema, instance)).to.match([true]);
  });

  it('fails when property exists but has wrong type', () => {
    const schema = objectLike({
      toString: 'should be function',
    });

    expect(validate(schema, {})).to.match([
      false,
      '[toString] expected String should be function, got function toString',
    ]);
  });

  it('validates array-like objects with numeric indices', () => {
    const arrayLike = { 0: 'first', 1: 'second', length: 2 };
    const schema = objectLike({ 0: 'first', length: 2 });

    expect(validate(schema, arrayLike)).to.match([true]);
  });
});
