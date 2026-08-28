import assert from 'node:assert/strict';
import test from 'node:test';
import { requireAcceptedEmail } from './emailDelivery';

test('returns the provider ID for an accepted email', () => {
  assert.equal(requireAcceptedEmail({ data: { id: 'email-id' }, error: null }), 'email-id');
});

test('throws when the provider returns an API error', () => {
  assert.throws(
    () => requireAcceptedEmail({ data: null, error: { name: 'validation_error' } }),
    /validation_error/,
  );
});
