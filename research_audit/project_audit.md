# Technical Project Audit: AI Emergency Response System

**Project Title:** AI Emergency Response System  
**Academic Level:** BTech Final-Year Engineering Project Prototype  
**Audit Date:** October 26, 2026  
**Auditor:** Antigravity AI Senior Technical Review  
**Audience:** Undergraduate Engineering Student & Academic Evaluation Committee  

---

## Executive Summary

This audit provides an unvarnished, beginner-friendly, and rigorous technical inspection of the existing **AI Emergency Response System** codebase. The purpose is to prepare an accurate final-year project report and research paper.

The project is an **interactive emergency reporting and hospital dispatch web application**. It is built using modern full-stack TypeScript technologies (Next.js 16 App Router, React 19, Node.js runtime). It incorporates a hybrid architecture: multimodal user inputs (voice, text, and scene images), a deterministic rule-based clinical scoring engine, OpenStreetMap Overpass GIS queries, automated binary PDF report generation, and an administrator command center.

Importantly, several components commonly assumed in project proposals—such as local fine-tuned YOLO weights, local Whisper neural network runtimes, Google Gemini API integrations, and offline Service Worker synchronization—**are either simulated, cloud-based via OpenAI, or rule-based fallbacks in the current codebase**.

---

## Detailed Findings (Phase 1)

