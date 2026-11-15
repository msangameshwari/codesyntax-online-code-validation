import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createValidationRouter } from '../routes/validation.js';
import { getLanguageCatalog } from './validator.js';

const nl = String.fromCharCode(10);
const cases = [
  ['javascript', 'const answer = 42;', 'const = ;'],
  ['typescript', 'const answer: number = 42;', 'const answer: = 42;'],
  ['html', '<!doctype html><html><body><p>Hello</p></body></html>', '<div'],
  ['css', 'a { color: red; }', 'a { color: red;'],
  ['python', `def greet(name):${nl}    return name${nl}`, `def greet(:${nl}    pass`],
  ['c', `int main(void) {${nl} return 0;${nl}}`, `int main(void) {${nl} return 0${nl}}`],
  ['cpp', `int main() {${nl} return 0;${nl}}`, `int main() {${nl} return 0${nl}}`],
  ['java', 'class Hello { int value() { return 1; } }', 'class Hello { int value( { return 1; } }'],
  ['php', '<?php echo 1;', '<?php function foo( { return 1; }'],
  ['csharp', 'class A { int F() { return 1; } }', 'class A { int F( { return 1; } }'],
  ['go', `package main${nl}func main() {}${nl}`, `package main${nl}func main( {${nl}`],
  ['sql', 'SELECT 1;', 'SELECT FROM;'],
];
const expectedErrorLocations = {
  javascript: { line: 1, column: 7 }, typescript: { line: 1, column: 15 }, html: { line: 1, column: 5 }, css: { line: 1, column: 1 },
  python: { line: 1, column: 11 }, c: { line: 2, column: 10 }, cpp: { line: 2, column: 10 }, java: { line: 1, column: 25 },
  php: { line: 1, column: 20 }, csharp: { line: 1, column: 17 }, go: { line: 2, column: 1 }, sql: { line: 1, column: 12 },
};

let server;
let baseUrl;
let savedRecords;

before(async () => {
  savedRecords = [];
  const app = express();
  app.use(express.json({ limit: '120kb' }));
  app.use('/api/validate', createValidationRouter({
    authorize: (req, _res, next) => { req.user = { id: 'test-student' }; next(); },
    saveSubmission: async (record) => { savedRecords.push(record); return { id: `test-${savedRecords.length}` }; },
  }));
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/validate`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('all twelve real parser adapters are available in the runtime catalog', async () => {
  const catalog = await getLanguageCatalog();
  assert.equal(catalog.length, 12);
  for (const [language] of cases) {
    const entry = catalog.find((item) => item.id === language);
    assert.ok(entry, `catalog contains ${language}`);
    assert.equal(entry.supported, true, `${language} parser loads`);
    assert.ok(entry.parser, `${language} has a named parser`);
  }
});

for (const [language, validSource, invalidSource] of cases) {
  test(`${language}: HTTP validation accepts valid syntax and returns AST metadata`, async () => {
    const response = await fetch(baseUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language, source: validSource }) });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.language, language);
    assert.equal(body.status, 'valid');
    assert.equal(body.errors.length, 0);
    assert.equal(body.errorCount, 0);
    assert.equal(typeof body.processingMs, 'number');
    assert.ok(body.engine);
    assert.ok(body.ast, 'successful parser returns AST or parse-tree data');
    assert.ok(body.submissionId);
  });

  test(`${language}: HTTP validation rejects malformed syntax with line and column`, async () => {
    const response = await fetch(baseUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language, source: invalidSource }) });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.language, language);
    assert.equal(body.status, 'invalid');
    assert.ok(body.errorCount > 0);
    assert.ok(body.errors.length > 0);
    assert.ok(body.errors[0].message);
    assert.ok(Number.isInteger(body.errors[0].line) && body.errors[0].line >= 1, JSON.stringify(body.errors[0]));
    assert.ok(Number.isInteger(body.errors[0].column) && body.errors[0].column >= 1, JSON.stringify(body.errors[0]));
    assert.deepEqual({ line: body.errors[0].line, column: body.errors[0].column }, expectedErrorLocations[language]);
    assert.ok(body.ast === null || typeof body.ast === 'object', 'invalid parse may include a recovered concrete syntax tree');
    assert.ok(body.submissionId);
  });
}

test('validation rejects unknown identifiers and oversized source without persisting', async () => {
  const unknown = await fetch(baseUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language: 'javascript;process', source: '1' }) });
  assert.equal(unknown.status, 400);
  assert.match((await unknown.json()).error, /Unknown language/);
  const oversized = await fetch(baseUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language: 'javascript', source: ' '.repeat(100_001) }) });
  assert.equal(oversized.status, 413);
});

test('every validation result and AST is saved in the submission record', () => {
  assert.equal(savedRecords.length, cases.length * 2);
  for (const record of savedRecords) {
    assert.ok(record.student);
    assert.ok(record.language);
    assert.ok(record.source);
    assert.ok(['valid', 'invalid'].includes(record.status));
    assert.ok(record.engine);
  }
});
