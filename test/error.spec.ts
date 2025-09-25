import { expect } from './@expect';
import { isInstanceOf, objectShape, validate } from '../src';

describe('error', () => {
  it('error', () => {
    const err = new Error();

    // @ts-ignore
    err.code = 'SOMETHING';

    const rule = isInstanceOf(Error, { code: 'SOMETHING' });

    const x = validate(rule, err);

    expect(x).to.match([true]);
  });

  it('error as pattern', () => {
    const pattern = new Error();

    // @ts-ignore
    pattern.code = 'SOMETHING';

    const value = new Error();

    // @ts-ignore
    value.code = 'SOMETHING';

    const x = validate(pattern, value);

    expect(x).to.match([true]);
  });

  it('error as pattern, failed', () => {
    const pattern = new Error();

    // @ts-ignore
    pattern.code = 'SOMETHING';

    const value = new Error();

    // @ts-ignore
    value.code = 'NOT SOMETHING';

    const x = validate(pattern, value);

    expect(x).to.match([false, '[code] expected String SOMETHING, got String NOT SOMETHING']);
  });

  it('error, failed', () => {
    const err = new Error();

    // @ts-ignore
    err.code = 'SOMETHING';

    const rule = isInstanceOf(TypeError, { code: 'SOMETHING' });

    const x = validate(rule, err);

    expect(x).to.match([false, 'expected TypeError got Error']);
  });

  it('error, failed 2', () => {
    const err = new Error();

    const rule = isInstanceOf(Error, { code: 'SOMETHING' });

    const x = validate(rule, err);

    expect(x).to.match([false, '[code] expected String SOMETHING, got undefined']);
  });

  it('error property', () => {
    const err = new Error();

    // @ts-ignore
    err.code = 'SOMETHING';

    const rule = objectShape({ err });

    const x = validate(rule, { err });

    expect(x).to.match([true]);
  });

  it('error property, failed', () => {
    const err = new Error();

    // @ts-ignore
    err.code = 'SOMETHING';

    const rule = objectShape({ err });

    const x = validate(rule, { err: new Error() });

    expect(x).to.match([false, '[err] [code] expected String SOMETHING, got undefined']);
  });

  it('descendant error property, descendant', () => {
    const err = new Error();
    const rule = objectShape({ err });
    const x = validate(rule, {
      err: new (class MyError extends Error {})(),
    });

    expect(x).to.match([true]);
  });

  it('descendant error property, failed', () => {
    const err = new Error('test');
    const rule = objectShape({ err });
    const x = validate(rule, {
      err: new (class NotError {
        message = 'test';
      })(),
    });

    expect(x).to.match([false, '[err] expected Error got NotError']);
  });
});
