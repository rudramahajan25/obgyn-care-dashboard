# Obstetrics & Gynecology — Care Dashboard

Browser-first prototype for a pregnancy / L&D hospital ward with **profile-based dashboards**:

| Role | What they see |
|------|----------------|
| **Doctor / Assistant Doctor** | Full patient list, vitals, CTG, ultrasound, OR status, STAT staff calls |
| **Nurse / Midwife** | Same clinical view + **Call Lift** / **Call Wheelchair** with routine / urgent / STAT priority |
| **Lift operator / Wheelchair attendant** | Shifting requests — stretcher, wheelchair, or without equipment |
| **Laboratory** | Incoming lab calls from LR with test list — acknowledge & complete |
| **Ultrasound team** | USG workflow — update status and **push report** to labour room |

### Labour room (nurses / midwives)

- **Checklist**: multiparameter (BP, pulse, ECG, SpO₂) + CTG (contractions, FHR) + current medications  
- **Prior records** at same facility: OPD visits, old **lab** & **ultrasound** reports (demo: Andrea Paul)  
- **Assistance**: on-duty doctor (STAT + alarm), **shifting boy** (stretcher / wheelchair / neither), **call laboratory**, request ultrasound  
- **USG status** on LR: Yet to record → Waiting → Under review → Ready, with **Remind** when not ready  

### Alarms

STAT / urgent calls **ring only on the recipient’s dashboard** (lift, wheelchair, ultrasound, lab, doctor) — not on the nurse screen that placed the call. Use two browser tabs with different roles to test.

See **[DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md)** for demo user accounts and passwords.

See **[AGENTS.md](./AGENTS.md)** for full project context for AI agents.

See **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** for the current architecture, workflows, state model, and implementation notes.

Design follows your O&G dashboard mockup (purple brand, facility sidebar for doctors).

## Quick start

```bash
cd /Users/rudramahajan/obgyn-care-dashboard
npm install
npm run dev
```

Open the URL shown (usually `http://localhost:5173`).

### Demo flows

1. **Nurse** → Andrea → View OPD/lab/USG history → checklist → **Call laboratory** (pick tests).  
2. **Laboratory** tab → see call → acknowledge → done.  
3. **Nurse** → **Request ultrasound** → **Ultrasound** tab → advance status → **Push report** → nurse sees Ready + alarm.  
4. **Nurse** → **Alert shifting boy** → choose *with stretcher* → **Lift** tab accepts trip.  
5. **Call on-duty doctor** → **Doctor** tab gets STAT alarm banner + sound.

State persists in `localStorage`.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Recharts (CTG graph)
- **[DWV](https://ivmartel.github.io/dwv/)** — in-browser DICOM viewer for `.dcm` ultrasound frames
- **AI summaries** — local **Ollama** (`qwen3.5:9b`) with chart-based fallback; pregnancy record, prior visits, medications
- Lucide icons

### Ollama (optional AI enhance)

Summaries render instantly from chart data. Click **Enhance with AI** to refine via local Ollama — avoids loading the GPU on every patient switch. Requires `ollama serve` and model `qwen3.5:9b`.

### DICOM demo files

Synthetic obstetric ultrasound DICOMs live in `public/dicom/demo/`. Regenerate with:

```bash
python3 -m venv .venv && .venv/bin/pip install pydicom numpy
.venv/bin/python scripts/gen_dicom.py
```

## Next steps (production)

- Backend API + WebSockets for real-time vitals and transport
- Auth (hospital SSO) instead of role picker
- PACS / EHR integration for ultrasound and history tabs
- Push notifications / pager for STAT and transport
- Wrap with **Capacitor** or **React Native** for native apps

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview production build
