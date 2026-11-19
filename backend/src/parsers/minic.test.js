import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMiniC, runMiniC } from './minic.js';

test('MiniC Core accepts each permitted statement, alternatives and empty program', () => {
  for (const source of ['', 'int count = 10;', 'float rate = 2.5;', 'char letter = 1;', 'count = count + 5;', 'count = 5 - 2;', 'return 15;', 'return 2.5;']) {
    const parsed = parseMiniC(source, 'core');
    assert.equal(parsed.valid, true, `${source}: ${JSON.stringify(parsed.errors)}`);
    assert.ok(parsed.cst && parsed.ast);
  }
});

test('MiniC Core rejects constructs outside the assessment grammar with 1-based positions', () => {
  for (const source of ['int = 10;', 'count = + 5;', 'return;', 'int value = 10', 'x = 2 * 3;']) {
    const parsed = parseMiniC(source, 'core');
    assert.equal(parsed.valid, false, source);
    assert.ok(parsed.errors[0].line >= 1 && parsed.errors[0].column >= 1);
  }
});

test('MiniC Extended interpreter output depends on submitted source', () => {
  for (const [source, expected] of [['print(10 + 20);', '30'], ['print(4 * 5);', '20']]) {
    const parsed = parseMiniC(source, 'extended');
    assert.equal(parsed.valid, true, JSON.stringify(parsed.errors));
    const result = runMiniC(parsed.ast);
    assert.equal(result.ok, true);
    assert.equal(result.output, expected);
    assert.equal(result.exitCode, 0);
  }
});

test('MiniC interpreter enforces a loop step bound and never executes invalid source', () => {
  const infinite = parseMiniC('int i = 0; while (true) { i = i + 1; }', 'extended');
  assert.equal(infinite.valid, true);
  const limited = runMiniC(infinite.ast, { maxSteps: 100 });
  assert.equal(limited.ok, false);
  assert.equal(limited.timedOut, true);
  const invalid = parseMiniC('print(1 + );', 'extended');
  assert.equal(invalid.valid, false);
  assert.equal(invalid.ast, null);
});
