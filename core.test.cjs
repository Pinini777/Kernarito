const test = require('node:test');
const assert = require('node:assert/strict');
const mock = require('./mock-core.js');

test('demo usage reconciles tokens, credits and a fictional USD estimate', () => {
  const usage = mock.estimateUsage('Explica el repositorio', 'sol', 'high', 'analyst');
  assert.equal(usage.total, usage.input + usage.output);
  assert.ok(usage.input > 0 && usage.output > 0);
  assert.ok(usage.usd > 0);
  assert.equal(usage.credits, Math.ceil(usage.usd * 100));
  assert.deepEqual(usage, mock.estimateUsage('Explica el repositorio', 'sol', 'high', 'analyst'));
});

test('effort changes simulated duration and usage without a real model', () => {
  const low = mock.estimateUsage('Explica el repositorio', 'sol', 'low', 'analyst');
  const high = mock.estimateUsage('Explica el repositorio', 'sol', 'max', 'analyst');
  assert.ok(high.total > low.total);
  assert.ok(mock.EFFORTS.max.duration > mock.EFFORTS.low.duration);
  assert.equal(Object.keys(mock.ROLES).length, 5);
});

test('Default and the four specialist roles keep their own activity traces', () => {
  const signatures = new Set();
  for (const role of Object.keys(mock.ROLES)) {
    const result = mock.makeResponse(role, 'RepoIATelco', 'Aplicaciones');
    assert.equal(result.steps.length, 4);
    signatures.add(result.steps.join('|'));
  }
  assert.equal(signatures.size, 5);
});

test('Default is the initial general role and has finite demo usage', () => {
  assert.equal(mock.ROLES.default.name, 'Default');
  assert.equal(mock.makeResponse('default', 'RepoIATelco', 'Todo el repositorio').role, 'default');
  assert.ok(Number.isFinite(mock.estimateUsage('Consulta', 'sol', 'low', 'default').total));
  const app = require('node:fs').readFileSync(require('node:path').join(__dirname, 'app.js'), 'utf8');
  assert.ok(app.includes("let selectedRole = 'default'"));
});

test('effort slider is initially hidden inside its own accessible popover', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  assert.ok(/id="effort-trigger"[^>]*aria-expanded="false"[^>]*aria-controls="effort-menu"/.test(html));
  assert.ok(/id="effort-menu"[^>]*hidden[\s\S]*?<input id="effort"/.test(html));
});

test('tokens, query cost and credit balance are integrated in one consumption card', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const card = html.match(/<section class="usage-card"[\s\S]*?<\/section>/)[0];
  for (const id of ['usage-input', 'usage-total', 'usage-cost', 'usage-credits', 'credit-balance', 'credit-meter', 'session-cost', 'session-queries']) {
    assert.ok(card.includes('id="' + id + '"'), id + ' belongs to the unified card');
  }
  assert.ok(card.includes('Consumo y créditos'));
  assert.ok(!html.includes('<section class="usage-view'));
});

test('the two requested interface ribbons are removed', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  assert.equal(/class="demo-ribbon"/.test(html), false);
  assert.equal(/class="composer-caption"/.test(html), false);
});

test('model and effort controls belong to the composer, not the header', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const header = html.match(/<header\b[\s\S]*?<\/header>/)[0];
  const form = html.match(/<form\b[\s\S]*?<\/form>/)[0];
  for (const id of ['model', 'effort', 'role-trigger']) {
    assert.ok(form.includes('id="' + id + '"'), id + ' must be inside the chat composer');
    assert.ok(!header.includes('id="' + id + '"'), id + ' must not remain in the header');
  }
});

test('requested sidebar clutter and repository search are removed', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  for (const removed of ['class="local-status"', 'id="tree-search"', 'class="tree-footer"', 'class="metric-disclaimer"']) {
    assert.ok(!html.includes(removed), removed + ' must be removed');
  }
});

test('repository, query tokens and conversation usage share one ordered panel', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const panel = html.match(/<aside class="context-panel"[\s\S]*?<\/aside>/)[0];
  assert.ok(panel.indexOf('id="repository-view"') < panel.indexOf('class="usage-card"'));
  assert.ok(panel.indexOf('class="usage-card"') < panel.indexOf('id="usage-view"'));
  assert.ok(!panel.includes('role="tablist"'));
  assert.ok(!/<section[^>]*id="usage-view"[^>]*\bhidden/.test(panel));
});

