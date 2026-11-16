/* Browser checks for the official site screens. Requires Playwright and a local server with ANALYSIS_DEMO_ENABLED=true. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const D = require('../public/js/demo-data.js');

const base = process.env.DEMO_BASE_URL || 'http://127.0.0.1:4173';
const output = process.env.DEMO_QA_DIR || '/tmp/adaptive-demo-qa';
fs.mkdirSync(output, { recursive: true });

const official = page => `${base}/sitio/html/${page}.html`;
const file = (name = 'test.replay', content = 'synthetic') => ({
  name,
  mimeType: 'application/octet-stream',
  buffer: Buffer.from(content)
});

let runningBrowser;

(async () => {
  assert.equal(D.aggregate([{ shots: 1, goals: 1 }, { shots: 9, goals: 0 }]).shooting_pct, 10);
  assert.equal(D.aggregate([{ shots: 0, goals: 0 }]).shooting_pct, null);
  assert.equal(D.diagnose({ shooting_pct: null, boost_low_pct: null }).length, 0);
  assert.equal(
    D.compare(D.initial, { ...D.followup, context: { ...D.followup.context, mode: '3v3' } }).status,
    'not_comparable'
  );
  assert.equal(D.analysis('followup').data.comparison.deltas.shooting_pct.delta, 5);

  for (const scenario of ['initial', 'followup']) {
    for (const minutes of [20, 40]) {
      const plan = D.plan({ scenario, minutes }, 1).data;
      assert.equal(plan.exercises.reduce((total, exercise) => total + exercise.assigned_minutes, 0), minutes);
      assert.ok(plan.exercises.every(exercise => exercise.assigned_minutes > 0));
      assert.ok(plan.diagnosis_snapshot.priorities.length <= 3);
    }
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.DEMO_CHROMIUM_EXECUTABLE || undefined,
    args: ['--no-sandbox']
  });
  runningBrowser = browser;
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(official('replays'));
  await page.locator('#file-count').waitFor();
  await page.screenshot({ path: `${output}/replays-desktop.png`, fullPage: true });
  assert.equal(await page.locator('#process-block').isDisabled(), true);

  await page.locator('#replay-input').setInputFiles(
    Array.from({ length: 4 }, (_, index) => file(`p${index}.replay`))
  );
  assert.match(await page.locator('#file-notice').textContent(), /exactamente cinco/);
  assert.equal(await page.locator('#process-block').isDisabled(), true);

  await page.locator('#replay-input').setInputFiles(
    Array.from({ length: 6 }, (_, index) => file(`p${index}.replay`))
  );
  assert.equal(await page.locator('#process-block').isDisabled(), true);

  await page.locator('#replay-input').setInputFiles([
    file('x.txt'),
    ...Array.from({ length: 4 }, (_, index) => file(`p${index}.replay`))
  ]);
  assert.match(await page.locator('#file-notice').textContent(), /extensión/);

  await page.locator('#replay-input').setInputFiles([
    file('same.replay'),
    file('same.replay'),
    file('a.replay'),
    file('b.replay'),
    file('c.replay')
  ]);
  assert.match(await page.locator('#file-notice').textContent(), /repetidos/);

  await page.goto(`${official('analisis')}?scenario=initial&minutes=40`);
  await page.locator('.priority-card').first().waitFor();
  assert.match(await page.locator('#comparison-message').textContent(), /línea base/);
  assert.equal(await page.locator('.priority-card').count(), 1);
  await page.locator('#scenario-select').selectOption('followup');
  await page.waitForFunction(() => document.getElementById('comparison-message').textContent.includes('+5 puntos porcentuales'));
  assert.match(await page.locator('#comparison-message').textContent(), /\+5 puntos porcentuales/);
  assert.equal(await page.locator('.priority-card').count(), 1);
  await page.screenshot({ path: `${output}/analisis-desktop.png`, fullPage: true });

  await page.goto(`${official('plan')}?scenario=followup&minutes=20`);
  await page.locator('.exercise').first().waitFor();
  assert.match(await page.locator('#plan-duration').textContent(), /20/);
  assert.equal(await page.locator('#version-select option').count(), 2);
  const durations = await page.locator('.exercise-minutes').allTextContents();
  assert.equal(durations.reduce((total, value) => total + parseInt(value, 10), 0), 20);
  await page.locator('#version-select').selectOption('0');
  await page.waitForFunction(() => document.getElementById('historical-note').hidden === false);
  assert.match(await page.locator('#plan-duration').textContent(), /40/);
  await page.screenshot({ path: `${output}/plan-desktop.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of ['replays', 'analisis', 'plan']) {
    await page.goto(`${official(name)}?scenario=followup&minutes=20`);
    if (name === 'analisis') await page.locator('.priority-card').first().waitFor();
    if (name === 'plan') await page.locator('.exercise').first().waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      `Horizontal overflow: ${name}`
    );
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('a[aria-current=page]').count(), 1);
    await page.screenshot({ path: `${output}/${name}-mobile.png`, fullPage: true });
  }

  assert.deepEqual(errors, []);
  await browser.close();
  console.log(JSON.stringify({
    result: 'passed',
    checks: [
      'official replays validation',
      'official analysis comparison and priorities',
      'official plan versions and minute allocation',
      '390px responsive official views',
      'zero JavaScript errors'
    ],
    screenshots: output
  }, null, 2));
})().catch(async error => {
  console.error(error);
  if (runningBrowser) await runningBrowser.close();
  process.exitCode = 1;
});
