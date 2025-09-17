import { expect } from './@expect';
import { errorWith, objectWith, validate } from '../src';

describe('error', () => {
  it('error', () => {
    const err = new Error();

    // @ts-ignore
    err.code = 'SOMETHING';

    const rule = errorWith({ code: 'SOMETHING' });

    const x = validate(rule, err);

    expect(x).to.match([true]);
  });

  it('error, failed', () => {
    const err = new Error();

    // @ts-ignore
    err.code = 'SOMETHING';

    const rule = errorWith({ code: 'SOMETHING' }, TypeError);

    const x = validate(rule, err);

    expect(x).to.match([false, 'expected TypeError got Error']);
  });

  it('error, failed 2', () => {
    const err = new Error();

    const rule = errorWith({ code: 'SOMETHING' }, Error);

    const x = validate(rule, err);

    expect(x).to.match([false, '[code] expected String SOMETHING, got undefined']);
  });

  it('error property', () => {
    const err = new Error();

    // @ts-ignore
    err.code = 'SOMETHING';

    const rule = objectWith({ err });

    const x = validate(rule, { err });

    expect(x).to.match([true]);
  });

  it('error property, failed', () => {
    const err = new Error();

    // @ts-ignore
    err.code = 'SOMETHING';

    const rule = objectWith({ err });

    const x = validate(rule, { err: new Error() });

    expect(x).to.match([false, '[err] [code] expected String SOMETHING, got undefined']);
  });

  it('descendant error property, descendant', () => {
    const err = new Error();
    const rule = objectWith({ err });
    const x = validate(rule, {
      err: new (class MyError extends Error {})(),
    });

    expect(x).to.match([true]);
  });

  it('descendant error property, failed', () => {
    const err = new Error('test');
    const rule = objectWith({ err });
    const x = validate(rule, {
      err: new (class NotError {
        message = 'test';
      })(),
    });

    expect(x).to.match([false, '[err] expected Error got NotError']);
  });
});
