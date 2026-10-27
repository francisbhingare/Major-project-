# Missing Evidence & Empirical Gaps Analysis

**Project Title:** AI Emergency Response System  
**Audit Purpose:** Academic Integrity & Viva Defense Preparation  
**Auditor:** Antigravity AI Systems Auditor  

---

## 1. Overview: The Danger of "Vaporware" Claims in Engineering Vivas

In final-year engineering project examinations (viva voce) and research paper peer reviews, external evaluators actively probe for **unsubstantiated claims**. If a student claims their system achieves "96.4% accident detection accuracy" or "sub-second triage latency," examiners will immediately ask:
1. *"Where is your confusion matrix?"*
2. *"What dataset did you train and benchmark on?"*
3. *"Show me the training loss graph and the validation split code."*
4. *"Can you pull up the live telemetry connection to the hospital ICU?"*

This document catalogs every technical specification, metric, and integration that **CANNOT be proven from the source code alone** and outlines how to legitimately address each gap.

---

## 2. Itemized Missing Evidence

### A. Computer Vision (CAD) Training & Accuracy Metrics
- **What is missing:**
  - No training dataset (e.g., DADA-2000, CADP, or Roboflow Vehicle Accident Dataset).
  - No training scripts (`train.py`, PyTorch dataset loader, augmentations).
  - No model checkpoint files (`best.pt`, `last.pt`, `model.onnx`).
  - No empirical performance metrics: Mean Average Precision ($\text{mAP}_{50}$, $\text{mAP}_{50-95}$), Precision, Recall, F1-Score, or Frame Rate (FPS).
- **Academic Risk:** High. Claiming specific accuracy figures without an evaluation table will lead to immediate challenge.
- **Honest Academic Framing:** Describe the computer vision subsystem as a *Modular Computer-Aided Dispatch (CAD) Interface* designed to ingest real-time accident telemetry, currently validated via zero-shot multimodal inference (GPT-4o) and deterministic bounding box schemas.

---

### B. Speech-to-Text (STT) Word Error Rate (WER) in Field Conditions
- **What is missing:**
  - No audio benchmark dataset recorded under emergency conditions (e.g., background traffic noise, sirens, weeping, shouting, wind noise).
  - No quantitative Word Error Rate ($\text{WER}$) or Character Error Rate ($\text{CER}$) measurements across different Indian accents or regional languages.
- **Academic Risk:** Medium. Examiners may ask how voice recognition handles panic or heavy accents.
- **Honest Academic Framing:** State that speech transcription relies on the dual-tier design: browser Web Speech API for low-latency client dictation with server-side OpenAI Whisper-1 cloud failover. Note that field noise filtering and accent adaptation remain areas for future acoustic model fine-tuning.

---

### C. Live Hospital Dynamic Capacity & Bed Availability
- **What is missing:**
  - In `src/lib/services/overpassHospitalService.ts`, hospital records are extracted from OpenStreetMap tags (`amenity=hospital`).
  - While location coordinates, names, and contact details are authentic, **real-time ICU bed availability, emergency room wait times, and ventilator status are simulated/modeled**.
  - No active HL7/FHIR (Fast Healthcare Interoperability Resources) or direct Electronic Health Record (EHR) API integrations exist.
- **Academic Risk:** Low to Medium.
- **Honest Academic Framing:** Clarify that GIS coordinates and distance calculations represent real geographic spatial data, while dynamic bed occupancy is demonstrated via a simulated tele-triage dashboard to model real-world municipal dispatch routing.

---

### D. Road Network Routing vs. Straight-Line Geodesic
- **What is missing:**
  - The internal system calculates distance using the pure **Haversine formula** ($R = 6371\text{ km}$), which measures straight-line ("as-the-crow-flies") distance.
  - No internal turn-by-turn road routing engine (e.g., OSRM, GraphHopper, or Google Directions API) is executed by the backend to calculate actual driving time or traffic congestion delays.
  - External routing is delegated to Google Maps links (`https://www.google.com/maps/dir/...`).
- **Academic Risk:** Low.
- **Honest Academic Framing:** Acknowledge that the internal triage ranking sorts facilities by great-circle geodesic proximity for sub-millisecond sorting, delegating dynamic turn-by-turn traffic navigation to third-party mobile navigation providers upon dispatch handoff.

---

### E. Offline Synchronization Stress Testing
- **What is missing:**
  - `src/lib/services/syncService.ts` contains `localStorage` queue logic, but no Service Worker or Cache API is registered.
  - No empirical tests measuring sync success rate across fluctuating cellular connectivity (e.g., transitioning between 4G, 2G, and offline modes using Chrome Network Throttling).
- **Academic Risk:** Low.
- **Honest Academic Framing:** Present offline caching as a client-side resilient queue architectural pattern, noting that background Service Worker sync represents the production deployment phase.

---

### F. Multi-User Database Concurrency and Throughput
- **What is missing:**
  - SQLite (`better-sqlite3`) operates as an embedded synchronous database.
  - No load testing (e.g., Apache JMeter, Locust, or k6) has been performed to quantify maximum concurrent writes per second or transactions per second (TPS).
- **Academic Risk:** Low.
- **Honest Academic Framing:** Position SQLite with Write-Ahead Logging (WAL) as an optimal zero-configuration edge database for emergency command centers, with PostgreSQL recommended for regional distributed clustering.

---

## 3. Summary Checklist: What to Collect Before Final Submission

| Missing Item | Recommended Action for Student |
|---|---|
| **Hardware Specs** | Run the script in `hardware_check_instructions.md` and insert your laptop specs. |
| **Real Photographs** | Capture 3 real mobile screenshots of the responsive UI on your phone. |
| **Live GPS Test** | Test the `/report` page outside with your phone's GPS enabled and screenshot the captured coordinates. |
| **PDF Proof** | Download one generated PDF report from `/api/reports/generate?id=...` and print it as an exhibit for your report appendix. |
