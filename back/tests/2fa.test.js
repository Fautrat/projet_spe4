import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateTotpCode,
  generateTotpSecret,
  verifyTotpCode,
} from '../src/controllers/authController.js';

test('generateTotpSecret returns a usable base32 secret', () => {
  const secret = generateTotpSecret();

  assert.equal(typeof secret, 'string');
  assert.ok(secret.length >= 16);
  assert.match(secret, /^[A-Z2-7]+=*$/i);
});

test('verifyTotpCode accepts the current code and rejects a wrong one', () => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const code = generateTotpCode(secret);

  assert.equal(verifyTotpCode(secret, code), true);
  assert.equal(verifyTotpCode(secret, '000000'), false);
});