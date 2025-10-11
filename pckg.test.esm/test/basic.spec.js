import { describe } from 'mocha';
import { arrayOf, match, oneOf } from '@beeff/loose-match';

describe('basic', () => {
  it('basic test', () => {
    const object = [{ key: 'value' }, { key: 'other' }];

    match(object).with(arrayOf(oneOf({ key: 'value' }, { key: 'other' })));
  });
});