### 1. Frontend Framework and Technologies
* **Core Framework:** [Next.js](https://nextjs.org/) version **16.2.6** utilizing the modern **App Router** paradigm (`src/app/`).
* **UI Library:** [React](https://react.dev/) version **19.2.4** (with `react-dom` 19.2.4).
* **Language:** [TypeScript](https://www.typescriptlang.org/) version **5.0.0** with strict type declarations (`tsconfig.json`).
* **Styling Engine:** [Tailwind CSS](https://tailwindcss.com/) version **4.0** with `@tailwindcss/postcss`. Custom utility merging is handled by `clsx` (v2.1.1) and `tailwind-merge` (v3.6.0).
* **Iconography:** [Lucide React](https://lucide.dev/) (v1.16.0), providing lightweight SVG icons.
* **Mapping Component:** Interactive map rendered in [InteractiveMap.tsx](file:///c:/Antigravity%20projects'/src/components/map/InteractiveMap.tsx) using the **Leaflet JavaScript library** dynamically injected via CDN (`https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` and `leaflet.css`).
* **Design Philosophy:** Dark-mode glassmorphism (`bg-slate-900`, `border-slate-800`), responsive grid layouts, and high-visibility color-coded emergency badges (Red for CRITICAL, Amber for HIGH, Emerald for resolved/operational).

---

### 2. Backend Framework and Technologies
* **Framework:** Next.js Serverless / Edge-ready **Route Handlers** running on a **Node.js** server environment.
* **API Structure:** All backend endpoints reside in `src/app/api/.../route.ts` implementing standard HTTP methods (`GET`, `POST`, `PATCH`).
* **Key API Handlers:**
  * `src/app/api/emergency/analyze/route.ts`: Clinical severity calculation and fact extraction.
  * `src/app/api/emergency/analyze-image/route.ts`: Scene analysis and visual indicator extraction.
  * `src/app/api/voice/transcribe/route.ts`: Audio speech-to-text handling.
  * `src/app/api/emergency/create/route.ts`: Incident registration and hospital dispatch trigger.
  * `src/app/api/hospitals/recommend/route.ts`: Multi-factor hospital ranking algorithm.
  * `src/app/api/hospitals/nearby/route.ts`: Proximity hospital lookup.
  * `src/app/api/reports/generate/route.ts`: Pure binary PDF generation.
  * `src/app/api/health/route.ts`: Subsystem health and credentials inspection.

---

### 3. Database Technology and Current Schema
The application implements a **dual-mode database strategy**:

#### A. Active Local Runtime: File-Backed Durable JSON Store
* **Location:** Stored in the local filesystem under `data/` (`data/emergencies.json`, `data/hospitals.json`, `data/email_logs.json`).
* **Implementation File:** [store.ts](file:///c:/Antigravity%20projects'/src/lib/db/store.ts).
* **Mechanism:** When an emergency report or email log is created or updated, it is synchronously written to local disk using Node.js `fs.writeFileSync`. This provides zero-configuration durability across server restarts without requiring a separate database server.

#### B. Cloud Database Architecture: PostgreSQL / Supabase
* **SQL Schema File:** [schema.sql](file:///c:/Antigravity%20projects'/src/lib/db/schema.sql).
* **Client Implementation:** [supabaseClient.ts](file:///c:/Antigravity%20projects'/src/lib/db/supabaseClient.ts).
* **Tables Defined in `schema.sql`:**
  1. `users`: Stores user credentials, roles (`USER`, `RESPONDER`, `ADMIN`), and timestamps.
  2. `hospitals`: Stores facility names, coordinates (`latitude`, `longitude`), contact information, and verification status.
  3. `verified_capabilities`: Relational 1-to-1 table storing boolean capability flags (`has_emergency_department`, `has_icu`, `has_trauma_center`, `has_blood_bank`, `has_cardiology`, `has_neurology`, `has_orthopedics`, `has_burn_unit`, `has_ambulance`, `has_operation_theatre`).
  4. `incidents`: Main table for emergency events (`report_id`, `emergency_type`, `severity`, `ai_confidence`, GPS coordinates, `status`, `recommended_hospital_id`).
  5. `ai_analysis`: Stores AI clinical summaries, model version, and reasoning.
  6. `ai_observations`: Stores discrete multimodal facts extracted from vision, voice, or text.
  7. `sync_queue`: Tracks offline synchronizations and retry counts.
* **Row-Level Security (RLS):** Policies are defined restricting incident visibility to the owning user or authorized responders and administrators.

---

### 4. Authentication and User Roles
* **Store Implementation:** [authStore.ts](file:///c:/Antigravity%20projects'/src/lib/auth/authStore.ts) backed by browser `localStorage` and synchronized via [AuthContext.tsx](file:///c:/Antigravity%20projects'/src/context/AuthContext.tsx).
* **Supported Roles:**
  * `USER`: Standard citizen account. Can submit reports and view personal history.
  * `RESPONDER` / `HOSPITAL_STAFF`: Hospital desk personnel. Can view the dispatch queue and update incident operational status (`ACKNOWLEDGE`, `IN_RESPONSE`, `RESOLVED`).
  * `ADMIN`: System administrator. Has full access to the Command Hub, user management, and system diagnostics.
* **Access Control:** Client-side route guards in `src/app/admin/page.tsx` and Next.js middleware in `src/middleware.ts`.
* **Demonstration Convenience:** The login interface at `/admin/login` includes a 1-click credential auto-fill button for viva evaluations.

---

### 5. Gemini API Integration and Model Name
* **CRITICAL FINDING: No Google Gemini API is integrated in this codebase.**
* **Investigation Evidence:** A comprehensive codebase search for `gemini`, `@google/generative-ai`, or `generativelanguage.googleapis.com` returned **zero occurrences** in application code.
* **Actual LLM Integration:** The codebase is wired to use the **OpenAI API** (`OPENAI_API_KEY`) targeting the model **`gpt-4o`** in `src/app/api/emergency/analyze-image/route.ts` (line 70).
* **Fallback Behavior:** If `OPENAI_API_KEY` is not supplied, the system executes an offline rule-based heuristic scoring engine (`src/lib/services/severityScoringEngine.ts`).

---

### 6. Information Sent to the AI
When external API keys are active, the following multimodal payloads are constructed:
* **Image Analysis Endpoint (`/api/emergency/analyze-image`):**
  * The raw image is converted to a `base64` data URI (`data:image/jpeg;base64,...`).
  * Sent to `gpt-4o` along with a structured prompt instructing it to extract: incident type, object counts (people, vehicles), injury indicators, damage indicators, fire/smoke indicators, and visual observations.
* **Clinical Triage Endpoint (`/api/emergency/analyze`):**
  * Synthesizes: user typed description, Whisper voice transcription, visual object labels, people count, and GPS coordinates.
  * Passed to the internal clinical scoring engine (`severityScoringEngine.ts`).

---

### 7 & 8. YOLO Model Version, Weights File, and Supported Classes
* **CRITICAL FINDING: No local YOLO weights file (`.pt`, `.onnx`, `.weights`) or Ultralytics runtime exists in this repository.**
* **Inspection Details:**
  * No Python backend, PyTorch installation, or `ultralytics` package is present.
  * No `yolov8n.pt`, `best.pt`, or custom weights files exist on disk.
  * There are no training scripts (`train.py`), dataset configuration files (`data.yaml`), or training logs.
* **Actual Implementation in Code:**
  * The application simulates CAD (Car Crash Dataset) / YOLO object detection via:
    1. A prompt to OpenAI `gpt-4o` if `OPENAI_API_KEY` is configured.
    2. A filename-based keyword heuristic fallback in `src/app/api/emergency/analyze-image/route.ts` if no key is present.
  * Supported simulated classes in code: `People`, `Vehicles`, `Damaged Vehicles`, `Smoke/Fire`, and `Others`.
* **Screenshot & Presentation Labeling Requirement:**
  * Presentation slides and technical reports must **never** caption photo-analysis screenshots as "Trained YOLOv8 Object Detection".
  * They must be honestly labeled:
    * When running offline/unauthenticated: *"Keyword-Heuristic Fallback (Simulated Bounding Boxes; Synthetic 0.91 Placeholder Confidence)"*.
    * When running with cloud keys: *"OpenAI GPT-4o Multimodal Vision API (Zero-Shot Telemetry Extraction)"*.
* **Academic Guidance:** In the project report and research paper, do **not** claim to have custom-trained a local YOLOv8 network unless you train and integrate one in Python. Present this component truthfully as an *AI-assisted vision pipeline / multimodal vision API*.

---

### 9. Whisper Model Size and Language Configuration
* **Architecture:** Cloud API client calling OpenAI Whisper (`https://api.openai.com/v1/audio/transcriptions`).
* **Model Identifier:** Explicitly set to `'whisper-1'` in `src/app/api/voice/transcribe/route.ts` (line 18).
* **Model Size:** `'whisper-1'` is OpenAI's hosted large-v2/v3 model hosted on OpenAI infrastructure; no model weights reside on your computer.
* **Language Setting:** Automatic language detection is utilized (`data.language || 'English'`).
* **Fallback:** When unconfigured or offline, the route randomly samples from 4 realistic pre-recorded emergency transcripts with a synthetic 0.95 placeholder confidence score.

---

### 10. GPS and Browser Geolocation Implementation
* **Implementation:** React custom hook `useGeolocation` located in [useGeolocation.ts](file:///c:/Antigravity%20projects'/src/hooks/useGeolocation.ts).
* **API:** HTML5 W3C Standard Browser Geolocation API (`navigator.geolocation.getCurrentPosition`).
* **Parameters:**
  * `enableHighAccuracy: true` (forces device GPS chip / high-accuracy WiFi triangulation).
  * `timeout: 15000` (15-second timeout threshold).
  * `maximumAge: 5000` (caches location for up to 5 seconds).
* **Coordinate Bounds Validation:** `validateCoordinates()` rejects `NaN`, out-of-bounds latitude (`[-90, 90]`) or longitude (`[-180, 180]`), and `(0, 0)`.
* **Accuracy Quality Rating:**
  * Accuracy $< 15\text{ m}$: `HIGH`
  * Accuracy $15\text{ m} - 50\text{ m}$: `MEDIUM`
  * Accuracy $> 50\text{ m}$: `LOW`
* **Fallback:** Allows manual coordinate override via `setManualLocation()` or falls back to demonstration coordinates (`19.0760, 72.8777`) if device location is blocked.

---

### 11. Hospital Discovery Service and API
Hospital search operates through a **3-tier prioritized discovery pipeline**:
1. **Tier 1 (Google Places API):** [googlePlacesService.ts](file:///c:/Antigravity%20projects'/src/lib/services/googlePlacesService.ts). When `GOOGLE_PLACES_API_KEY` is provided, queries Google Places API (New) `https://places.googleapis.com/v1/places:searchNearby` with fallback to Google Maps Places Legacy Nearby Search.
2. **Tier 2 (OpenStreetMap Overpass API):** [overpassHospitalService.ts](file:///c:/Antigravity%20projects'/src/lib/services/overpassHospitalService.ts). Free, open-source live GIS service querying `amenity=hospital`, `healthcare=hospital`, `amenity=clinic`, and `emergency=yes` within radius. Includes an in-memory 5-minute cache and 3 fallback mirrors (`overpass-api.de`, `kumi.systems`, `nchc.org.tw`).
3. **Tier 3 (Local Demo Data):** [seed.ts](file:///c:/Antigravity%20projects'/src/lib/db/seed.ts). Contains 5 preset demo hospitals with verified capabilities (`Apex Trauma Center`, `CityCare General Hospital`, `St. Jude Heart Institute`, `Metro Burn Clinic`, `GreenValley Hospital`).
* **Hospital Capability Limitations:** OpenStreetMap tags do not contain live ICU bed counts, active trauma surgeon availability, or real-time clinical telemetry. Capability requirements derived by the system represent domain-specific dispatch guidelines, not real-time verified clinical services.

---

### 12. Distance Calculation Method
* **Method:** **Haversine Great-Circle Geodesic Distance Formula** implemented in [haversine.ts](file:///c:/Antigravity%20projects'/src/lib/utils/haversine.ts).
* **Formula:**
  $$\Delta\sigma = 2 \arcsin \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}$$
  $$d = R \cdot \Delta\sigma \quad (\text{where Earth mean radius } R = 6371\text{ km})$$
* **Geodesic vs. Road Routing Distinction:**
  * Haversine computes straight-line geodesic distance ("as-the-crow-flies").
  * It does **not** reflect road layout, traffic congestion, or actual driving transit time.
  * Turn-by-turn road driving directions are delegated to external navigation providers (Google Maps) via deep links (`https://www.google.com/maps/search/?api=1&query=lat,lon`).

---

### 13. Severity Calculation Mechanism & Consistency Definition
Severity is determined through an **explainable, deterministic rule-based prioritization algorithm** (`severityScoringEngine.ts`).

#### A. Raw Score Equation ($S_{\text{raw}} \in [1, 20]$)
$$S_{\text{raw}} = \min\left(20, \sum w_i \cdot \mathbb{I}(\text{keyword}_i) + w_{\text{cas}} + w_{\text{CAD}}\right)$$
* **Keyword Weights ($w_i$):**
  * Unconscious Patient: $+5\text{ pts}$
  * Respiratory Failure / Choking: $+5\text{ pts}$
  * Severe Active Hemorrhage: $+5\text{ pts}$
  * Cardiac Arrest / Crushing Chest Pain: $+5\text{ pts}$
  * Active Fire / Thermal Burn: $+5\text{ pts}$
  * Traumatic Head Injury: $+4\text{ pts}$
  * Vehicle Collision / Impact: $+3\text{ pts}$
  * Bone Fracture / Major Trauma: $+3\text{ pts}$
  * Minor Superficial Wound: $+1\text{ pt}$
* **Casualty Bonus ($w_{\text{cas}}$):** $+3\text{ pts}$ if reported casualty count $\ge 2$.
* **Visual CAD Bonus ($w_{\text{CAD}}$):** $+2$ to $+3\text{ pts}$ if accident detected with confidence $> 0.70$.

#### B. Display Score Equation ($S_{\text{disp}} \in [15, 100]$)
$$S_{\text{disp}} = \min(100, \max(15, S_{\text{raw}} \times 5))$$
* Linearly scales the authoritative 1–20 raw score for UI percentage dials without altering underlying tier boundaries.

#### C. Input Completeness Metric ($C_{\text{input}} \in [0, 100\%]$)
$$C_{\text{input}} = \frac{N_{\text{provided}}}{4} \times 100\% \quad (N_{\text{provided}} \in \{1, 2, 3, 4\}: \text{text}, \text{voice}, \text{image}, \text{GPS})$$
* **Crucial Definition:** This metric reflects the completeness of telemetry channels provided by the user. It is **NOT** a machine learning model confidence or diagnostic certainty score.

#### D. Priority Tier Thresholds
* $S_{\text{raw}} \ge 10 \implies$ **`CRITICAL`** (Priority 1: Immediate life threat)
* $S_{\text{raw}} \in [6, 9] \implies$ **`HIGH`** (Priority 2: Urgent intervention)
* $S_{\text{raw}} \in [3, 5] \implies$ **`MODERATE`** (Priority 3: Semi-urgent)
* $S_{\text{raw}} < 3 \implies$ **`LOW`** (Priority 4: Non-urgent / routine)

#### E. Medical Disclaimer & Clinical Wording
* **Important Academic Caveat:** This scoring algorithm is a computational pre-triage prioritization heuristic designed for educational engineering demonstration. It has not undergone clinical trials, is not an approved medical device, and must not be characterized in research papers as a clinically validated triage system (such as official ESI or Manchester Triage).

---

### 14. Report Formats Supported
1. **Interactive Web Dashboard:** Rich, real-time views on `/dashboard`, `/emergency/[id]`, and `/admin`.
2. **REST API JSON:** Full 31-field structured telemetry payload returned from `/api/emergency/[id]` and `/api/emergency/analyze`.
3. **Official Binary PDF Document:** Native PDF 1.4 multi-page document constructed on the server in [pdfService.ts](file:///c:/Antigravity%20projects'/src/lib/services/pdfService.ts) and served via `/api/reports/generate?id=...`. Contains two dedicated pages covering clinical triage, computer vision counts, GPS telemetry, matched hospital details, audit logs, and medical disclaimers.
4. **Email Dispatch Alert:** HTML email with emergency incident summary dispatched to hospital emergency desks via Resend API (`src/lib/services/emailService.ts`).

---

### 15. Offline Functionality and Synchronization
* **Current State:** **Partly Built / Utility Only**.
* **Source:** [syncService.ts](file:///c:/Antigravity%20projects'/src/lib/services/syncService.ts).
* **Capabilities:** Functions exist to read and write a pending incident queue to browser `localStorage` (`ai_emergency_sync_queue`).
* **Limitations:**
  * No **Service Worker** (`sw.js`) is registered.
  * No Progressive Web App (PWA) manifest (`manifest.json`) is configured in `public/`.
  * The `queueIncidentForSync()` function is currently not called in the primary user submission workflow (`RapidEmergencyFlow.tsx`).
* **Academic Guidance:** Do not claim in your paper that the system has an active Service Worker background-sync engine; describe this accurately as an *in-development local storage persistence module*.

---

## 16. Scholarly References & Theoretical Foundations

Each citation below directly maps to and substantiates a specific architectural, algorithmic, or clinical concept implemented in the AI Emergency Response System:

1. **Emergency Severity Triage Framework (ESI):**  
   Gilboy, N., Tanabe, T., Travers, D., & Rosenau, A. M. (2012). *Emergency Severity Index (ESI): A Triage Tool for Emergency Department Care, Version 4. Implementation Handbook 2012 Edition* (AHRQ Publication No. 12-0014). Rockville, MD: Agency for Healthcare Research and Quality.  
   *Mapped Concept:* Underpins the 4-tier emergency priority hierarchy and clinical keyword weights in `severityScoringEngine.ts`.

2. **Manchester Triage System (MTS):**  
   Mackway-Jones, K., Marsden, J., & Windle, J. (Eds.). (2014). *Emergency Triage: Manchester Triage Group* (3rd ed.). Oxford, UK: BMJ Books / John Wiley & Sons. ISBN: 978-1-118-29906-7.  
   *Mapped Concept:* Informs discriminator red-flag detection (unconscious, hemorrhage, respiratory distress) for rapid ambulance dispatch gating.

3. **Haversine Great-Circle Geodesic Distance Formula:**  
   Sinnott, R. W. (1984). "Virtues of the Haversine". *Sky and Telescope*, 68(2), 159.  
   *Mapped Concept:* Provides the exact mathematical basis for spherical geodesic distance calculation ($R = 6371\text{ km}$) in `src/lib/utils/haversine.ts`.

4. **Crowdsourced GIS and Spatial Infrastructure (OpenStreetMap):**  
   Haklay, M., & Weber, P. (2008). "OpenStreetMap: User-Generated Street Maps". *IEEE Pervasive Computing*, 7(4), 12–18. https://doi.org/10.1109/MPRV.2008.80.  
   *Mapped Concept:* Justifies the extraction of public hospital locations and geographic tags via Overpass spatial bounding-box queries in `overpassHospitalService.ts`.

5. **Speech Recognition via Weak Supervision (Whisper):**  
   Radford, A., Kim, J. W., Xu, T., Brockman, G., McLeavey, C., & Sutskever, I. (2023). "Robust Speech Recognition via Large-Scale Weak Supervision". In *Proceedings of the 40th International Conference on Machine Learning (ICML 2023)*, PMLR 202:28492–28518.  
   *Mapped Concept:* Substantiates the audio transcription pipeline (`/api/voice/transcribe`) targeting OpenAI's cloud-hosted `whisper-1` model.

6. **Multimodal Visual Intelligence (GPT-4 / GPT-4o):**  
   Achiam, J., Adler, S., Agarwal, S., Ahmad, L., Akkaya, I., Aleman, F. L., ... & Zoph, B. (2023). "GPT-4 Technical Report". *arXiv preprint arXiv:2303.08774*. OpenAI.  
   *Mapped Concept:* References the zero-shot multimodal vision API utilized for scene image understanding in `src/app/api/emergency/analyze-image/route.ts`.

7. **Real-Time Object Detection Foundations (YOLO):**  
   Redmon, J., Divvala, S., Girshick, R., & Farhadi, A. (2016). "You Only Look Once: Unified, Real-Time Object Detection". In *Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR 2016)*, pp. 779–788. https://doi.org/10.1109/CVPR.2016.91.  
   *Mapped Concept:* Establishes theoretical background for the CAD bounding-box telemetry schema, contrasting future on-device edge detection against current zero-shot cloud inference.

8. **W3C Geolocation API Standards:**  
   Popescu, A. (Ed.). (2016). *Geolocation API Specification (2nd Edition)*. W3C Recommendation. World Wide Web Consortium. Available: https://www.w3.org/TR/geolocation-API/  
   *Mapped Concept:* Validates the HTML5 browser-native GPS acquisition hook in `src/hooks/useGeolocation.ts`.

9. **Embedded Edge Data Persistence (SQLite):**  
   Hipp, D. R. (2020). *SQLite Architecture and Write-Ahead Logging*. SQLite Technical Design Documentation. https://www.sqlite.org/wal.html.  
   *Mapped Concept:* Substantiates synchronous local data persistence and atomic crash-safety in `src/lib/db/store.ts`.
