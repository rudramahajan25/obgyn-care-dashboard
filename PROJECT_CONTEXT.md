# Obstetrics & Gynecology Care Dashboard — Project Context

Code-reviewed snapshot: 11 October 2026. Read this alongside [AGENTS.md](./AGENTS.md), which contains project instructions, and [README.md](./README.md), which contains quick-start guidance.

## Purpose and scope

A browser-first hospital workflow prototype for pregnancy, labour and delivery, and postpartum care. Different login profiles coordinate patient monitoring, labour-room tasks, transport, laboratory calls, ultrasound, and operating-theatre scheduling.

The application currently uses synthetic patient data, client-side demo accounts, and browser storage. A production backend, hospital SSO, real device feeds, PACS/EHR integration, and a native application are future work.

## Technology and entry points

- React 19, TypeScript 5.8, Vite 6, and Tailwind CSS 4.
- React Router 7 selects the application at `/`; `src/App.tsx` chooses the dashboard by logged-in role.
- Recharts renders CTG traces; DWV provides the dynamically imported DICOM viewer; Lucide supplies icons.
- `src/main.tsx` initializes the app. `src/context/AppContext.tsx` owns shared workflow state and exposes `useApp()`.
- `src/types.ts` defines patients, profiles, alarms, requests, ultrasound orders, checklists, staff, and OT bookings.

## Role dashboards

| Login role | Component in `src/pages/` | Main responsibilities |
| --- | --- | --- |
| `doctor`, `assistant_doctor` | `DoctorDashboard.tsx` | Patient monitoring, prior records, summaries, OR status and staff STAT calls |
| `nurse`, `midwife` | `LabourRoomDashboard.tsx` | Labour-room checklist, assistance requests, ultrasound follow-up and patient monitoring |
| `liftman`, `wheelchair` | `TransportDashboard.tsx` | Equipment-specific transport queue and trip progression |
| `laboratory` | `LaboratoryDashboard.tsx` | Requested tests, call acknowledgement and completion |
| `ultrasound` | `UltrasoundDashboard.tsx` | Scan workflow progression and report-ready notification |

Login credentials are defined in `src/data/userAccounts.ts`. Login state is held in React memory, so separate tabs can use different roles and a reload returns to login. This is demo authentication, with no server-side access control.

## State and data flow

User action → `useApp()` operation → React state update → localStorage persistence → other same-origin tabs receive a `storage` event and update their workflow state.

The storage key is `obgyn-care-state-v3`. Persisted collections are:

- Transport requests, STAT calls, and facility calls.
- Ultrasound orders and OT bookings.
- Per-patient labour checklists and alarms.

The loader also contains migration paths for older v1 and v2 storage. Login, selected patient, live patient measurements, and toasts are not included in the persisted workflow object. Tab synchronization uses browser storage, not a backend or WebSocket connection; live vital-sign simulations run independently within each clinical tab.

Seed data is in `src/data/`: `mockData.ts`, `patientHistory.ts`, `hospitalStaff.ts`, `otScheduleSeed.ts`, `dicomStudies.ts`, and `patientAiSummaries.ts`.

## Main workflows

### Labour room and patient monitoring

`LabourRoomChecklist.tsx` supports multiparameter and CTG checks alongside medication information. `AssistancePanel.tsx` initiates on-duty doctor, transport, laboratory, and ultrasound requests. `PatientRecordsPanel.tsx` exposes previous OPD visits, laboratory results, and ultrasound records at the same facility.

There are seven demo patients. Andrea Paul (`p1`, bed B1) is the primary returning-patient demo. Postpartum patients such as Meera (`p3`) have no CTG trace. `useLivePatients.ts` updates simulated measurements approximately every 2.8 seconds for doctor, assistant doctor, nurse, and midwife profiles. The simulation resets to seed patients when monitoring is disabled.

### Transport and laboratory

Transport follows `pending` → `accepted` → `in_transit` → `completed`. Requests include patient, origin, destination, priority, and equipment: `stretcher`, `wheelchair`, or `without_equipment`. Transport type determines the receiving role.

Laboratory calls carry `testsRequested[]`; the laboratory dashboard supports acknowledgement and completion.

### Ultrasound and DICOM

A request creates an ultrasound order and a facility call. A patient cannot have another pending ultrasound order. The workflow is:

`yet_to_record` → `waiting_for_patient` → `under_review` → `ready`

The labour-room ultrasound workflow appears after a request. DICOM viewing becomes available during `under_review` and `ready`; report readiness notifies the clinical recipients. Prior ultrasound records remain a separate history workflow.

`getPatientUltrasoundOrder(patientId)` returns the latest order regardless of status. `getUltrasoundOrder(patientId)` returns that order only if it is not ready, for pending-work/reminder use.

Synthetic `.dcm` assets live in `public/dicom/demo/`. `src/data/dicomStudies.ts` maps studies to patients; `DicomViewer.tsx` and `DicomViewerModal.tsx` render them. Report pushing is a demo workflow backed by these assets, not a PACS integration.

### OT scheduling

The facility sidebar opens `OtSchedulingModal.tsx`, which includes the booking board, team assignment, and staff availability. Three operating rooms are defined. The current roster contains 42 entries: 10 consultants, 3 assistant doctors, 9 nurses, 4 midwives, 3 anesthetists, 2 neonatologists, 3 OT technicians, 2 laboratory staff, 2 ultrasound staff, and 4 transport staff.

