import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createDfaRouter } from './dfa.js';

let server, url;
before(async () => {
  const app = express(); app.use(express.json());
  app.use('/dfa', createDfaRouter({ authorize: (_req, _res, next) => next() }));
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); url = `http://127.0.0.1:${server.address().port}/dfa`;
});
after(async () => { if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test('DFA API exposes the authoritative definition and traced tokens from the same scanner', async () => {
  const [definitionResponse, scanResponse] = await Promise.all([fetch(url), fetch(`${url}/simulate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source: 'let n = 42;' }) })]);
  const definition = await definitionResponse.json(), scan = await scanResponse.json();
  assert.equal(definition.start, 'q0'); assert.ok(definition.transitions.length);
  assert.deepEqual(scan.tokens.map(token => token.type), ['Keyword', 'Identifier', 'Operator', 'Numeric literal', 'Separator']);
  assert.ok(scan.trace.some(step => step.nextState === 'q1'));
});

test('DFA API applies source and trace output bounds', async () => {
  const tooLarge = await fetch(`${url}/simulate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source: ' '.repeat(100_001) }) });
  assert.equal(tooLarge.status, 413);
  const capped = await fetch(`${url}/simulate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source: 'x '.repeat(1_300) }) });
  const body = await capped.json(); assert.equal(body.trace.length, 2_000); assert.equal(body.traceTruncated, true);
});
