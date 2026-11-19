import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './server.js';

let server, base;
before(async () => { server = createApp().listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}`; });
after(async () => { if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test('health endpoints report the disconnected database and safe request IDs', async () => {
  const health = await fetch(`${base}/health`); const body = await health.json();
  assert.equal(health.status, 503); assert.equal(body.database, 'disconnected');
  assert.equal(health.headers.get('x-request-id'), body.requestId); assert.equal(typeof body.uptime, 'number');
  const network = await fetch(`${base}/api/network/status`); const networkBody = await network.json();
  assert.equal(network.status, 503); assert.equal(networkBody.database, 'disconnected');
  assert.ok(Number.isInteger(networkBody.configuredListenPort));
});

test('malformed JSON returns a structured 400 without a stack trace', async () => {
  const response = await fetch(`${base}/api/validate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
  const body = await response.json(); assert.equal(response.status, 400); assert.match(body.error, /malformed json/i);
  assert.ok(body.requestId); assert.equal('stack' in body, false);
});
