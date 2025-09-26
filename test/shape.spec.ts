import { arrayOf, aString, nullable, objectLike, strictEqual, validate } from '../src';
import { expect } from './@expect';

describe('shape', () => {
  it('shape, null', () => {
    const schema = objectLike({
      test: 'a test',
    });

    expect(validate(schema, null)).to.match([false, 'expected non null value, got null']);
  });

  it('shape of string, valid', () => {
    const schema = objectLike({ length: 2 });

    expect(validate(schema, 'xe')).to.match([true]);
  });

  it('shape of string, invalid', () => {
    const schema = objectLike({ length: 2 });

    expect(validate(schema, 'xexe')).to.match([false, '[length] expected Number 2, got Number 4']);
  });

  it('shape of string, invalid', () => {
    const schema = objectLike({ length: 2 });

    expect(validate(schema, 5)).to.match([false, '[length] expected Number 2, got undefined']);
  });

  it('shape of array object, valid', () => {
    const schema = objectLike({ constructor: strictEqual(Array) });

    expect(validate(schema, [])).to.match([true]);
  });

  it('shape of array object, invalid', () => {
    const schema = objectLike({ constructor: strictEqual(Function) });

    expect(validate(schema, [])).to.match([
      false,
      '[constructor] expected strict equals function Function, got function Array',
    ]);
  });

  it('shape of function object, valid', () => {
    const schema = objectLike({ length: 2 });

    expect(validate(schema, function (a: any, b: any) {})).to.match([true]);
  });

  it('object', () => {
    const schema = objectLike({
      id: 9,
      title: nullable(3),
      items: [1, 2, 3, '4'],
    });
    const x = validate(schema, {
      id: 9,
      items: [1, 2, 3, '4'],
    });

    expect(x).to.match([true]);
  });

  it('object, failed', () => {
    const schema = objectLike({
      id: 9,
      title: nullable(arrayOf(aString())),
      items: [1, 2, 3, '4'],
    });
    const x = validate(schema, {
      id: 9,
      title: ['3', new Date()],
      items: [1, 2, 3, '4'],
    });

    expect(x).to.match([false, '[title] [1] expected a string, got [object Date]']);
  });
});
