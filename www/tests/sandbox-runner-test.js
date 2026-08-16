'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  isSandboxResultMessage,
  normalizeSandboxLogs,
} = require('../edu/assets/js/sandbox-runner.js');

const frameWindow = {};
const nonce = '0123456789abcdef0123456789abcdef';
const valid = {
  origin: 'null',
  source: frameWindow,
  data: {
    type: 'vevit-sandbox-result',
    nonce,
    logs: ['ahoj', '[WARN] pozor'],
    error: null,
  },
};

assert.equal(isSandboxResultMessage(valid, frameWindow, nonce), true);
assert.equal(isSandboxResultMessage({ ...valid, origin: 'https://vevit.cz' }, frameWindow, nonce), false);
assert.equal(isSandboxResultMessage({ ...valid, source: {} }, frameWindow, nonce), false);
assert.equal(isSandboxResultMessage({ ...valid, data: { ...valid.data, nonce: 'wrong' } }, frameWindow, nonce), false);
assert.equal(isSandboxResultMessage({ ...valid, data: { ...valid.data, extra: true } }, frameWindow, nonce), false);
assert.equal(isSandboxResultMessage({ ...valid, data: { ...valid.data, logs: [{ unsafe: true }] } }, frameWindow, nonce), false);
assert.deepEqual(normalizeSandboxLogs(['ok', 12, null, { unsafe: true }]), ['ok', '12', 'null', '[object Object]']);

const frameSource = fs.readFileSync(path.join(__dirname, '../edu/assets/js/sandbox-frame.js'), 'utf8');
assert.match(frameSource, /event\.origin === expectedParentOrigin/);
assert.match(frameSource, /event\.source === window\.parent/);
assert.match(frameSource, /data\.nonce/);
assert.match(frameSource, /window\.parent\.postMessage\([^;]+expectedParentOrigin\)/s);
assert.doesNotMatch(frameSource, /window\.parent\.postMessage\([^;]+,\s*["']\*["']\s*\)/s);

const exerciseSource = fs.readFileSync(path.join(__dirname, '../edu/js/components/exercise.js'), 'utf8');
const legacyPlaygroundSource = fs.readFileSync(path.join(__dirname, '../edu/ai-gramotnost/exercises/code-playground.js'), 'utf8');
assert.doesNotMatch(exerciseSource, /new Function|eval\s*\(/);
assert.doesNotMatch(legacyPlaygroundSource, /new Function|eval\s*\(/);
assert.match(exerciseSource, /VeVitSandboxRunner\.run/);
assert.match(legacyPlaygroundSource, /VeVitSandboxRunner\.run/);

process.stdout.write('sandbox-runner-test: PASS\n');
