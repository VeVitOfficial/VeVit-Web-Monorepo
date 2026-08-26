import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';

const base = process.env.VEVIT_TOOLS_TEST_URL || 'http://127.0.0.1:8765';
const routePrefix = process.env.VEVIT_TOOLS_TEST_PREFIX || '';
const debugPort = 9326;
const profile = `/tmp/vevit-tools-browser-${process.pid}`;
const chrome = spawn('chromium', [
  '--headless', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profile}`, '--window-size=1440,900', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

async function waitForJson(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try { const response = await fetch(url); if (response.ok) return response.json(); } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Chromium debugging endpoint did not start: ${url}`);
}

let socket;
let nextId = 0;
const pending = new Map();
const exceptions = [];

function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

function once(method, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${method}`)), timeout);
    const handler = event => {
      const message = JSON.parse(event.data);
      if (message.method !== method) return;
      clearTimeout(timer); socket.removeEventListener('message', handler); resolve(message.params);
    };
    socket.addEventListener('message', handler);
  });
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || expression);
  return result.result.value;
}

async function visit(slug) {
  const loaded = once('Page.loadEventFired');
  await command('Page.navigate', { url: `${base}${routePrefix}/tools/${slug}` });
  await loaded;
  await new Promise(resolve => setTimeout(resolve, 120));
}

const families = [
  ['pdf', 'pdf-rotate'], ['image', 'image-crop'], ['media', 'video-trim'],
  ['text', 'text-counter'], ['ai', 'ai-chat'], ['dev', 'json-formatter'],
  ['security', 'password-gen'], ['calc', 'loan-calc'],
];
const widths = [320, 375, 768, 1024, 1440];

try {
  const version = await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
  const targetResponse = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' });
  const target = await targetResponse.json();
  socket = new WebSocket(target.webSocketDebuggerUrl || version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id); pending.delete(message.id);
      if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text || 'runtime exception');
  });
  await command('Page.enable'); await command('Runtime.enable');

  let checks = 0;
  for (const width of widths) {
    await command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    for (const [category, slug] of families) {
      exceptions.length = 0;
      const loaded = once('Page.loadEventFired');
      await command('Page.navigate', { url: `${base}${routePrefix}/tools/${slug}` });
      await loaded;
      await new Promise(resolve => setTimeout(resolve, 120));
      const state = await evaluate(`({
        title: document.querySelector('h1')?.textContent.trim(),
        root: !!document.getElementById('tool-root'),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        offenders: Array.from(document.querySelectorAll('body *')).filter(el => { const r = el.getBoundingClientRect(); return r.right > document.documentElement.clientWidth + 1 || r.left < -1; }).slice(0, 6).map(el => ({ tag: el.tagName, id: el.id, cls: el.className, right: Math.round(el.getBoundingClientRect().right), width: Math.round(el.getBoundingClientRect().width) })),
        width: document.documentElement.clientWidth,
        state: document.getElementById('tool-root')?.dataset.toolState
      })`);
      if (!state.title || !state.root || state.overflow || state.width > width || state.width < width - 20 || !state.state) {
        throw new Error(`${category}/${slug} failed at ${width}px: ${JSON.stringify(state)}`);
      }
      await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      const focus = await evaluate(`document.activeElement !== document.body && document.activeElement !== document.documentElement`);
      if (!focus) throw new Error(`${category}/${slug} has no keyboard focus target at ${width}px`);
      if (exceptions.length) throw new Error(`${category}/${slug} runtime exceptions: ${exceptions.join('; ')}`);
      checks++;
    }
  }

  await command('Emulation.setDeviceMetricsOverride', { width: 1024, height: 900, deviceScaleFactor: 1, mobile: false });
  await visit('json-formatter');
  const jsonPaths = await evaluate(`(async () => {
    const input = document.getElementById('jf-input');
    input.value = '{broken'; input.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('jf-format').click();
    const invalid = !document.getElementById('jf-error').classList.contains('hidden');
    input.value = '{"ok":true}'; input.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('jf-format').click();
    const valid = document.getElementById('jf-output').value.includes('"ok": true') && !document.getElementById('jf-download').disabled;
    document.getElementById('jf-clear').click();
    return { invalid, valid, reset: input.value === '' && document.getElementById('jf-output').value === '' };
  })()`);
  if (!jsonPaths.invalid || !jsonPaths.valid || !jsonPaths.reset) throw new Error(`json formatter interaction failed: ${JSON.stringify(jsonPaths)}`);

  await visit('text-counter');
  const textPath = await evaluate(`(() => { const field = document.getElementById('tc-in'); field.value = 'One two. Three.'; field.dispatchEvent(new Event('input', { bubbles: true })); return { words: document.getElementById('tc-words').textContent, sentences: document.getElementById('tc-sent').textContent }; })()`);
  if (textPath.words !== '3' || textPath.sentences !== '2') throw new Error(`text counter interaction failed: ${JSON.stringify(textPath)}`);

  await visit('password-gen');
  const passwordPath = await evaluate(`(() => { document.getElementById('pw-generate').click(); const value = document.getElementById('pw-out').value; return { length: value.length, copy: document.getElementById('pw-copy').disabled, stored: Object.keys(localStorage).some(key => /pass|token|secret/i.test(key)) }; })()`);
  if (passwordPath.length !== 16 || passwordPath.copy || passwordPath.stored) throw new Error(`password generator interaction failed: ${JSON.stringify(passwordPath)}`);

  await visit('loan-calc');
  const loanPath = await evaluate(`(() => { const amount = document.getElementById('ln-amount'); const extra = document.getElementById('ln-extra'); extra.value = '1000'; extra.dispatchEvent(new Event('input', { bubbles: true })); const valid = document.getElementById('ln-payment').textContent !== '—' && parseFloat(document.getElementById('ln-principal-bar').style.width) > 0; amount.value = '0'; amount.dispatchEvent(new Event('input', { bubbles: true })); const invalid = document.getElementById('ln-payment').textContent === '—'; amount.value = '500000'; amount.dispatchEvent(new Event('input', { bubbles: true })); return { valid, invalid, reset: document.getElementById('ln-payment').textContent !== '—' }; })()`);
  if (!loanPath.valid || !loanPath.invalid || !loanPath.reset) throw new Error(`loan calculator interaction failed: ${JSON.stringify(loanPath)}`);

  await visit('ai-chat');
  const aiPath = await evaluate(`(() => { const starter = document.querySelector('.ai-starter'); starter.click(); const filled = document.getElementById('ai-input').value.length > 0; document.getElementById('ai-new').click(); return { filled, cleared: document.getElementById('ai-input').value === '' }; })()`);
  if (!aiPath.filled || !aiPath.cleared) throw new Error(`AI chat starter/reset failed: ${JSON.stringify(aiPath)}`);

  for (const slug of ['pdf-rotate', 'image-crop', 'video-trim']) {
    await visit(slug);
    const invalidUpload = await evaluate(`(async () => { const input = document.querySelector('.dropzone input[type="file"]'); const transfer = new DataTransfer(); transfer.items.add(new File(['not valid'], 'wrong.txt', { type: 'text/plain' })); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 40)); return Array.from(document.querySelectorAll('.error-text')).some(node => !node.classList.contains('hidden') && node.textContent.trim()); })()`);
    if (!invalidUpload) throw new Error(`${slug} did not reject an invalid upload`);
  }

  await visit('pdf-rotate');
  const pdfPath = await evaluate(`(async () => {
    const wait = async predicate => { for (let i = 0; i < 100; i++) { if (predicate()) return true; await new Promise(resolve => setTimeout(resolve, 50)); } return false; };
    await ToolUI.loadScript('/tools/assets/js/lib/pdf-lib.min.js');
    const doc = await PDFLib.PDFDocument.create(); doc.addPage([300, 500]); doc.addPage([500, 300]);
    const bytes = await doc.save(); const transfer = new DataTransfer(); transfer.items.add(new File([bytes], 'mixed-pages.pdf', { type: 'application/pdf' }));
    const input = document.querySelector('.dropzone input[type="file"]'); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
    const preview = await wait(() => document.querySelectorAll('#pr-preview canvas').length === 2 && !document.getElementById('pr-work').classList.contains('hidden'));
    document.getElementById('pr-angle').value = '180'; document.getElementById('pr-angle').dispatchEvent(new Event('change', { bubbles: true })); document.getElementById('pr-run').click();
    const result = await wait(() => !!document.querySelector('.tool-auto-result.result-card:not(.hidden)'));
    return { preview, result, error: document.getElementById('pr-error').textContent, state: document.getElementById('tool-root').dataset.toolState, disabled: document.getElementById('pr-run').disabled };
  })()`);
  if (!pdfPath.preview || !pdfPath.result) throw new Error(`PDF rotate happy path failed: ${JSON.stringify(pdfPath)}`);

  await visit('image-crop');
  const imagePath = await evaluate(`(async () => {
    const wait = async predicate => { for (let i = 0; i < 80; i++) { if (predicate()) return true; await new Promise(resolve => setTimeout(resolve, 50)); } return false; };
    const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 24; const context = canvas.getContext('2d'); context.fillStyle = '#10b981'; context.fillRect(0, 0, 32, 24);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png')); const transfer = new DataTransfer(); transfer.items.add(new File([blob], 'transparent.png', { type: 'image/png' }));
    const input = document.querySelector('.dropzone input[type="file"]'); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
    const loaded = await wait(() => !document.getElementById('cr-work').classList.contains('hidden'));
    [['cr-x', 0], ['cr-y', 0], ['cr-w', 16], ['cr-h', 12]].forEach(([id, value]) => { const field = document.getElementById(id); field.value = value; field.dispatchEvent(new Event('input', { bubbles: true })); });
    document.getElementById('cr-apply').click(); const result = await wait(() => !!document.querySelector('.tool-auto-result.result-card:not(.hidden)') && !document.getElementById('cr-result-preview').classList.contains('hidden'));
    return { loaded, result };
  })()`);
  if (!imagePath.loaded || !imagePath.result) throw new Error(`image crop happy path failed: ${JSON.stringify(imagePath)}`);

  checks += 10;
  console.log(`PASS browser smoke: ${checks} viewport and interaction checks; valid/error/reset paths, overflow, runtime and keyboard focus verified.`);
} finally {
  if (socket) socket.close();
  chrome.kill('SIGTERM');
  if (chrome.exitCode === null) await new Promise(resolve => chrome.once('exit', resolve));
  for (let attempt = 0; attempt < 5; attempt++) {
    try { await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); break; }
    catch (error) { if (attempt === 4) throw error; await new Promise(resolve => setTimeout(resolve, 150)); }
  }
}