`scheduleOtBooking`, `updateOtBookingStatus`, and `cancelOtBooking` manage bookings. `src/utils/otScheduling.ts` checks room/staff time overlaps and derives room and staff displays from bookings. Availability uses a fixed demo time of `11:30`; the default date helper uses the UTC date. These displays are not connected to a live staffing service.

## Alarm rules to preserve

Alarms must reach the called roles. A nurse or midwife initiating a service request must not hear that request's alarm.

| Event | Recipients |
| --- | --- |
| Lift/shifting request | `liftman` |
| Wheelchair request | `wheelchair` |
| Laboratory call | `laboratory` |
| Ultrasound request or reminder | `ultrasound` |
| On-duty doctor call | `doctor`, `assistant_doctor` |
| Ultrasound report ready | `nurse`, `midwife`, `doctor` |
| Facility staff STAT call | Roles derived by `statCallRecipientRoles()` |

`AppContext.tsx` creates alarms but does not play sound. `AlarmBanner.tsx` filters by recipient role and plays sound for newly encountered urgent/STAT alarms. Routine notifications, including the current report-ready alarm, display without a tone. The report-ready recipient list currently excludes `assistant_doctor`.

The store retains up to 20 alarms. Dismissing an alarm removes it from shared state, so dismissal propagates to other tabs.

## Patient summaries and optional Ollama

Chart-derived summaries render by default without an LLM generation request. `usePatientAiSummary.ts` checks local Ollama availability and exposes a manual **Enhance with AI** action. Enhanced summaries are cached in memory by patient ID; failures retain the chart fallback.

`src/services/ollama.ts` calls `http://localhost:11434/api/chat` with model `qwen3.5:9b`, JSON output, a 60-second request timeout, and `num_predict: 300`. Chart context is assembled in `src/utils/patientChartContext.ts`.

The intended handover presentation follows condition → admission P/V → pelvis for primigravida → current status → relevant abnormal antenatal history → medications → plan. Full prior records remain in the history panel.

## Development and verification

Run from the repository root:

```bash
npm install
npm run dev
npm run build
npm run preview
```

Vite normally serves development at `http://localhost:5173`; use the actual URL printed by the server. Homebrew npm may be available at `/opt/homebrew/bin/npm`. The build script runs `tsc -b && vite build`. There is currently no test or lint script in `package.json`.

To regenerate synthetic DICOMs:

```bash
python3 -m venv .venv
.venv/bin/pip install pydicom numpy
.venv/bin/python scripts/gen_dicom.py
```

For workflow changes, build and manually check the affected roles in two tabs on the same origin. Useful smoke flows are nurse → laboratory acknowledgement/completion; nurse → ultrasound → report ready; nurse → transport completion; nurse → on-duty doctor alarm; and OT booking with an overlapping staff/room slot.

This context document was checked against source files; creating it did not include a runtime or build verification.

## Documentation differences observed

- Existing roster prose says 40 staff; the actual array contains 42.
- Existing AI guidance says a maximum of 400 tokens; the service currently configures 300.
- `docs/Demo_User_Credentials.docx` is referenced by existing documentation and login errors, but the `docs/` directory is absent in this checkout. Accounts are available in `src/data/userAccounts.ts`; a generator exists at `scripts/gen_credentials_doc.py`.
- README production notes refer to replacing a role picker, while the current login already uses demo usernames/passwords.

These are observations of the current checkout, not changes to application behavior.

## Constraints for subsequent work

- Preserve all role-specific dashboards and recipient-only alarm routing.
- Preserve equipment choices, prior facility records, simulated live vitals, and request-gated ultrasound visibility.
- Do not introduce a specific nursing-home brand in UI copy.
- Real PACS, HL7/FHIR, SSO, backend infrastructure, and native wrappers require additional scope.
- Do not create Git commits unless the user asks.
- Read the relevant source before editing; use `AGENTS.md` for repository instructions and this document as a dated implementation snapshot.

## Summary refinement — 12 October 2026

The clinical summary now includes a patient context line, five current maternal observations with units and monitor freshness, explicit missing bedside observations, and consent/counselling reminders. Consent is not stored or inferred as completed; reminders cover the patient's decision, procedure/anaesthetic discussion when relevant, relatives with permission, and capacity/emergency escalation under local policy.

Current CTG text comes from structured monitor data; it no longer uses fixed scenario FHR values, invents accelerations, or assigns a CTG category. P/V and pelvis findings remain chart-owned during AI merging. Primigravida display now uses gravida = 1. Patient changes invalidate pending summary requests.

Ollama receives all current vital readings, dated/unit-bearing significant labs and explicit missing-data context. Its output budget is now 1,000 tokens with a 4,096-token context window, replacing the settings described in the original snapshot. AI must not relabel current readings as admission observations or invent consent completion/treatment orders. Existing synthetic scenario lab/history/plan narratives remain demo content.

Reference checks: [RCOG consent guidance](https://www.rcog.org.uk/guidance/consent/) for informed discussion/documentation and [NICE fetal monitoring guidance](https://www.nice.org.uk/guidance/ng229/chapter/recommendations) for avoiding interpretation from FHR alone. These references do not establish local consent law or validate the demo clinical plans.

Validation: production build and focused regression checks passed. Run the checks with:

```bash
./node_modules/.bin/esbuild tests/clinical-summary.test.ts --bundle --platform=node --format=esm --outfile=/tmp/obgyn-clinical-summary-test.mjs
node /tmp/obgyn-clinical-summary-test.mjs
```
