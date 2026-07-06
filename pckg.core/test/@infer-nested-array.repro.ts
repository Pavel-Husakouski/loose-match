import { aNumber, aString, Infer } from '@beeff/loose-match/lib/expressions';

const pattern = {
  messages: [aNumber(), aString()],
};

type Actual = Infer<typeof pattern>;

const check: Actual = { messages: [1, 'a'] };