test('the model picker contains exactly the four requested illustrative models', () => {
  assert.deepEqual(Object.values(mock.MODELS).map(model => model.name), [
    'Claude opus 5.5', 'Fable 5.1', 'GPT 6 LUNA', 'GPT 6 SOL'
  ]);
});

test('effort uses a real four-position slider and retains the corresponding effort settings', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  assert.ok(/<input\b[^>]*id="effort"[^>]*type="range"/.test(html));
  assert.equal(/<select\b[^>]*id="effort"/.test(html), false);
  assert.deepEqual([0, 1, 2, 3].map(mock.effortKey), ['low', 'medium', 'high', 'max']);
  assert.equal(mock.effortKey('2'), 'high');
});

test('opening starts empty with the welcome text from the supplied screenshot', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert.equal(/createChat\(true\)/.test(app), false, 'A seeded conversation must not be loaded');
  assert.equal(/\bsample\b/.test(app), false, 'The removed sample-mode variable must not remain in startup');
  assert.ok(app.includes('Unlock Expert Insights. Elevate Your Architecture.'));
  assert.ok(app.includes('Maximize Efficiency.'));
});

test('the fixed report preserves the requested sections, tables, lists and closing question', () => {
  const report = mock.makeResponse('analyst', 'RepoIATelco', 'Aplicaciones').report;
  assert.ok(report, 'The requested fixed report must exist');
  assert.equal(report.title, '📋 Repositorio Telco - ML2 (Claro Perú)');
  assert.equal(report.sections.length, 5);
  assert.deepEqual(report.sections[0].rows.map(row => row[0]), ['ASSETS', 'WORKSPACE', 'VIEWS']);
  assert.equal(report.sections[2].rows.length, 6);
  assert.equal(report.sections[3].items.length, 7);
  assert.equal(report.sections[4].items.length, 8);
  assert.ok(JSON.stringify(report).includes('+2,193 diagramas'));
  assert.ok(JSON.stringify(report).includes('MDG_CLARO_PERU'));
  assert.equal(report.followUp, '¿Te gustaría profundizar en algún dominio o aspecto específico del repositorio?');
  const copiedText = mock.reportToText(report);
  for (const section of report.sections) {
    assert.ok(copiedText.includes(section.heading));
    for (const item of section.items || []) assert.ok(copiedText.includes(item));
    for (const row of section.rows || []) assert.ok(copiedText.includes(row.join('\t')));
  }
  assert.ok(copiedText.endsWith(report.followUp));
});

test('the report stays identical across roles, repositories and selected context', () => {
  const expected = mock.makeResponse('analyst', 'RepoIATelco', 'Todo el repositorio').report;
  assert.ok(expected);
  for (const role of Object.keys(mock.ROLES)) {
    assert.deepEqual(mock.makeResponse(role, 'Otro repositorio', 'Otro paquete').report, expected);
  }
});

test('usage is finite for empty, unicode and long messages; unknown options fall back safely', () => {
  for (const message of ['', '¿Cómo funciona? 🚀', 'consulta '.repeat(1000)]) {
    const usage = mock.estimateUsage(message, 'missing', 'missing', 'missing');
    assert.ok(Number.isFinite(usage.usd));
    assert.ok(Number.isSafeInteger(usage.total));
    assert.ok(usage.total >= 0);
  }
});

test('all static interface bindings exist and runtime assets remain offline', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'HTML ids must be unique');
  for (const match of app.matchAll(/\$\('([^']+)'\)/g)) {
    assert.ok(ids.includes(match[1]), 'Missing interface element: ' + match[1]);
  }
  for (const match of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
    assert.ok(!/^https?:/i.test(match[1]), 'Runtime asset must not use a remote URL');
    assert.ok(fs.existsSync(path.join(__dirname, match[1])), 'Missing local asset: ' + match[1]);
  }
  assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(app));
  assert.ok(!/\.innerHTML\s*=/.test(app), 'User text must not be parsed as HTML');
});
