import { arrayOf, aString, errorIs, exact, nullable, record, validate } from '../src';
import { expect } from './@expect';

describe('record', () => {
  it('record of string valid', () => {
    const schema = record({
      test: exact('test'),
    });

    expect(
      validate(schema, {
        test: 'test',
      })
    ).to.match([true]);
  });

  it('record of string invalid', () => {
    const schema = record({
      test: exact('test'),
    });

    expect(
      validate(schema, {
        test: 5,
      })
    ).to.match([false, `[test] expected String test, got Number 5`]);
  });

  it('record of array valid', () => {
    const schema = record({
      test: ['test', 'another test'],
    });

    expect(
      validate(schema, {
        test: ['test', 'another test'],
      })
    ).to.match([true]);
  });

  it('record of tuples invalid', () => {
    const schema = record({
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

  it('error', () => {
    const error = new Error();

    // @ts-ignore
    error.code = 'SOMETHING';

    const rule = errorIs({ code: 'SOMETHING' });

    const x = validate(rule, error);

    expect(x).to.match([true]);
  });

  it('error, failed', () => {
    const error = new Error();

    // @ts-ignore
    error.code = 'SOMETHING';

    const rule = errorIs({ code: 'SOMETHING' }, TypeError);

    const x = validate(rule, error);

    expect(x).to.match([false, 'expected TypeError got Error']);
  });

  it('error, failed 2', () => {
    const error = new Error();

    const rule = errorIs({ code: 'SOMETHING' }, Error);

    const x = validate(rule, error);

    expect(x).to.match([false, '[code] expected String SOMETHING, got undefined']);
  });

  it('error property', () => {
    const error = new Error();

    // @ts-ignore
    error.code = 'SOMETHING';

    const rule = record({ error });

    const x = validate(rule, { error });

    expect(x).to.match([true]);
  });

  it('error property, failed', () => {
    const error = new Error();

    // @ts-ignore
    error.code = 'SOMETHING';

    const rule = record({ error });

    const x = validate(rule, { error: new Error() });

    expect(x).to.match([false, '[error] [code] expected String SOMETHING, got undefined']);
  });

  it('descendant error property, descendant', () => {
    const error = new Error();
    const rule = record({ error });
    const x = validate(rule, { error: new (class MyError extends Error {})() });

    expect(x).to.match([true]);
  });

  it('descendant error property, failed', () => {
    const error = new Error();
    const rule = record({ error });
    const x = validate(rule, { error: new (class NotError {})() });

    expect(x).to.match([false, '[error] expected Error got NotError']);
  });
});
