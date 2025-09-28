import { isInstanceOf, validate } from '../src';
import { expect } from './@expect';

describe('isInstanceOf', () => {
  it('isInstanceOf - basic instance and non-instance', () => {
    class A {}
    const inst = new A();
    expect(validate(isInstanceOf(A), inst)).to.match([true]);
    expect(validate(isInstanceOf(A), {})).to.match([false, `expected instanceof ${A.name} got instanceof Object`]);
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
    expect(validate(isInstanceOf(A, { name: 'x' }), plain)).to.match([
      false,
      `expected instanceof ${A.name} got instanceof Object`,
    ]);
  });

  it('isInstanceOf RegExp', () => {
    const patter = isInstanceOf(RegExp, { source: '^test$' });
    expect(validate(patter, /^test$/)).to.match([true]);
    expect(validate(patter, /test/)).to.match([false, '[source] expected String ^test$, got String test']);
    expect(validate(patter, {})).to.match([false, 'expected instanceof RegExp got instanceof Object']);
  });
});
