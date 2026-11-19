import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createSubmissionRouter } from './submissions.js';

let server, url, stored;
before(async () => {
  stored = [];
  const app = express(); app.use(express.json());
  app.use('/submissions', createSubmissionRouter({
    authorize: (req, res, next) => { if (req.header('authorization') !== 'Bearer test') return res.status(401).json({ error: 'Unauthorized' }); req.user = { id: 'student-1' }; next(); },
    validate: async (_language, source) => ({ ok: true, result: { language: 'javascript', status: source.includes('=') ? 'valid' : 'invalid', errorCount: 0, errors: [], warnings: [], tokens: [], ast: { type: 'Program' }, cst: null, trace: [], processingMs: 2, engine: 'test parser' } }),
    saveSubmission: async record => { stored.push(record); return { id: `submission-${stored.length}`, ...record }; },
  }));
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); url = `http://127.0.0.1:${server.address().port}/submissions`;
});
after(async () => { if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test('submission requires authentication and field-valid source/title/language', async () => {
  const unauthorized = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'x', language: 'javascript', source: 'x=1' }) });
  assert.equal(unauthorized.status, 401);
  const invalid = await fetch(url, { method: 'POST', headers: { authorization: 'Bearer test', 'content-type': 'application/json' }, body: JSON.stringify({ title: '', language: 'javascript', source: 'x=1' }) });
  assert.equal(invalid.status, 400); assert.ok((await invalid.json()).fields.title);
});

test('submission status and parser fields come from server validation, not request payload', async () => {
  const response = await fetch(url, { method: 'POST', headers: { authorization: 'Bearer test', 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Example', language: 'javascript', source: 'x=1', status: 'valid', ast: { forged: true }, student: 'attacker' }) });
  const body = await response.json();
  assert.equal(response.status, 201); assert.equal(body.status, 'valid');
  assert.deepEqual(body.ast, { type: 'Program' }); assert.equal(body.student, 'student-1');
  assert.equal(stored.length, 1); assert.equal(stored[0].status, 'valid');
});
