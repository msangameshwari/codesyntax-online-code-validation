import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistration } from './registration.js';

test('registration requires a name, roll number, valid email, and eight-character password', () => {
  const result = validateRegistration({ name: '  ', rollNumber: '', email: 'bad', password: 'short' });
  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.fields).sort(), ['email', 'name', 'password', 'rollNumber'].sort());
});

test('registration normalizes name, roll number, and email without changing password', () => {
  const result = validateRegistration({ name: ' Ada Lovelace ', rollNumber: ' CS-42 ', email: 'ADA@EXAMPLE.ORG ', password: 'Strong Pass 42' });
  assert.equal(result.valid, true);
  assert.deepEqual(result.values, { name: 'Ada Lovelace', rollNumber: 'CS-42', email: 'ada@example.org', password: 'Strong Pass 42' });
});
