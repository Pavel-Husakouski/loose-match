# @beeff/loose-match

An asymmetric pattern matching library for TypeScript.

## Example

```typescript
import { match, oneOf, all, re, aString, aNumber, aBigInt, nullable, arrayOf } from '@beeff/loose-match';

it('create user request', async () => {
  const request = awat createUserRequest(context, {username, password});

  match(request).with([
    '/users',
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': allOf(Bearer, oneOf(JWT, Hmac)),
            'Correlation-Id': Guid,
            'Transaction-Id': aBigInt(),
        },
        body: {
            username,
            password,
        }
    }
  ]);
});

it('created user', async () => {
  const request = awat createUserRequest(username, password, token);
  const response = await fetch(...request);
  const json = await response.json();

  match(response).with({
    status: oneOf(200, 201), // some env return 200, some 201
    headers: {
        'Content-Type': 'application/json',
    }
  });
  match(json).with({
    id: Guid,
    username,
    capabilities: arrayOf(oneOf('read', 'write', 'delete', 'login')),
    token: anUndefined(), // token must not be returned
    created: oneOf(aNumber(), DateISO),
    // some env return epoch, some return date in ISO format
  });
});

const Guid = re(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
const JWT = re(/[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+/);
const Hmac = re(/[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+/);
const DateISO = re(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
const Bearer = re(/Bearer /);
```
