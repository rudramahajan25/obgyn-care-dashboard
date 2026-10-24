# AGENTS.md — Obstetrics & Gynecology Care Dashboard

Use this file to restore project context in Cursor or other coding agents.

## Project purpose

Browser-first **profile-based hospital dashboard** for pregnancy / labour & delivery (L&D):

- Doctors and assistants: full patient monitoring, OR schedule, STAT calls, history.
- Nurses and midwives: **Labour room (LR)** checklist, assistance calls, ultrasound request workflow.
- Lift operator / wheelchair attendant: transport queue.
- Laboratory: incoming lab calls from ward.
- Ultrasound team: acquisition workflow and DICOM report push.

Planned later: native app (Capacitor / React Native), real backend, PACS, SSO.

## Repository layout

```
obgyn-care-dashboard/
├── AGENTS.md                 ← this file
├── README.md                 ← user-facing quick start
├── public/dicom/demo/        ← synthetic .dcm files (US modality)
├── scripts/gen_dicom.py      ← regenerate demo DICOMs (pydicom)
├── src/
│   ├── App.tsx               ← role router
│   ├── context/AppContext.tsx ← global state + localStorage
│   ├── types.ts
│   ├── data/
│   │   ├── mockData.ts       ← patients, role profiles (login)
│   │   ├── hospitalStaff.ts  ← 40-person roster
│   │   ├── otScheduleSeed.ts ← initial OT bookings
│   │   ├── patientHistory.ts ← OPD / lab / USG prior records
│   │   ├── patientAiSummaries.ts ← fallback AI summary narratives
│   │   ├── userAccounts.ts     ← demo username/password accounts
│   │   └── dicomStudies.ts   ← DICOM frame URLs per patient
│   ├── hooks/
│   │   ├── useLivePatients.ts ← vitals/CTG tick every ~2.8s
│   │   └── usePatientAiSummary.ts ← Ollama + fallback summaries
│   ├── services/ollama.ts    ← local Ollama API (default model qwen3.5:9b)
│   ├── utils/liveVitals.ts, alarmSound.ts, clinicalPriority.ts, patientChartContext.ts
│   ├── components/
│   │   ├── alerts/AlarmBanner.tsx  ← recipient-only alarms + sound
│   │   ├── dicom/DicomViewer.tsx   ← DWV wrapper
│   │   ├── labour/                 ← LR checklist, assistance, USG workflow
│   │   ├── patient/                ← vitals, CTG, patient detail
│   │   └── layout/, facility/, history/
│   └── pages/                ← one dashboard per login role
```

## Tech stack

- **React 19**, **TypeScript**, **Vite 6**, **Tailwind v4**
- **Recharts** — CTG lines
- **DWV** (`dwv`) — DICOM viewer (dynamic import)
- **localStorage** key `obgyn-care-state-v3` — transport, facility calls, USG orders, **OT bookings**, checklists

## Run locally

```bash
cd obgyn-care-dashboard
npm install
npm run dev
# http://localhost:5173
```

Node via Homebrew if needed: `/opt/homebrew/bin/npm`.

### AI clinical summaries (Ollama)

Patient AI summaries use **chart-based fallback by default** (no GPU). Optional **Enhance with AI** button calls local Ollama (`qwen3.5:9b`, max 400 tokens). LR handover order: condition → P/V admission → pelvis (primigravida) → current status → relevant antenatal (abnormal only) → meds → plan. Full history stays in Prior records panel.

Regenerate DICOM demos:

```bash
python3 -m venv .venv && .venv/bin/pip install pydicom numpy
.venv/bin/python scripts/gen_dicom.py
```

## Roles and routing (`App.tsx`)

| Login role | Page component |
|------------|----------------|
| `doctor`, `assistant_doctor` | `DoctorDashboard` |
| `nurse`, `midwife` | `LabourRoomDashboard` |
| `liftman`, `wheelchair` | `TransportDashboard` |
| `laboratory` | `LaboratoryDashboard` |
| `ultrasound` | `UltrasoundDashboard` |

Login uses **demo username/password** (`LoginPage.tsx`, `userAccounts.ts`). Credential list: `docs/Demo_User_Credentials.docx`. No real auth.

## Core workflows

### 1. Labour room (nurse / midwife)

- **Checklist** (`LabourRoomChecklist.tsx`): multiparameter (BP, pulse, ECG, SpO₂), CTG checks, medications.
- **Assistance** (`AssistancePanel.tsx`):
  - Call on-duty doctor → STAT → alarms **doctors only**
  - Shifting boy → stretcher / wheelchair / neither → alarms **liftman** or **wheelchair only**
  - Call laboratory → alarms **laboratory only**
  - Request ultrasound → alarms **ultrasound only**
