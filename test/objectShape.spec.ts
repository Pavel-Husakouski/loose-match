import { arrayOf, aString, literal, nullable, objectShape, validate } from '../src';
import { expect } from './@expect';

describe('object', () => {
  it('objectShape with null property', () => {
    const schema = objectShape({
      test: null,
    });

    expect(validate(schema, { test: null })).to.match([true]);
    expect(validate(schema, { test: undefined })).to.match([false, '[test] expected null, got undefined']);
    expect(validate(schema, {})).to.match([false, '[test] expected null, got undefined']);
  });

  it('objectShape with undefined property', () => {
    const schema = objectShape({
      test: undefined,
    });

    expect(validate(schema, {})).to.match([true]);
    expect(validate(schema, { test: undefined })).to.match([true]);
    expect(validate(schema, { test: null })).to.match([false, '[test] expected undefined, got null']);
  });

  it('objectShape validation with null input', () => {
    const schema = objectShape({
      test: 'a test',
    });

    expect(validate(schema, null)).to.match([false, 'expected object, got null']);
  });

  it('objectShape validation with non-object input', () => {
    const schema = objectShape({
      test: 'value',
    });

    expect(validate(schema, 'string')).to.match([false, 'expected object, got String string']);
    expect(validate(schema, 123)).to.match([false, 'expected object, got Number 123']);
    expect(validate(schema, [])).to.match([false, 'expected object, got [object Array]']);
    expect(validate(schema, undefined)).to.match([false, 'expected object, got undefined']);
  });

  it('objectShape with literal string validation', () => {
    const schema = objectShape({
      test: literal('test'),
    });

    expect(validate(schema, { test: 'test' })).to.match([true]);
    expect(validate(schema, { test: 5 })).to.match([false, `[test] expected String test, got Number 5`]);
    expect(validate(schema, { test: 'wrong' })).to.match([false, `[test] expected String test, got String wrong`]);
  });

  it('objectShape with array property validation', () => {
    const schema = objectShape({
      test: ['test', 'another test'],
    });

    expect(validate(schema, { test: ['test', 'another test'] })).to.match([true]);
    expect(validate(schema, { test: ['test', 'another test', 'one more test'] })).to.match([
      false,
      `[test] expected array of 2 items, got 3`,
    ]);
    expect(validate(schema, { test: ['test', 'wrong'] })).to.match([
      false,
      `[test] [1] expected String another test, got String wrong`,
    ]);
    expect(validate(schema, { test: ['test'] })).to.match([
      false,
      `[test] [1] expected String another test, got undefined`,
    ]);
  });

  it('objectShape with multiple properties', () => {
    const schema = objectShape({
      id: 9,
      name: 'John',
      active: true,
    });

    expect(validate(schema, { id: 9, name: 'John', active: true })).to.match([true]);
    expect(validate(schema, { id: 10, name: 'John', active: true })).to.match([
      false,
      '[id] expected Number 9, got Number 10',
    ]);
    expect(validate(schema, { id: 9, name: 'Jane', active: true })).to.match([
      false,
      '[name] expected String John, got String Jane',
    ]);
    expect(validate(schema, { id: 9, name: 'John', active: false })).to.match([
      false,
      '[active] expected Boolean true, got Boolean false',
    ]);
  });

  it('objectShape with missing required properties', () => {
    const schema = objectShape({
      required: 'value',
      alsoRequired: 42,
    });

    expect(validate(schema, {})).to.match([false, '[required] expected String value, got undefined']);
    expect(validate(schema, { required: 'value' })).to.match([
      false,
      '[alsoRequired] expected Number 42, got undefined',
    ]);
  });

  it('objectShape with extra properties (should pass)', () => {
    const schema = objectShape({
      test: 'value',
    });

    expect(validate(schema, { test: 'value', extra: 'ignored' })).to.match([true]);
  });

  it('plain object validation with nullable property', () => {
    const schema = {
      id: 9,
      title: nullable(3),
      items: [1, 2, 3, '4'],
    };

    expect(validate(schema, { id: 9, items: [1, 2, 3, '4'] })).to.match([true]);
    expect(validate(schema, { id: 9, title: 3, items: [1, 2, 3, '4'] })).to.match([true]);
    expect(validate(schema, { id: 9, title: null, items: [1, 2, 3, '4'] })).to.match([true]);
    expect(validate(schema, { id: 9, title: undefined, items: [1, 2, 3, '4'] })).to.match([true]);
  });

  it('plain object validation with complex nested structure', () => {
    const schema = {
      id: 9,
      title: nullable(arrayOf(aString())),
      items: [1, 2, 3, '4'],
    };

    expect(validate(schema, { id: 9, title: ['valid', 'strings'], items: [1, 2, 3, '4'] })).to.match([true]);
    expect(validate(schema, { id: 9, title: ['3', new Date()], items: [1, 2, 3, '4'] })).to.match([
      false,
      '[title] [1] expected a string, got [object Date]',
    ]);
  });

  it('objectShape with nested objects', () => {
    const schema = objectShape({
      user: {
        name: 'John',
        age: 30,
      },
      metadata: {
        version: 1,
      },
    });

    expect(
      validate(schema, {
        user: { name: 'John', age: 30 },
        metadata: { version: 1 },
      })
    ).to.match([true]);
    expect(
      validate(schema, {
        user: { name: 'Jane', age: 30 },
        metadata: { version: 1 },
      })
    ).to.match([false, '[user] [name] expected String John, got String Jane']);
  });
});
