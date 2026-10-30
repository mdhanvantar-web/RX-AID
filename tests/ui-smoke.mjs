/* UI smoke test for the RX-AID Prescription Change Detector.
   Launches headless Chrome via CDP, seeds synthetic prescriptions, and checks
   the comparison flow at desktop and mobile widths.
   Run with: npm run test:ui   (Windows: Chrome or Edge required) */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const APP_URL = process.env.RX_AID_URL ?? 'http://127.0.0.1:4173';
const DEBUG_PORT = 9333;
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function findBrowser() {
  for (const candidate of CHROME_CANDIDATES) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  throw new Error('No Chrome/Edge executable found. Set CHROME_PATH to run this test.');
}

let medSeq = 0;
function med(overrides) {
  medSeq += 1;
  return {
    id: `smoke-med-${medSeq}`,
    medicineName: 'Medicine',
    strength: '500mg',
    dose: '1 tablet',
    frequency: 'Once daily',
    timings: ['morning'],
    foodInstruction: 'After food',
    duration: '30 days',
    notes: null,
    route: null,
    unclear: false,
    unclearFields: [],
    ...overrides,
  };
}

const previousMeds = [
  med({ medicineName: 'Metformin', strength: '500mg', frequency: 'Twice daily', timings: ['morning', 'evening'] }),
  med({ medicineName: 'Amlodipine', strength: '5mg', frequency: 'Once daily', foodInstruction: 'Before food' }),
  med({ medicineName: 'Atorvastatin', strength: '10mg', frequency: 'Once daily', timings: ['night'] }),
];

const newMeds = [
  med({ medicineName: 'Metformin', strength: '1000mg', frequency: 'Twice daily', timings: ['morning', 'evening'] }),
  med({ medicineName: 'Atorvastatin', strength: '10mg', frequency: 'Once daily', timings: ['night'] }),
  med({ medicineName: 'Aspirin', strength: '75mg', frequency: 'Once daily', foodInstruction: 'After food' }),
];

const previousRx = {
  id: 'rx-smoke-previous',
  imageDataUrl: '/sample_prescription.jpg',
  imageFileName: 'previous_synthetic_prescription.jpg',
  uploadedAt: '2026-09-01T09:30:00.000Z',
  status: 'active',
  extracted: {
    medications: previousMeds,
    patientName: 'Ramaiah Naidu',
    doctorName: 'Dr. Suresh Kumar',
    prescriptionDate: '2026-09-01',
    rawText: null,
    extractionWarnings: [],
    confidence: 'high',
  },
  verified: {
    medications: previousMeds,
    patientName: 'Ramaiah Naidu',
    doctorName: 'Dr. Suresh Kumar',
    prescriptionDate: '2026-09-01',
    rawText: null,
    extractionWarnings: [],
    confidence: 'high',
  },
  errorMessage: null,
};

const newRx = {
  id: 'rx-smoke-new',
  imageDataUrl: '/sample_prescription.jpg',
  imageFileName: 'new_synthetic_prescription.jpg',
  uploadedAt: '2026-10-30T10:15:00.000Z',
  status: 'extracted',
  extracted: {
    medications: newMeds,
    patientName: 'Ramaiah Naidu',
    doctorName: 'Dr. Suresh Kumar',
    prescriptionDate: '2026-10-30',
    rawText: null,
    extractionWarnings: ['One instruction may be incomplete.'],
    confidence: 'medium',
  },
  verified: null,
  errorMessage: null,
};

const seededState = {
  prescriptions: [newRx, previousRx],
  activePrescriptionId: previousRx.id,
  comparisons: [],
  doses: [],
  cart: [],
  orders: [],
};

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
      }
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

async function waitForDebugPort() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (response.ok) return;
    } catch {
      // not ready yet
    }
    await sleep(150);
  }
  throw new Error('Chrome debugging port did not open');
}

