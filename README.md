# RX-AID
AI-powered prescription understanding and caregiver assistance
# RX-AID

> **Intelligent Prescription Assistance for Every Caregiver.**

[![GDG 2026](https://img.shields.io/badge/GDG%202026-Prompt%20to%20Product-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/)
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
> 5. **Synthetic Testing:** All demonstrations, test suites, and screenshots must utilize synthetic or fictional prescription data to safeguard patient privacy.

---

## 🎯 Problem Statement

> **"Family caregivers in Tier-2 Indian cities face high anxiety, time waste, and dangerous medication scheduling errors because handwritten doctor prescriptions are difficult to read and translate into clear, safe daily routines."**

### Key Supporting Evidence
* **36.8% Poor Patient Comprehension:** Studies in Indian healthcare settings show over a third of patients struggle to comprehend handwritten prescription directions correctly [[Indian J Pharmacol, 2025]](https://medicaldialogues.in/medicine/news/handwritten-prescriptions-pose-barrier-to-patient-understanding-indian-study-finds-150068).
* **73.3% Prescriptions are Handwritten:** The vast majority of outpatient clinic visits in India continue to generate handwritten paper slips [[PMC, 2016]](https://pmc.ncbi.nlm.nih.gov/articles/PMC4963665/).
* **25% Pharmacy Interpretation Errors:** Legibility challenges lead to misinterpretation rates of up to 25% at pharmacy counters [[T&F, 2016]](https://www.tandfonline.com/doi/full/10.1080/20786190.2016.1254932).

---

## 💡 Our Solution

RX-AID transforms static paper prescriptions into interactive, accessible, and automated daily care routines while prioritizing patient safety above all else.
