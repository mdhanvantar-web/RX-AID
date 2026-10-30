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

**RX-AID** is a caregiver-facing prescription assistance app for understanding handwritten paper prescriptions and turning them into an organised medication routine. A caregiver can photograph a prescription, let Google Gemini transcribe the visible instructions, review every extracted field, and then activate a daily schedule only after explicit human verification.

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
| 7-day medication schedule and dose tracking | ✅ Implemented |
| Pharmacy store selection and search | ✅ Demo implementation |
| Multi-store price comparison | ✅ Demo implementation (3 catalog medicines) |
| Cart, delivery/pickup choice, order review, order history | ✅ Demo implementation (no real payment or fulfilment) |
| English + Telugu interface | ✅ Implemented |
| 35-locale translation registry | ⚠️ Scaffolded in `src/i18n/`, not connected to the UI |
| Real accounts and authentication | ❌ Demo only |
| Backend, database, real pharmacy APIs, payments | ❌ Not implemented |
| Push reminders / alarms | ❌ Not implemented |
| Automated tests and CI | ❌ Not implemented |

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

### 12. Experimental language scaffolding (`src/i18n/`)
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
- **Automated tests and CI/CD.** There are no unit, integration, or end-to-end tests, and no deployment pipeline.
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
│   ├── pages/                    # Dashboard, Scanner, Verification, Routine, Pharmacies,
│   │                             # PriceComparison, Cart, Orders, Profile, Login
│   ├── services/
│   │   ├── gemini.ts             # Gemini extraction prompt, demo fallback, error handling
│   │   ├── pharmacyData.ts       # Synthetic stores, catalog, and price comparison
│   │   └── storage.ts            # localStorage load/save and state transitions
│   ├── types/index.ts            # Shared TypeScript models
│   └── utils/                    # Schedule generation and English/Telugu translations
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

### 7. Deploy to Vercel

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
5. A 7-day schedule is generated only after verification.
6. Dose status can be marked taken, missed, skipped, or reset.

---

## 📄 License

Released under the [MIT License](LICENSE).

---

**RX-AID is an assistive prototype, not a medical device. If you are unsure about any medicine, dose, or instruction, stop and consult a qualified healthcare professional.**