async function main() {
  const browserPath = findBrowser();
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rxaid-ui-'));
  const screenshotDir = path.join(profileDir, 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const chrome = spawn(
    browserPath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profileDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  const checks = [];
  const check = (name, fn) => {
    try {
      fn();
      checks.push({ name, ok: true });
      console.log(`  ✓ ${name}`);
    } catch (error) {
      checks.push({ name, ok: false, error: error.message });
      console.error(`  ✗ ${name}\n    ${error.message}`);
    }
  };

  let cdp;
  try {
    await waitForDebugPort();
    const targetResponse = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, {
      method: 'PUT',
    });
    const target = await targetResponse.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    cdp = new CDP(ws);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const evaluate = async expression => {
      const result = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return result.result.value;
    };

    const navigate = async route => {
      await cdp.send('Page.navigate', { url: `${APP_URL}${route}` });
      await sleep(1400);
    };

    const bodyText = () => evaluate('document.body.innerText');
    const waitForText = async (text, timeout = 8000) => {
      const started = Date.now();
      while (Date.now() - started < timeout) {
        const body = await bodyText();
        if (body.includes(text)) return body;
        await sleep(200);
      }
      return bodyText();
    };

    const screenshot = async name => {
      const result = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const file = path.join(screenshotDir, `${name}.png`);
      fs.writeFileSync(file, Buffer.from(result.data, 'base64'));
      return file;
    };

    await navigate('/');
    await evaluate(`localStorage.setItem('rxaid_app_state_v2', ${JSON.stringify(JSON.stringify(seededState))}); true;`);

    // 1. History page
    await navigate('/prescriptions');
    let body = await waitForText('Prescription History');
    check('history page lists both saved versions', () => {
      assert.ok(body.includes('Prescription History'));
      assert.ok(body.includes('Version 1'));
      assert.ok(body.includes('Version 2'));
      assert.ok(body.includes('Compare Two Saved Versions'));
    });
    await screenshot('history-desktop');

    // 2. Comparison page
    await navigate(`/prescriptions/compare/${newRx.id}/${previousRx.id}`);
    body = await waitForText('Total medicines compared');
    check('comparison summary shows all categories', () => {
      assert.ok(body.includes('Prescription Comparison'));
      assert.ok(body.includes('Total medicines compared'));
      assert.ok(body.includes('Unchanged'));
      assert.ok(body.includes('Added'));
      assert.ok(body.includes('Changed'));
      assert.ok(body.includes('No longer listed'));
      assert.ok(body.includes('Needs review'));
    });
    check('comparison shows medicine-level results', () => {
      assert.ok(body.includes('Metformin'));
      assert.ok(body.includes('1000mg'));
      assert.ok(body.includes('Aspirin'));
      assert.ok(body.includes('Amlodipine'));
      assert.ok(body.includes('Atorvastatin'));
    });
    check('comparison shows the non-negotiable safety notice', () => {
      assert.ok(body.includes('review tool, not medical advice'));
      assert.ok(body.includes('does not prove the doctor changed the medicine'));
    });
    const desktopOverflow = await evaluate(
      'document.documentElement.scrollWidth <= window.innerWidth + 1'
    );
    check('desktop layout has no horizontal overflow', () => assert.equal(desktopOverflow, true));
    const desktopShot = await screenshot('comparison-desktop');

    // 3. Dashboard notifications
    await navigate('/');
    body = await waitForText('changes detected');
    check('dashboard shows comparison notification and pending verification', () => {
      assert.ok(body.includes('3 changes detected in your new prescription.'));
      assert.ok(body.includes('Your latest prescription is awaiting verification.'));
    });

    // 4. Pharmacy flags
    await navigate('/pharmacies');
    body = await waitForText('Needs clarification before ordering');
    check('pharmacy holds changed medicine for clarification', () => {
      assert.ok(body.includes('Needs clarification before ordering'));
      assert.ok(body.includes('Order paused'));
    });
    const flaggedText = await evaluate(
      "Array.from(document.querySelectorAll('.product-card--flagged')).map(el => el.innerText).join(' ') || ''"
    );
    check('flagged pharmacy card is the changed medicine', () => {
      assert.ok(flaggedText.includes('Metformin'));
    });

    // 5. Cart blocking
    await evaluate(`(() => {
      const raw = JSON.parse(localStorage.getItem('rxaid_app_state_v2'));
      raw.cart = [{
        id: 'smoke-cart-item',
        quantity: 1,
        prescriptionId: '${previousRx.id}',
        product: {
          id: 'smoke-product-metformin',
          pharmacyId: 'store-local',
          pharmacyName: 'Synthetic Test Pharmacy',
          medicineName: 'Metformin',
          strength: '500mg',
          dosageForm: 'Tablet',
          packInfo: 'Strip of 10 tablets',
          price: 45,
          deliveryFee: 0,
          totalPayable: 45,
          inStock: true,
          prescriptionRequired: true
        }
      }];
      localStorage.setItem('rxaid_app_state_v2', JSON.stringify(raw));
      return true;
    })()`);
    await navigate('/cart');
    body = await waitForText('Ordering paused');
    check('cart pauses ordering for flagged medicine', () => {
      assert.ok(body.includes('Ordering paused for 1 item'));
      assert.ok(body.includes('Resolve Flagged Medicines Before Ordering'));
    });
    const checkoutDisabled = await evaluate(
      "document.getElementById('proceed-checkout-btn')?.disabled === true"
    );
    check('checkout button is disabled while flagged', () => assert.equal(checkoutDisabled, true));

    // 6. Mobile layout
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await navigate(`/prescriptions/compare/${newRx.id}/${previousRx.id}`);
    body = await waitForText('Total medicines compared');
    const mobileOverflow = await evaluate(
      'document.documentElement.scrollWidth <= window.innerWidth + 1'
    );
    check('mobile comparison layout has no horizontal overflow', () =>
      assert.equal(mobileOverflow, true)
    );
    check('mobile comparison still shows all category sections', () => {
      assert.ok(body.includes('Aspirin'));
      assert.ok(body.includes('Amlodipine'));
      assert.ok(body.includes('Metformin'));
    });
    const mobileShot = await screenshot('comparison-mobile');

    await navigate('/prescriptions');
    await waitForText('Prescription History');
    const mobileHistoryOverflow = await evaluate(
      'document.documentElement.scrollWidth <= window.innerWidth + 1'
    );
    check('mobile history layout has no horizontal overflow', () =>
      assert.equal(mobileHistoryOverflow, true)
    );
    await screenshot('history-mobile');

    await navigate('/pharmacies');
    body = await waitForText('Needs clarification before ordering');
    const mobilePharmacyOverflow = await evaluate(
      'document.documentElement.scrollWidth <= window.innerWidth + 1'
    );
    check('mobile pharmacy layout shows the clarification block without overflow', () => {
      assert.ok(body.includes('Needs clarification before ordering'));
      assert.equal(mobilePharmacyOverflow, true);
    });
    await screenshot('pharmacy-mobile');

    await navigate('/cart');
    body = await waitForText('Ordering paused');
    const mobileCartOverflow = await evaluate(
      'document.documentElement.scrollWidth <= window.innerWidth + 1'
    );
    check('mobile cart layout pauses ordering without overflow', () => {
      assert.ok(body.includes('Resolve Flagged Medicines Before Ordering'));
      assert.equal(mobileCartOverflow, true);
    });
    await screenshot('cart-mobile');

    console.log(`\nScreenshots:\n  ${desktopShot}\n  ${mobileShot}`);
  } finally {
    try {
      cdp?.ws?.close();
    } catch {
      // ignore
    }
    chrome.kill();
  }

  const failed = checks.filter(item => !item.ok);
  console.log(`\n${checks.length - failed.length} passed, ${failed.length} failed\n`);
  if (failed.length > 0) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
