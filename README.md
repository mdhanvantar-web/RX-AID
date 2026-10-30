# RX-AID

> **Intelligent Prescription Assistance for Every Caregiver.**

[![Project Lead](https://img.shields.io/badge/Project%20Lead-Monish%20Sambangi-0F9D58?style=for-the-badge)](https://github.com/mdhanvantar-web)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Google%20Gemini-EA4335?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 🌐 Live Demo

**https://rx-aid.vercel.app**

The hosted build currently runs in **synthetic demo mode** because no Gemini API key is configured. Add `VITE_GEMINI_API_KEY` in the Vercel project settings to enable live extraction.

---

## 📌 Overview

**RX-AID** is a caregiver-facing prescription assistance app for understanding handwritten paper prescriptions and turning them into an organised medication routine. A caregiver can photograph a prescription, let Google Gemini transcribe the visible instructions, review every extracted field, and then activate a daily schedule only after explicit human verification. A built-in **Prescription Change Detector** compares a new scan with any saved earlier version and presents cautious, review-only notices for changed, added, missing, or unclear medicines.

This repository contains the **RX-AID MVP**: a fully working frontend prototype with local persistence. It is **not** a production medical system, and it does not connect to real pharmacies, payment gateways, or clinical record systems.

> **Medical disclaimer:** RX-AID is an assistive organisational tool. It is not a diagnostic, prescribing, or clinical decision-making system. AI output is always an unverified draft. Always confirm medicines, strengths, doses, and timings with the prescribing doctor or a qualified pharmacist.

---

## 🚦 MVP Status

| Area | Status |
| --- | --- |
| Warm light theme and elderly-friendly interface | ✅ Implemented |
| Caregiver dashboard, patient summary, adherence stats | ✅ Implemented |
| Prescription upload, drag-and-drop, live camera, native camera | ✅ Implemented |
| Gemini multimodal extraction with unreadable-field handling | ✅ Implemented (live with API key, synthetic demo without one) |
| Human verification screen and safety lock | ✅ Implemented |
| Prescription history, versioning, and cautious change detection | ✅ Implemented |
| Prescription comparison screen and caregiver review notices | ✅ Implemented |
| 7-day medication schedule and dose tracking | ✅ Implemented |
| Pharmacy store selection and search | ✅ Demo implementation |
| Multi-store price comparison | ✅ Demo implementation (3 catalog medicines) |
| Cart, delivery/pickup choice, order review, order history | ✅ Demo implementation (no real payment or fulfilment) |
| English + Telugu interface | ✅ Implemented |
| 35-locale translation registry | ⚠️ Scaffolded in `src/i18n/`, not connected to the UI |
| Real accounts and authentication | ❌ Demo only |
| Backend, database, real pharmacy APIs, payments | ❌ Not implemented |
| Push reminders / alarms | ❌ Not implemented |
| Synthetic comparison-engine tests and headless UI smoke tests | ✅ Implemented (`npm run test:comparison`, `npm run test:ui`) |
| CI pipeline | ❌ Not implemented |

**Build check:** `npm run build` (TypeScript project build + Vite production build) succeeds. `npm run lint` completes with warnings only; there are no lint errors.

---

## ✅ Implemented Features

### 1. Warm, elderly-friendly interface
- Purpose-built **light theme** with a warm cream background, high-contrast slate text, calm teal accents, and large rounded cards.
- Increased base font size (17px), large 48px minimum button targets, clear focus-visible outlines, and generous spacing.
- Responsive layout with a desktop navigation bar and a mobile bottom navigation bar.
- Semantic headings, ARIA labels/roles, live regions for processing and status messages, and accessible form controls.
- Friendly, plain-language copy and visual step labels rather than dense clinical terminology.

### 2. Caregiver dashboard (`/`)
- Fictional patient profile card (age, relationship, chronic conditions).
- Adherence ring and summary stats computed from past scheduled doses.
- Today's medication timeline grouped into morning, afternoon, evening, and bedtime.
- One-tap dose actions (taken / skip) and a prescription history panel.
- Quick links to prescription scanning, pharmacy ordering, and price comparison.

### 3. Prescription scanner (`/scan`)
- Live camera using the browser **MediaDevices API**, with rear-camera preference, alignment guide, capture, cancel, and front/rear switch.
- Automatic camera track shutdown after capture and on component unmount.
- Native mobile camera fallback (`capture="environment"`).
- Gallery/file upload and drag-and-drop.
- JPEG, PNG, and WebP validation with a 10MB size limit.
- One-click **synthetic sample prescription** for privacy-safe demos.
- Clear privacy notice: the camera is only opened on a direct tap and tracks stop after capture.
- Friendly error states for denied permission, missing hardware, busy camera, insecure origin, and unsupported browsers.

### 4. Gemini prescription extraction
- Optional live extraction through the official `@google/genai` SDK using `gemini-2.0-flash`.
- Strict transcription prompt: extract only visible text, never guess, and flag ambiguous fields.
- Understands common Indian prescription shorthand such as BD, TDS/TID, OD, hs, ac, pc, and SOS.
- Returns structured medication entries (name, strength, dose, frequency, timings, food instruction, duration) plus warnings and a confidence level.
- Marks unreadable medicines as `[Unreadable]` and records the affected fields.
- **Synthetic demo mode** when no API key is configured, so the full workflow can be explored safely.
- Graceful error handling if the API request or JSON parsing fails.

### 5. Human verification (`/verify/:id`)
- Side-by-side original prescription image and extracted fields.
- Inline editing for medicine name, strength, dose, frequency, food instruction, duration, and timings.
- Visible warnings for unclear fields and AI confidence.
- **Safety lock:** the schedule cannot be activated while key unclear fields are unresolved.
- On confirmation, the prescription becomes active and a 7-day dose schedule is generated.

### 6. Medication routine (`/routine`)
- Day-by-day navigation for the generated schedule.
- Morning, afternoon, evening, and bedtime groupings with target times.
- Mark doses as taken, missed, or reset to pending.
- Overall and per-day adherence summaries.
- Sidebar of verified medicines with dose, frequency, food instruction, and duration.
- All changes persist in browser `localStorage`.

### 7. Pharmacy stores, cart, and orders
- Five illustrative pharmacy stores with ratings, delivery estimates, fees, addresses, and search.
- Products derived from verified, non-unclear prescription medicines.
- Add to cart from a store or from the comparison table.
- Cart supports quantity changes, removal, clearing, home delivery vs pickup, address/phone entry, delivery-fee thresholds, and an order review modal.
- Placing an order creates a local demo order and clears the cart.
- Order history shows pharmacy, items, quantities, totals, delivery destination, and status.
- Every pharmacy screen carries a prominent **synthetic demo data** notice.

### 8. Price comparison (`/compare`)
- Compares the total payable amount for each verified medicine across the five demo stores.
- Highlights the lowest total and supports adding any offer directly to the cart.
- Exact catalog pricing currently covers Metformin 500mg, Amlodipine 5mg, and Atorvastatin 10mg; other verified medicines use an illustrative fallback price.

### 9. Profile and language preference (`/profile`)
- Edit caregiver name, phone, and default delivery address.
- View the patient summary, prescribing doctor, prescription count, and order count.
- Switch between **English** and **Telugu**.
- Language preference and profile edits persist locally.

### 10. Demo login (`/login`)
- Sign-in and registration forms with basic client-side validation, password visibility toggle, and quick demo access.
- **This is not real authentication.** Any correctly formatted email and a password of six or more characters is accepted. No credentials are sent anywhere.

### 11. Local persistence
- Prescriptions, schedule records, cart, orders, profile, and language preference are stored in `localStorage` under `rxaid_app_state_v2`.
- No backend or database is required to run the demo.

### 12. Prescription Change Detector (`/prescriptions`, `/prescriptions/compare/:newId/:baseId`)

- **Prescription history** (`/prescriptions`) keeps every scan as a new version. Each version shows its scan date and time, original image, extracted medicines, verification status, and comparison history. Older versions are never overwritten.
- **Compare across time** supports two entry points: choose any two saved versions side by side, or open an earlier version and select **Compare New Prescription**. The scanner then tags the new scan for comparison (`/scan?compareWith=<id>`).
- **Comparison engine** (`src/services/prescriptionComparison.ts`) compares medicine name, strength, dose, frequency, route (only when explicitly written), timing slots, food instruction, duration, and additional notes. Formatting such as `500 mg` vs `500mg`, `BD` vs `twice daily`, or `Tab.` prefixes is normalised for comparison only — the original prescribed values are always displayed unchanged.
- **Cautious matching:** identical normalised names match exactly. Names with ≥ 0.9 similarity are paired but always forced into **⚠️ Needs Review**; clearly different names are never treated as the same medicine. Brand/generic equivalence is never assumed because no trusted medicine reference is available.
- **Categories** follow the required colour system: 🟢 UNCHANGED, 🔵 ADDED, 🟠 CHANGED, 🔴 NO LONGER LISTED, ⚠️ NEEDS REVIEW.
- **Per-medicine cards** show the previous and new values, exact field-level difference tables, original-image reference buttons, review reasons, and a plain-language review status.
- **Summary** at the top of the comparison screen counts total, unchanged, added, changed, no-longer-listed, and needs-review items. A warnings panel highlights uncertain spellings, unclear handwriting, missing information, duplicate entries, and frequency/timing conflicts.
- **Both original images** can be reviewed individually or together in a modal before the caregiver marks the differences as reviewed.
- **Human verification gate:** the new version stays an unverified draft. Marking the comparison as reviewed is not a medical confirmation. The verification screen (`/verify/:id`) shows a comparison banner and requires a separate acknowledgment before activation. On activation, the new version becomes the active prescription.
- **Dashboard notifications** use non-alarming wording, for example “3 changes detected in your new prescription.”, “2 medicines need review.”, and “Your latest prescription is awaiting verification.”, with links back to the comparison and verification screens.
- **Pharmacy and cart safety:** only the currently verified/latest active prescription feeds inventory and price comparison. Medicines with a changed or unresolved instruction are shown in a “needs clarification” block with ordering paused. Cart items that match a flagged medicine or reference an older prescription version pause checkout, and cart contents are never silently changed.
- **Comparison records** are stored in `AppState.comparisons` and persisted under the existing `rxaid_app_state_v2` key, with pending/reviewed status and a generated timestamp.

### Safety rules enforced by the Change Detector

- Never automatically stop, start, merge, activate, or re-dose a medicine.
- Never treat a medicine’s absence from the new prescription as confirmed discontinuation.
- Never calculate or suggest a replacement dose.
- Never hide ambiguity, unclear handwriting, or missing fields.
- Never order or substitute a medicine based on an uncertain match.
- Always instruct the caregiver to confirm changes with the prescribing doctor or a qualified healthcare professional.
- Keep the new version pending until its extracted instructions are verified.

### 13. Experimental language scaffolding (`src/i18n/`)
- A 35-locale registry with region, text direction, speech locale, and native names.
- 26 seeded translation dictionaries with English fallback.
- RTL document-direction helper and CSS, plus browser speech-synthesis helpers.
- **Not yet wired into the application UI.** Only English and Telugu are selectable today, and `src/i18n/rtl.css` is not imported.

---

## ❌ Pending / Not Implemented

The following are explicitly **not** part of this MVP:

- **Backend and database.** Everything runs in the browser; there is no server, API, or shared data store.
- **Production authentication and authorisation.** No real accounts, password hashing, sessions, recovery, or caregiver/patient roles.
- **Secure Gemini integration.** `VITE_GEMINI_API_KEY` is exposed in the client bundle. Production use requires a server-side proxy, key restriction, rate limiting, and usage monitoring.
- **Real pharmacy integration.** Store names, inventory, prices, delivery estimates, addresses, and phone numbers are illustrative demo data. There are no live pharmacy APIs, prescriptions transmission, payments, or fulfilment.
- **Real orders and payments.** Orders are local records only. No payment gateway, invoice, refund, or delivery tracking exists.
- **Reminders and alarms.** There are no push notifications, local notifications, SMS/email reminders, or alarm scheduling.
- **Multi-patient and multi-caregiver support.** The demo has one fixed patient profile.
- **Broader document support.** Uploads are limited to JPEG, PNG, and WebP; PDF and HEIC are not supported.
- **Full internationalisation.** The 35-locale catalog is partial and unconnected; RTL styling is not applied; voice read-aloud has no UI entry point.
- **Automated tests and CI/CD.** Synthetic comparison-engine tests and a headless browser UI smoke test exist locally, but there is no CI pipeline, no test on every pull request, and no real end-to-end suite covering camera permissions, live Gemini responses, or accessibility.
- **Data privacy controls.** Prescription images and personal details are stored unencrypted in `localStorage`. There is no export, deletion workflow, encryption at rest, or retention policy.
- **Production hardening.** No error monitoring, analytics consent, offline/PWA support, rate limiting, or load testing.
- **Accessibility audit.** Good practices are in place, but there has been no formal WCAG audit; reduced-motion preferences and some advanced screen-reader flows still need work.
- **Accurate adherence window.** The adherence calculation considers all past scheduled doses, while the dashboard labels it as a 7-day figure; the label and calculation should be aligned.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite 8
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Dates:** date-fns
- **AI:** Google Gemini via `@google/genai` (`gemini-2.0-flash`)
- **State:** React Context + `useReducer`
- **Persistence:** Browser `localStorage`
- **Linting:** oxlint
- **Styling:** Hand-written CSS with custom properties and a warm light design system

---

## 📁 Project Structure

```text
.
├── public/
│   ├── sample_prescription.jpg   # Synthetic demo prescription (fictional data)
│   └── *.svg                     # App and UI icons
├── src/
│   ├── components/Navbar.*       # Desktop/mobile navigation and language toggle
│   ├── context/AppContext.tsx    # Global state, reducer, persistence wiring
│   ├── i18n/                     # Experimental 35-locale catalog, RTL and voice helpers
│   ├── pages/                    # Dashboard, Scanner, Verification, PrescriptionHistory,
│   │                             # PrescriptionComparison, Routine, Pharmacies,
│   │                             # PriceComparison, Cart, Orders, Profile, Login
│   ├── services/
│   │   ├── gemini.ts             # Gemini extraction prompt, demo fallback, error handling
│   │   ├── pharmacyData.ts       # Synthetic stores, catalog, and price comparison
│   │   ├── prescriptionComparison.ts  # Cautious matching, field diffs, review flags
│   │   └── storage.ts            # localStorage load/save and state transitions
│   ├── types/index.ts            # Shared TypeScript models
│   └── utils/                    # Schedule generation and English/Telugu translations
├── tests/
│   ├── prescriptionComparison.test.mjs  # 10 synthetic comparison scenarios
│   └── ui-smoke.mjs              # Headless Chrome desktop/mobile UI smoke test
├── .env.example                  # Safe environment template (no real key)
├── index.html
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

---

## 🚀 Local Development

### Prerequisites
- Node.js **20.19+** or **22.12+** (required by Vite 8)
- npm 10+

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the optional Gemini key

Copy the safe template and add a key only if you want live AI extraction:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

If the key is blank or set to `DEMO`, RX-AID runs in synthetic demo mode. The complete workflow still works with fictional extracted medicines.

> ⚠️ **Never commit `.env` or a real API key.** Vite embeds `VITE_*` values into the browser bundle, so this approach is suitable only for local demos. Use a backend proxy for any public deployment.

### 3. Start the development server

```bash
npm run dev
```

Open **http://localhost:5180**.

> Camera access requires `localhost` or an HTTPS origin. If you open the app over plain HTTP on another host, use gallery upload instead.

### 4. Build for production

```bash
npm run build
```

The output is written to `dist/` (git-ignored).

### 5. Preview the production build

```bash
npm run preview
```

### 6. Lint

```bash
npm run lint
```

### 7. Run the tests

```bash
# Synthetic comparison-engine scenarios (10 required cases + normalisation)
npm run test:comparison

# Desktop and mobile UI smoke test against the production preview build
npm run test:ui
```

`test:ui` expects a production preview at `http://127.0.0.1:4173` and a local Chrome or Edge installation. Start one first:

```bash
npm run preview -- --port 4173 --strictPort --host 127.0.0.1
```

Set `CHROME_PATH` to use a different browser executable, or `RX_AID_URL` to point at another deployment.

### 8. Deploy to Vercel

The repository includes `vercel.json` (Vite build, `dist` output, and SPA deep-link rewrites) and `.vercelignore`. Import the GitHub repository in Vercel, or deploy from the CLI:

```bash
vercel --prod
```

Add `VITE_GEMINI_API_KEY` in **Project Settings → Environment Variables** to enable live AI extraction. Without it, the deployment runs safely in synthetic demo mode.

---

## 🔐 Privacy, Safety, and Demo Data

- **No real prescriptions are included.** `public/sample_prescription.jpg` is a synthetic prescription created for demonstrations. Its doctor, registration number, phone number, patient, and medicines are fictional.
- **No API keys or `.env` files are committed.** `.env` and `.env.*` are ignored, with `.env.example` provided as a safe placeholder.
- **No `node_modules` or build output is committed.** Both are ignored.
- **Personal details in the app are demo data.** Default caregiver, patient, address, and phone values are fictional placeholders. Do not enter real patient information into the demo.
- **Pharmacy data is illustrative.** Store names are used only to demonstrate a pharmacy-selection workflow; RX-AID is not affiliated with those brands. All prices, stock levels, delivery estimates, and order outcomes are synthetic.
- **Prescription images stay in the browser** in `localStorage`, unencrypted. Clearing browser data removes them. This is not suitable for real clinical records.
- **Human review is mandatory.** The verification screen is a safety gate, not a substitute for professional judgement.

---

## 🧭 Safety Flow

1. Capture or upload a prescription image.
2. Gemini extracts only what is visibly written; unclear fields are flagged rather than guessed.
3. The caregiver reviews the original image against every extracted field and corrects errors.
4. Activation is blocked while key unclear fields remain unresolved.
5. If the scan was started from **Compare New Prescription**, the extracted draft is compared with the selected earlier version. A new prescription version remains pending after the comparison.
6. The caregiver reviews both original images and every difference, then explicitly marks the comparison as reviewed.
7. The verification screen requires a separate comparison acknowledgment before activation.
8. A 7-day schedule is generated only after verification, and only then does the new version become the active prescription for pharmacy and cart.
9. Dose status can be marked taken, missed, skipped, or reset.

---

## 📄 License

Released under the [MIT License](LICENSE).

---

**RX-AID is an assistive prototype, not a medical device. If you are unsure about any medicine, dose, or instruction, stop and consult a qualified healthcare professional.**
