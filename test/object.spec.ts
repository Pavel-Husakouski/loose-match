import { arrayOf, aString, literal, nullable, objectWith, validate } from '../src';
import { expect } from './@expect';

describe('object', () => {
  it('object, null', () => {
    const schema = objectWith({
      test: 'a test',
    });

    expect(validate(schema, null)).to.match([false, 'expected object, got null']);
  });

  it('object of string valid', () => {
    const schema = objectWith({
      test: literal('test'),
    });

    expect(
      validate(schema, {
        test: 'test',
      })
    ).to.match([true]);
  });

  it('object of string invalid', () => {
    const schema = objectWith({
      test: literal('test'),
    });

    expect(
      validate(schema, {
        test: 5,
      })
    ).to.match([false, `[test] expected String test, got Number 5`]);
  });

  it('object of array valid', () => {
    const schema = objectWith({
      test: ['test', 'another test'],
    });

    expect(
      validate(schema, {
        test: ['test', 'another test'],
      })
    ).to.match([true]);
  });

  it('object of tuples invalid', () => {
    const schema = objectWith({
      test: ['test', 'another test'],
    });

    expect(
      validate(schema, {
        test: ['test', 'another test', 'one more test'],
      })
    ).to.match([false, `[test] expected array of 2 items, got 3`]);
  });

  it('object', () => {
    const schema = {
      id: 9,
      title: nullable(3),
      items: [1, 2, 3, '4'],
    };
    const x = validate(schema, {
      id: 9,
      items: [1, 2, 3, '4'],
    });

    expect(x).to.match([true]);
  });

  it('object, failed', () => {
    const schema = {
      id: 9,
      title: nullable(arrayOf(aString())),
      items: [1, 2, 3, '4'],
    };
    const x = validate(schema, {
      id: 9,
      title: ['3', new Date()],
      items: [1, 2, 3, '4'],
    });

    expect(x).to.match([false, '[title] [1] expected a string, got [object Date]']);
  });
});
