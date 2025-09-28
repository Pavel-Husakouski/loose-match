import { isPrototypedBy, validate } from '../src';
import { expect } from './@expect';

describe('isPrototypedBy', () => {
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
});
