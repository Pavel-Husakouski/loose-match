import { instanceOf, validate } from '../src';
import { expect } from './@expect';

describe('instanceOf', () => {
  it('instanceOf - basic instance and non-instance', () => {
    class A {}
    const inst = new A();
    expect(validate(instanceOf(A), inst)).to.match([true]);
    expect(validate(instanceOf(A), {})).to.match([false, `expected instanceof ${A.name} got instanceof Object`]);
  });

  it('instanceOf - with explicit schema on instance', () => {
    class A {
      constructor(public name: string) {}
    }
    const inst = new A('x');
    expect(validate(instanceOf(A, { name: 'x' }), inst)).to.match([true]);
    expect(validate(instanceOf(A, { name: 'y' }), inst)).to.match([false, '[name] expected String y, got String x']);
  });

  it('instanceOf - explicit schema on non-instance fails (no duck-typing when schema provided)', () => {
    class A {
      constructor(public name: string) {}
    }
    const plain = { name: 'x' };
    expect(validate(instanceOf(A, { name: 'x' }), plain)).to.match([
      false,
      `expected instanceof ${A.name} got instanceof Object`,
    ]);
  });

  it('instanceOf RegExp', () => {
    const patter = instanceOf(RegExp, { source: '^test$' });
    expect(validate(patter, /^test$/)).to.match([true]);
    expect(validate(patter, /test/)).to.match([false, '[source] expected String ^test$, got String test']);
    expect(validate(patter, {})).to.match([false, 'expected instanceof RegExp got instanceof Object']);
  });
});