- **Ultrasound after request** (`UltrasoundWorkflowPanel.tsx`): panel appears only after request; DICOM shows when status is `under_review` or `ready`.
- **Prior records** (`PatientRecordsPanel.tsx`): OPD, lab, old USG; open `.dcm` in modal viewer.
- **Live vitals** (`useLivePatients`): enabled for clinical roles only.

### 2. Ultrasound team

- Advance order: `yet_to_record` → `waiting_for_patient` → `under_review` → `ready`.
- **Push DICOM report** on ready → alarm to **nurse, midwife, doctor** (not ultrasound team).

### 3. Transport (lift / wheelchair)

- Requests from LR; accept → in transit → complete.
- Equipment stored on request: `stretcher` | `wheelchair` | `without_equipment`.

### 4. Laboratory

- `FacilityCall` type `laboratory` with `testsRequested[]`; acknowledge / complete.

### 5. Doctor dashboard

- 3-column: patient list | detail (vitals, CTG, USG if requested) | OR + staff STAT.
- USG slot shows placeholder until nurse requests scan.

### 6. OT scheduling

- **40 staff** in `hospitalStaff.ts` (10 consultants, 3 assistants, 9 nurses, 4 midwives, 3 anesthesia, 2 neo, 3 OT tech, 2 lab, 2 USG, 4 transport).
- **OT bookings** (`OtBooking`) with team assignment; availability derived in `utils/otScheduling.ts`.
- **Facility sidebar** → “Schedule” opens `OtSchedulingModal` (board, book case, staff availability).
- APIs: `scheduleOtBooking`, `updateOtBookingStatus`, `cancelOtBooking`; `operatingRooms` and `staffMembers` are computed live.

## Alarms (important)

**Recipients only** — nurses/midwives do **not** hear alarms when they initiate calls.

| Action | `targetRoles` |
|--------|----------------|
| Shifting / lift | `liftman` |
| Wheelchair | `wheelchair` |
| Call laboratory | `laboratory` |
| Request ultrasound | `ultrasound` |
| Call on-duty doctor | `doctor`, `assistant_doctor` |
| Remind USG team | `ultrasound` |
| USG report ready | `nurse`, `midwife`, `doctor` |
| STAT staff call (facility sidebar) | mapped via `statCallRecipientRoles()` |

- Alarms stored in `AppContext` → `alarms[]`.
- **Sound** plays in `AlarmBanner.tsx` only when the **logged-in role** is in `targetRoles` and a **new** alarm arrives (not in `pushAlarm`).
- Demo: use **two browser tabs** with different roles; `localStorage` is shared on same origin.

## Key context API (`useApp()`)

- `patients` — live-updating for clinical roles
- `requestTransport`, `callLaboratory`, `callOnDutyDoctor`, `requestUltrasound`
- `getPatientUltrasoundOrder` — latest USG order (any status)
- `getUltrasoundOrder` — pending only (not ready)
- `updateUltrasoundStatus`, `remindUltrasound`
- `transportRequests`, `facilityCalls`, `alarms`, `dismissAlarm`

## Mock data notes

- Primary demo patient: **Andrea Paul** (`p1`, bed B1), returning patient with history.
- 7 patients in `mockData.ts`; CTG empty for postpartum (e.g. Meera `p3`).
- Do **not** reintroduce a specific nursing home brand name in UI (user request).

## Common tasks for agents

| Task | Where to edit |
|------|----------------|
| Add a role | `types.ts` `UserRole`, `mockData.ts` `roleProfiles`, `LoginPage`, `App.tsx` router, new page |
| Change alarm routing | `AppContext.tsx` `pushAlarm` call sites + `AlarmBanner.tsx` |
| USG workflow copy/status | `UltrasoundWorkflowPanel.tsx`, `UltrasoundDashboard.tsx` |
| New DICOM series | `public/dicom/demo/`, `dicomStudies.ts`, `scripts/gen_dicom.py` |
| Live vitals tuning | `utils/liveVitals.ts`, `hooks/useLivePatients.ts` |

## Build

```bash
npm run build   # tsc + vite; DWV chunked separately
```

## Product constraints from user conversations

1. Profile dashboards for doctors, nurses, midwives, lift, wheelchair, lab, USG.
2. LR checklist + assistance panel (wireframe-driven).
3. OPD / lab / prior USG history at same facility.
4. Shifting with stretcher vs wheelchair vs neither.
5. USG visible **after** nurse requests; DICOM when scan ready.
6. Live random vitals for realism.
7. Alarms ring on **called** roles’ screens, not on caller (nurse) screen.

## Out of scope (unless asked)

- Real PACS / HL7 / FHIR
- Git commits (only when user asks)
- Nursing home branding in copy
