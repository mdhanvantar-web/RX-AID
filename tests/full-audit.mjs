/* Full prototype audit for RX-AID.
   Visits every route at desktop and mobile widths, checks for runtime errors,
   broken images, horizontal overflow, the history/compare entry points, the
   verification safety gate, and the post-activation pharmacy/dashboard state.
   Run with: npm run test:audit   (requires the production preview on :4173) */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const APP_URL = process.env.RX_AID_URL ?? 'http://127.0.0.1:4173';
const DEBUG_PORT = 9335;
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

function med(overrides) {
  return {
    id: 'med',
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
  med({ id: 'prev-metformin', medicineName: 'Metformin', strength: '500mg', frequency: 'Twice daily', timings: ['morning', 'evening'] }),
  med({ id: 'prev-amlodipine', medicineName: 'Amlodipine', strength: '5mg', frequency: 'Once daily', timings: ['morning'], foodInstruction: 'Before food' }),
  med({ id: 'prev-atorvastatin', medicineName: 'Atorvastatin', strength: '10mg', frequency: 'Once daily', timings: ['night'] }),
];

const newMeds = [
  med({ id: 'new-metformin', medicineName: 'Metformin', strength: '1000mg', frequency: 'Twice daily', timings: ['morning', 'evening'] }),
  med({ id: 'new-atorvastatin', medicineName: 'Atorvastatin', strength: '10mg', frequency: 'Once daily', timings: ['night'] }),
  med({ id: 'new-aspirin', medicineName: 'Aspirin', strength: '75mg', frequency: 'Once daily', timings: ['morning'] }),
];

function extraction(meds, patientName, date) {
  return {
    medications: meds,
    patientName,
    doctorName: 'Dr. Suresh Kumar',
    prescriptionDate: date,
    rawText: null,
    extractionWarnings: [],
    confidence: 'high',
  };
}

const previousRx = {
  id: 'rx-audit-previous',
  imageDataUrl: '/sample_prescription.jpg',
  imageFileName: 'audit_previous_prescription.jpg',
  uploadedAt: '2026-09-01T09:30:00.000Z',
  status: 'active',
  extracted: extraction(previousMeds, 'Ramaiah Naidu', '2026-09-01'),
  verified: extraction(previousMeds, 'Ramaiah Naidu', '2026-09-01'),
  errorMessage: null,
};

const newRx = {
  id: 'rx-audit-new',
  imageDataUrl: '/sample_prescription.jpg',
  imageFileName: 'audit_new_prescription.jpg',
  uploadedAt: '2026-10-30T10:15:00.000Z',
  status: 'extracted',
  extracted: {
    ...extraction(newMeds, 'Ramaiah Naidu', '2026-10-30'),
    extractionWarnings: ['One instruction may be incomplete.'],
    confidence: 'medium',
  },
  verified: null,
  errorMessage: null,
};

const today = new Date().toISOString().slice(0, 10);

const doses = [
  {
    id: 'dose-audit-1',
    medicationId: 'prev-metformin',
    medicineName: 'Metformin',
    scheduledTime: 'morning',
    scheduledDate: today,
    status: 'taken',
    takenAt: new Date().toISOString(),
    notes: null,
  },
  {
    id: 'dose-audit-2',
    medicationId: 'prev-amlodipine',
    medicineName: 'Amlodipine',
    scheduledTime: 'morning',
    scheduledDate: today,
    status: 'pending',
    takenAt: null,
    notes: null,
  },
];

const cart = [
  {
    id: 'cart-audit-1',
    quantity: 1,
    prescriptionId: previousRx.id,
    product: {
      id: 'prod-audit-metformin',
      pharmacyId: 'store-local',
      pharmacyName: 'Local Care Pharmacy',
      medicineName: 'Metformin (Cipla)',
      strength: '500mg',
      dosageForm: 'Oral Tablet',
      packInfo: 'Strip of 10 tablets',
      price: 45,
      deliveryFee: 20,
      totalPayable: 65,
      inStock: true,
      prescriptionRequired: true,
      manufacturer: 'Cipla',
    },
  },
];

const orders = [
  {
    id: 'ORD-AUDIT-1001',
    date: '2026-10-20T12:00:00.000Z',
    items: cart,
    pharmacy: { id: 'store-local', name: 'Local Care Pharmacy' },
    deliveryType: 'delivery',
    deliveryAddress: 'Flat 302, Shanti Nilayam, Green Hills Road, Hyderabad',
    subtotal: 45,
    deliveryFee: 20,
    total: 65,
    status: 'Delivered',
    estimatedArrival: 'Delivered on 20 Oct',
  },
];

const seededState = {
  prescriptions: [newRx, previousRx],
  activePrescriptionId: previousRx.id,
  comparisons: [],
  doses,
  cart,
  orders,
  selectedPharmacyId: 'store-local',
};

const ROUTES = [
  { path: '/', text: "Today's Medication Routine", name: 'Dashboard' },
  { path: '/scan', text: "Scan Doctor's Prescription", name: 'Scanner' },
  { path: '/prescriptions', text: 'Prescription History', name: 'Prescription History' },
  {
    path: `/prescriptions/compare/${newRx.id}/${previousRx.id}`,
    text: 'Prescription Comparison',
    name: 'Comparison',
  },
  { path: `/verify/${newRx.id}`, text: 'Review Extracted Data', name: 'Verification' },
  { path: '/routine', text: 'My Prescribed Medicines', name: 'Routine' },
  { path: '/pharmacies', text: 'Pharmacy Stores', name: 'Pharmacies' },
  { path: '/compare', text: 'Medicine Price Comparison', name: 'Price Comparison' },
  { path: '/cart', text: 'My Medicine Cart', name: 'Cart' },
  { path: '/orders', text: 'My Medicine Orders', name: 'Orders' },
  { path: '/profile', text: 'My Profile', name: 'Profile' },
  { path: '/login', text: 'Welcome to RX-AID', name: 'Login' },
];

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.errors = [];
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') {
        const detail = message.params?.exceptionDetails;
        this.errors.push(detail?.exception?.description ?? detail?.text ?? 'Runtime exception');
      }
      if (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error') {
        this.errors.push(
          message.params.args
            .map(arg => (arg.value != null ? String(arg.value) : arg.description ?? ''))
            .join(' ')
        );
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
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rxaid-audit-'));
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

    const evaluate = async expression => {
      const result = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text ?? 'Evaluation failed');
      }
      return result.result.value;
    };

    const setViewport = (width, height, mobile) =>
      cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: mobile ? 2 : 1,
        mobile,
      });

    const navigate = async route => {
      cdp.errors = [];
      await cdp.send('Page.navigate', { url: `${APP_URL}${route}` });
      await sleep(1200);
    };

    const bodyText = () => evaluate('document.body.innerText');
    const waitForText = async (text, timeout = 8000) => {
      const started = Date.now();
      let body = '';
      while (Date.now() - started < timeout) {
        body = await bodyText();
        if (body.includes(text)) return body;
        await sleep(200);
      }
      return body;
    };

    const screenshot = async name => {
      const result = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(screenshotDir, `${name}.png`), Buffer.from(result.data, 'base64'));
    };

    await navigate('/');
    await evaluate(
      `localStorage.setItem('rxaid_app_state_v2', ${JSON.stringify(JSON.stringify(seededState))}); true;`
    );

    /* ── Every route, desktop ─────────────────────────────────── */
    await setViewport(1440, 1000, false);
    for (const route of ROUTES) {
      await navigate(route.path);
      const body = await waitForText(route.text);
      await sleep(400);
      const overflow = await evaluate(
        'document.documentElement.scrollWidth <= window.innerWidth + 1'
      );
      const brokenImages = await evaluate(
        "Array.from(document.images).filter(img => !img.complete || img.naturalWidth === 0).map(img => img.currentSrc || img.src)"
      );
      const height = await evaluate('document.body.scrollHeight');
      check(`desktop ${route.name}: renders, images load, no overflow`, () => {
        assert.ok(body.includes(route.text), `missing expected text "${route.text}"`);
        assert.equal(overflow, true, 'horizontal overflow');
        assert.deepEqual(brokenImages, [], `broken images: ${brokenImages.join(', ')}`);
        assert.ok(height > 400, 'page appears blank');
        assert.deepEqual(cdp.errors, [], `runtime/console errors: ${cdp.errors.join(' | ')}`);
      });
      await screenshot(`desktop-${route.name.toLowerCase().replace(/\s+/g, '-')}`);
    }

    /* ── Every route, mobile ──────────────────────────────────── */
    await setViewport(390, 844, true);
    for (const route of ROUTES) {
      await navigate(route.path);
      const body = await waitForText(route.text);
      await sleep(300);
      const overflow = await evaluate(
        'document.documentElement.scrollWidth <= window.innerWidth + 1'
      );
      check(`mobile ${route.name}: renders without horizontal overflow`, () => {
        assert.ok(body.includes(route.text), `missing expected text "${route.text}"`);
        assert.equal(overflow, true, 'horizontal overflow');
        assert.deepEqual(cdp.errors, [], `runtime/console errors: ${cdp.errors.join(' | ')}`);
      });
      await screenshot(`mobile-${route.name.toLowerCase().replace(/\s+/g, '-')}`);
    }

    /* ── History interactions ─────────────────────────────────── */
    await setViewport(1440, 1000, false);
    await navigate('/prescriptions');
    await waitForText('Prescription History');

    await evaluate("document.querySelector('.history-thumb-btn')?.click(); true;");
    await sleep(300);
    const modalOpen = await evaluate("Boolean(document.querySelector('.image-modal-backdrop'))");
    await evaluate("document.querySelector('.image-modal-head .btn')?.click(); true;");
    await sleep(200);
    const modalClosed = await evaluate("!document.querySelector('.image-modal-backdrop')");
    check('history original-image modal opens and closes', () => {
      assert.equal(modalOpen, true);
      assert.equal(modalClosed, true);
    });

    await evaluate("document.querySelector('.history-card .btn-primary')?.click(); true;");
    const compareUrl = await waitForText('Comparison mode');
    check('history “Compare New Prescription” opens scanner in compare mode', () => {
      assert.ok(compareUrl.includes('Comparison mode'));
      assert.ok(compareUrl.includes('this new scan will be compared with the prescription saved on'));
    });
    const scannerUrl = await evaluate('location.pathname + location.search');
    check('scanner compare URL carries the selected prescription id', () => {
      assert.match(scannerUrl, /^\/scan\?compareWith=rx-audit-/);
    });

    /* ── Verification gate and activation ─────────────────────── */
    await navigate(`/prescriptions/compare/${newRx.id}/${previousRx.id}`);
    await waitForText('Total medicines compared');
    await sleep(400);

    await navigate(`/verify/${newRx.id}`);
    await waitForText('Review Extracted Data');
    await sleep(300);

    const gate = await evaluate(`(() => {
      const btn = document.getElementById('verify-btn');
      return {
        disabled: btn?.disabled,
        text: btn?.textContent ?? '',
        ackPresent: Boolean(document.querySelector('.verify-compare-ack input')),
      };
    })()`);
    check('verification blocks activation until the comparison is acknowledged', () => {
      assert.equal(gate.disabled, true);
      assert.ok(gate.text.includes('Confirm Comparison Review'));
      assert.equal(gate.ackPresent, true);
    });

    await evaluate("document.querySelector('.verify-compare-ack input')?.click(); true;");
    await sleep(300);
    const enabledAfterAck = await evaluate(
      "document.getElementById('verify-btn')?.disabled === false"
    );
    check('acknowledging the comparison enables verification', () =>
      assert.equal(enabledAfterAck, true)
    );

    await evaluate("document.getElementById('verify-btn')?.click(); true;");
    const activated = await (async () => {
      for (let attempt = 0; attempt < 40; attempt++) {
        const state = await evaluate(
          "(() => { const raw = localStorage.getItem('rxaid_app_state_v2'); return raw ? JSON.parse(raw) : null; })()"
        );
        if (state?.activePrescriptionId === newRx.id) return state;
        await sleep(200);
      }
      return null;
    })();

    check('verification activates the new version, saves doses, and marks the comparison reviewed', () => {
      assert.ok(activated, 'state was not updated with the new active prescription');
      const active = activated.prescriptions.find(rx => rx.id === newRx.id);
      assert.equal(active.status, 'active');
      assert.ok(active.verified);
      assert.equal(activated.doses.length > doses.length, true);
      assert.equal(activated.comparisons[0].status, 'reviewed');
    });

    const routinePath = await evaluate('location.pathname');
    check('verification redirects to the medication routine', () =>
      assert.equal(routinePath, '/routine')
    );

    /* ── Post-activation pharmacy and dashboard ───────────────── */
    await navigate('/pharmacies');
    const pharmacyBody = await waitForText('Pharmacy Stores');
    check('verified version clears the ordering pause and shows the new strength', () => {
      assert.equal(pharmacyBody.includes('Needs clarification before ordering'), false);
      assert.equal(pharmacyBody.includes('DEMO DATA'), false);
      assert.ok(pharmacyBody.includes('1000mg'), 'new verified strength not shown');
    });

    await navigate('/');
    const dashboardBody = await waitForText("Today's Medication Routine");
    check('dashboard clears pending comparison and verification notices after activation', () => {
      assert.equal(dashboardBody.includes('changes detected in your new prescription'), false);
      assert.equal(dashboardBody.includes('awaiting verification'), false);
    });

    console.log(`\nScreenshots: ${screenshotDir}`);
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
