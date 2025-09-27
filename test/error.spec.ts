import { expect } from './@expect';
import { isInstanceOf, objectShape, validate } from '../src';

describe('error', () => {
  it('error as pattern', () => {
    const pattern = new Error('test');

    expect(validate(pattern, new Error('test'))).to.match([true]);
    expect(validate(pattern, new Error('not a test'))).to.match([
      false,
      '[message] expected String test, got String not a test',
    ]);
    expect(validate(pattern, { message: 'test' })).to.match([false, 'expected instanceof Error got instanceof Object']);
  });

  it('error instanceOf with extra properties', () => {
    const err = new TypeError();

    // @ts-ignore
    err.code = 'SOMETHING';

    const err2 = new TypeError();

    // @ts-ignore
    err2.code = 'SOMETHING ELSE';

    const err3 = new Error();

    // @ts-ignore
    err3.code = 'SOMETHING';

    const rule = isInstanceOf(TypeError, { code: 'SOMETHING' });

    expect(validate(rule, err)).to.match([true]);
    expect(validate(rule, new TypeError())).to.match([false, '[code] expected String SOMETHING, got undefined']);
    expect(validate(rule, err2)).to.match([false, '[code] expected String SOMETHING, got String SOMETHING ELSE']);
    expect(validate(rule, err3)).to.match([false, 'expected instanceof TypeError got instanceof Error']);
  });

  it('error property', () => {
    const err = new Error();

    // @ts-ignore
    err.code = 'SOMETHING';

    const rule = objectShape({ err });

    expect(validate(rule, { err })).to.match([true]);
    expect(validate(rule, { err: new Error() })).to.match([
      false,
      '[err] [code] expected String SOMETHING, got undefined',
    ]);
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
    const rule = objectShape({ err: new Error('test') });
    const x = validate(rule, {
      err: new (class NotAnError {
        message = 'test';
      })(),
    });

    expect(x).to.match([false, '[err] expected instanceof Error got instanceof NotAnError']);
  });
});
