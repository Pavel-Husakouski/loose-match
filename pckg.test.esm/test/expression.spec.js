import {describe} from 'mocha';
import {match} from '@beeff/loose-match';
import {arrayOf, oneOf, toFunction} from '@beeff/loose-match/lib/expressions.js';

describe('basic', () => {
  it('basic test', () => {
    const object = [{ key: 'value' }, { key: 'other' }];
    const rule = toFunction(arrayOf(oneOf({ key: 'value' }, { key: 'other' })));

    match(object).with(rule);
  });
});
