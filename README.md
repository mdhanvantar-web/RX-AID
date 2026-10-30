# RX-AID

> **Intelligent Prescription Assistance for Every Caregiver.**


[![Project Lead](https://img.shields.io/badge/Project%20Lead-Monish%20Sambangi-0F9D58?style=for-the-badge)](https://github.com/mdhanvantar-web)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Google%20Gemini-EA4335?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 📌 Executive Summary & Introduction

**RX-AID** is an AI-powered prescription assistance platform designed to support family caregivers in understanding, organizing, and managing complex medication routines from handwritten paper prescriptions.

In many healthcare journeys—particularly across Tier-2 and Tier-3 cities—caregivers manage multiple chronic medications for aging parents or relatives. Unclear doctor handwriting, complex clinical shorthand (e.g., *BD*, *TDS*, *pc*, *ac*), and short consultation times create high anxiety and increase the risk of dangerous dosage errors. 

**RX-AID** bridges the gap between illegible clinical notes and safe daily routines by using Google’s Gemini multimodal AI to extract structured prescription schedules, highlight safety precautions, and enforce a **human-in-the-loop verification process** before setting daily alarms.

---

## ⚠️ Medical Safety & Responsible AI Disclaimer

> ### 🚨 CRITICAL HEALTH & SAFETY NOTICE
> **RX-AID is an assistive organizational tool and NOT a diagnostic, prescribing, or clinical decision-making system.**
>
> 1. **Draft Status:** All AI-extracted prescription information must be treated as an unverified draft.
> 2. **Human Verification Required:** RX-AID **never** activates an automated schedule without explicit review and verification by a caregiver or medical professional.
> 3. **Zero Inference Policy:** The AI engine is strictly instructed to flag unreadable text, ambiguous shorthand, or missing dosages as **UNCONNECTED / UNKNOWN** rather than guessing or hallucinating instructions.
> 4. **No Modification:** RX-AID does not modify prescribed dosages, suggest alternative drugs, or offer clinical recommendations.
> 5. **Synthetic Testing:** All demonstrations, test suites, and screenshots utilize synthetic or fictional prescription data to safeguard patient privacy.

---

## 🎯 Problem Statement

> **"Family caregivers in Tier-2 Indian cities face high anxiety, time waste, and dangerous medication scheduling errors because handwritten doctor prescriptions are difficult to read and translate into clear, safe daily routines."**

### Key Supporting Evidence
* **36.8% Poor Patient Comprehension:** Studies in Indian healthcare settings show over a third of patients struggle to comprehend handwritten prescription directions correctly [[Indian J Pharmacol, 2025]](https://medicaldialogues.in/medicine/news/handwritten-prescriptions-pose-barrier-to-patient-understanding-indian-study-finds-150068).
* **73.3% Prescriptions are Handwritten:** The vast majority of outpatient clinic visits in India continue to generate handwritten paper slips [[PMC, 2016]](https://pmc.ncbi.nlm.nih.gov/articles/PMC4963665/).
* **25% Pharmacy Interpretation Errors:** Legibility challenges lead to misinterpretation rates of up to 25% at pharmacy counters [[T&F, 2016]](https://www.tandfonline.com/doi/full/10.1080/20786190.2016.1254932).

---

## 💡 Architecture & Key Features

### Complete 5-Section Workflow:
1. **Caregiver Dashboard (`/`)**:
   - Patient overview profile (Ramaiah Naidu, 68/M, Father, Chronic conditions: Type 2 Diabetes, Hypertension).
   - Real-time 7-day adherence gauge and statistics (Taken, Missed, Adherence %).
   - Today's medication timeline with direct dose checkoff buttons.
   - Prescription history and instant navigation to upload.

2. **Prescription Scanner (`/scan`)**:
   - Drag-and-drop file upload, file explorer selection, and mobile camera capture.
   - Validation for file formats (JPEG, PNG, WebP) and size limits (10MB).
   - Built-in **Synthetic Prescription Generator** for instant 1-click demonstration without privacy risks.
   - Real-time multimodal Gemini API analysis with animated processing states.

3. **Multimodal AI Extraction**:
   - Powered by official `@google/genai` SDK (`gemini-2.0-flash`).
   - Strict medical safety prompt extracting medicine name, strength, dose, frequency, timings, food instructions, and duration.
   - Zero hallucination policy: unreadable text or shorthand is flagged as `unclearFields` instead of guessed.
   - Synthetic demo fallback mode when API key is unconfigured.

4. **Human Verification Screen (`/verify/:id`)**:
   - Side-by-side view comparing original prescription image against extracted structured fields.
   - Prominent alerts for ambiguous handwriting or unverified entries.
   - Inline editing for correcting transcription errors.
   - **Safety Lock:** Activation is strictly blocked until all unclear fields are confirmed or resolved.

5. **Medication Routine (`/routine`)**:
   - Full daily routine organized into Morning, Afternoon, Evening, and Night routines.
   - 7-day automated schedule generation from verified prescriptions.
   - Mark doses as Taken, Missed, or Pending with automatic adherence computation.
   - LocalStorage persistence preserving all edits and schedule records across reloads.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite
- **Icons & UI:** Lucide React, Custom Dark Medical Design System
- **State & Storage:** React Context + useReducer with LocalStorage persistence
- **Routing:** React Router v7
- **Date Calculations:** date-fns
- **AI Multimodal Understanding:** Google Gemini (`@google/genai` SDK)

---

## 🚀 Local Launch & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Gemini API Key (Optional for Live AI)
Create a `.env` file in the root directory:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
*(If no API key is provided, RX-AID automatically operates in synthetic demonstration mode with full functionality)*

### 3. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:5180](http://localhost:5180)** in your browser.

### 4. Build for Production
```bash
npm run build
```
Build output is saved to `/dist`.
