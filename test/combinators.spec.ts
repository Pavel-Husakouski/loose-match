import { allOf, anyOf, isInstanceOf, isPrototypedBy, oneOf, strictEqual, validate } from '../src';
import { expect } from './@expect';

describe('combinators', () => {
  it('oneOf', () => {
    const pattern = oneOf({ id: '1' }, { name: '2' }, { email: '3' });
    const value = { id: '1' };

    expect(validate(pattern, value)).to.match([true]);
  });

  it('oneOf, failed', () => {
    const pattern = oneOf({ id: '1' }, { name: '2' }, { email: '3' });

    expect(validate(pattern, { test: '1' })).to.match([false, 'expected one of 3 rules, got 0 matches']);
    expect(validate(pattern, { id: '1', name: '2' })).to.match([
      false,
      'expected one of 3 rules, got multiple matches at index 1',
    ]);
  });

  it('oneOf, empty', () => {
    expect(() => oneOf(...([] as any))).to.throw(
      isInstanceOf(Error, { message: 'oneOf requires at least two arguments' })
    );
  });

  it('allOf', () => {
    const pattern = allOf({ id: '1' }, { name: '2' });
    expect(validate(pattern, { id: '1', name: '2' })).to.match([true]);
    expect(validate(pattern, { id: '1' })).to.match([false, '[name] expected String 2, got undefined']);
    expect(validate(pattern, { name: '2' })).to.match([false, '[id] expected String 1, got undefined']);
  });

  it('allOf, empty', () => {
    expect(() => allOf(...([] as any))).to.throw(
      isInstanceOf(Error, { message: 'allOf requires at least two arguments' })
    );
  });

  it('anyOf', () => {
    const pattern = anyOf({ id: '1' }, { name: '2' });
    expect(validate(pattern, { id: '1' })).to.match([true]);
    expect(validate(pattern, { name: '2' })).to.match([true]);
    expect(validate(pattern, { id: '1', name: '2' })).to.match([true]);
    expect(validate(pattern, { test: '3' })).to.match([
      false,
      '[id] expected String 1, got undefined,[name] expected String 2, got undefined',
    ]);
  });

  it('anyOf, empty', () => {
    expect(() => anyOf(...([] as any))).to.throw(
      isInstanceOf(Error, { message: 'anyOf requires at least two arguments' })
    );
  });

  it('isPrototypedBy', () => {
    class A {}
    class B extends A {}
    const inst = new A();
    const prot = Object.create(A.prototype);
    const plain = {};

    expect(validate(isPrototypedBy(A), B)).to.match([true]);
    expect(validate(isPrototypedBy(A), inst)).to.match([true]);
    expect(validate(isPrototypedBy(A), prot)).to.match([true]);
    expect(validate(isPrototypedBy(A), plain)).to.match([false, `expected object prototyped by ${A.name} got Object`]);
  });

  it('isInstanceOf - basic instance and non-instance', () => {
    class A {}
    const inst = new A();

    expect(validate(isInstanceOf(A), inst)).to.match([true]);
    expect(validate(isInstanceOf(A), {})).to.match([false, `expected ${A.name} got Object`]);
  });

  it('isInstanceOf - with explicit schema on instance', () => {
    class A {
      constructor(public name: string) {}
    }
    const inst = new A('x');

    expect(validate(isInstanceOf(A, { name: 'x' }), inst)).to.match([true]);
    expect(validate(isInstanceOf(A, { name: 'y' }), inst)).to.match([false, '[name] expected String y, got String x']);
  });

  it('isInstanceOf - explicit schema on non-instance fails (no duck-typing when schema provided)', () => {
    class A {
      constructor(public name: string) {}
    }
    const plain = { name: 'x' };

    expect(validate(isInstanceOf(A, { name: 'x' }), plain)).to.match([false, `expected ${A.name} got Object`]);
  });

  it('isInstanceOf RegExp', () => {
    const patter = isInstanceOf(RegExp, { source: '^test$' });
    expect(validate(patter, /^test$/)).to.match([true]);
    expect(validate(patter, /test/)).to.match([false, '[source] expected String ^test$, got String test']);
    expect(validate(patter, {})).to.match([false, 'expected RegExp got Object']);
  });

  it('strictEqual', () => {
    const target = {};
    const pattern = strictEqual(target);

    expect(validate(pattern, target)).to.match([true]);
    expect(validate(pattern, [])).to.match([false, 'expected strict equals [object Object], got [object Array]']);
    expect(validate(pattern, {})).to.match([false, 'expected strict equals [object Object], got [object Object]']);
  });

  it('strictEqual with null and undefined', () => {
    expect(validate(strictEqual(null), null)).to.match([true]);
    expect(validate(strictEqual(null), undefined)).to.match([false, 'expected strict equals null, got undefined']);
    expect(validate(strictEqual(null), 'test')).to.match([false, 'expected strict equals null, got String test']);
  });

  it('strictEqual with primitive values', () => {
    expect(validate(strictEqual(5), 5)).to.match([true]);
    expect(validate(strictEqual(5), '5')).to.match([false, 'expected strict equals Number 5, got String 5']);
  });
});
