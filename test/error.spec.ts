import { describe, it } from 'mocha';
import { expect } from './@expect';
import { aString, instanceOf, objectLike, objectShape, validate } from '../src';

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

    const rule = instanceOf(TypeError, { code: 'SOMETHING' });

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

  it('custom error class with instanceOf', () => {
    class CustomError extends Error {
      constructor(
        public code: string,
        message: string
      ) {
        super(message);
        this.name = 'CustomError';
      }
    }

    const rule = instanceOf(CustomError);
    const customErr = new CustomError('CUSTOM_CODE', 'custom message');

    expect(validate(rule, customErr)).to.match([true]);
    expect(validate(rule, new Error('test'))).to.match([false, 'expected instanceof CustomError got instanceof Error']);
    expect(validate(rule, new TypeError('test'))).to.match([
      false,
      'expected instanceof CustomError got instanceof TypeError',
    ]);
    expect(validate(rule, { message: 'test', code: 'CUSTOM_CODE' })).to.match([
      false,
      'expected instanceof CustomError got instanceof Object',
    ]);
  });

  it('custom error with extra properties validation', () => {
    class NetworkError extends Error {
      constructor(
        public statusCode: number,
        public url: string,
        message: string
      ) {
        super(message);
        this.name = 'NetworkError';
      }
    }

    const rule = instanceOf(NetworkError, { statusCode: 404, url: 'http://example.com' });
    const networkErr = new NetworkError(404, 'http://example.com', 'Not found');

    expect(validate(rule, networkErr)).to.match([true]);
    expect(validate(rule, new NetworkError(500, 'http://example.com', 'Server error'))).to.match([
      false,
      '[statusCode] expected Number 404, got Number 500',
    ]);
    expect(validate(rule, new NetworkError(404, 'http://different.com', 'Not found'))).to.match([
      false,
      '[url] expected String http://example.com, got String http://different.com',
    ]);
  });

  it('nested error objects with objectShape', () => {
    const innerError = new Error('inner error');
    const rule = objectShape({
      status: 'failed',
      error: innerError,
      details: {
        code: 500,
        cause: new TypeError('type error'),
      },
    });

    const validData = {
      status: 'failed',
      error: new Error('inner error'),
      details: {
        code: 500,
        cause: new TypeError('type error'),
      },
    };

    expect(validate(rule, validData)).to.match([true]);
    expect(
      validate(rule, {
        status: 'failed',
        error: new Error('different error'),
        details: { code: 500, cause: new TypeError('type error') },
      })
    ).to.match([false, '[error] [message] expected String inner error, got String different error']);
  });

  it('error aggregation pattern with objectShape', () => {
    const rule = objectShape({
      errors: [
        new Error('validation failed'),
        new TypeError('invalid type'),
        instanceOf(RangeError, { message: 'out of range' }),
      ],
    });

    const validData = {
      errors: [new Error('validation failed'), new TypeError('invalid type'), new RangeError('out of range')],
    };

    expect(validate(rule, validData)).to.match([true]);
    expect(
      validate(rule, {
        errors: [new Error('validation failed'), new Error('wrong type'), new RangeError('out of range')],
      })
    ).to.match([false, '[errors] [1] expected instanceof TypeError got instanceof Error']);
  });

  it('error-like objects with objectLike', () => {
    const errorLikeRule = objectLike({
      name: 'CustomError',
      message: 'something went wrong',
    });

    const errorObj = {
      name: 'CustomError',
      message: 'something went wrong',
      stack: 'Error: something went wrong\n    at test',
      extra: 'additional property',
    };

    expect(validate(errorLikeRule, errorObj)).to.match([true]);
    expect(
      validate(errorLikeRule, {
        name: 'DifferentError',
        message: 'something went wrong',
      })
    ).to.match([false, '[name] expected String CustomError, got String DifferentError']);
    expect(validate(errorLikeRule, null)).to.match([false, 'expected non null value, got null']);
  });

  it('mixed error types with instanceOf', () => {
    const syntaxErrRule = instanceOf(SyntaxError);
    const rangeErrRule = instanceOf(RangeError);
    const refErrRule = instanceOf(ReferenceError);

    expect(validate(syntaxErrRule, new SyntaxError('syntax error'))).to.match([true]);
    expect(validate(rangeErrRule, new RangeError('range error'))).to.match([true]);
    expect(validate(refErrRule, new ReferenceError('reference error'))).to.match([true]);

    expect(validate(syntaxErrRule, new RangeError('wrong type'))).to.match([
      false,
      'expected instanceof SyntaxError got instanceof RangeError',
    ]);
    expect(validate(rangeErrRule, new TypeError('wrong type'))).to.match([
      false,
      'expected instanceof RangeError got instanceof TypeError',
    ]);
    expect(validate(refErrRule, new Error('wrong type'))).to.match([
      false,
      'expected instanceof ReferenceError got instanceof Error',
    ]);
  });

  it('error with null and undefined properties', () => {
    const err = new Error('test');
    // @ts-ignore
    err.code = null;
    // @ts-ignore
    err.details = undefined;

    const rule = instanceOf(Error, {
      message: 'test',
      code: null,
      details: undefined,
    });

    expect(validate(rule, err)).to.match([true]);

    const errWithoutProps = new Error('test');
    expect(validate(rule, errWithoutProps)).to.match([false, '[code] expected null, got undefined']);
  });

  it('complex error inheritance chain', () => {
    class BaseError extends Error {
      constructor(
        public category: string,
        message: string
      ) {
        super(message);
        this.name = 'BaseError';
      }
    }

    class ValidationError extends BaseError {
      constructor(
        public field: string,
        message: string
      ) {
        super('validation', message);
        this.name = 'ValidationError';
      }
    }

    class FieldValidationError extends ValidationError {
      constructor(
        field: string,
        public reason: string,
        message: string
      ) {
        super(field, message);
        this.name = 'FieldValidationError';
      }
    }

    const baseRule = instanceOf(BaseError, { category: 'validation' });
    const validationRule = instanceOf(ValidationError, { field: 'email' });
    const fieldRule = instanceOf(FieldValidationError, { field: 'email', reason: 'invalid_format' });

    const fieldErr = new FieldValidationError('email', 'invalid_format', 'Email format is invalid');

    expect(validate(baseRule, fieldErr)).to.match([true]);
    expect(validate(validationRule, fieldErr)).to.match([true]);
    expect(validate(fieldRule, fieldErr)).to.match([true]);

    expect(validate(fieldRule, new ValidationError('email', 'test'))).to.match([
      false,
      'expected instanceof FieldValidationError got instanceof ValidationError',
    ]);
  });

  it('error cause chain validation', () => {
    const rootCause = new Error('root cause');
    const middleError = new Error('middle error');
    // @ts-ignore
    middleError.cause = rootCause;
    const topError = new Error('top error');
    // @ts-ignore
    topError.cause = middleError;

    const rule = instanceOf(Error, {
      message: 'top error',
      cause: instanceOf(Error, {
        message: 'middle error',
        cause: instanceOf(Error, { message: 'root cause' }),
      }),
    });

    expect(validate(rule, topError)).to.match([true]);

    const errorWithoutCause = new Error('top error');
    expect(validate(rule, errorWithoutCause)).to.match([
      false,
      '[cause] expected instanceof Error got instanceof undefined',
    ]);
  });

  it('error with dynamic properties using objectLike', () => {
    const dynamicError = new Error('dynamic');
    // @ts-ignore
    dynamicError.timestamp = new Date('2023-01-01');
    // @ts-ignore
    dynamicError.userId = 'user123';

    const rule = objectLike({
      message: 'dynamic',
      timestamp: new Date('2023-01-01'),
      userId: 'user123',
    });

    expect(validate(rule, dynamicError)).to.match([true]);

    const wrongTimestamp = new Error('dynamic');
    // @ts-ignore
    wrongTimestamp.timestamp = new Date('2023-01-02');
    // @ts-ignore
    wrongTimestamp.userId = 'user123';

    expect(validate(rule, wrongTimestamp)).to.match([
      false,
      '[timestamp] expected Date 2023-01-01T00:00:00.000Z, got Date 2023-01-02T00:00:00.000Z',
    ]);
  });

  it('error validation with missing required properties', () => {
    const rule = instanceOf(Error, {
      message: 'required message',
      stack: aString(),
    });

    const validError = new Error('required message');
    expect(validate(rule, validError)).to.match([true]);

    const errorWithWrongMessage = new Error('wrong message');
    expect(validate(rule, errorWithWrongMessage)).to.match([
      false,
      '[message] expected String required message, got String wrong message',
    ]);

    const plainObject = { message: 'required message', stack: 'some stack' };
    expect(validate(rule, plainObject)).to.match([false, 'expected instanceof Error got instanceof Object']);
  });
});
