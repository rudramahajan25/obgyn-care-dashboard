# Demo User Credentials

Use these credentials to sign in to the **OB/GYN Care Dashboard** (both locally and on the hosted GitHub Pages site).

Each account logs into a role-specific dashboard with distinct workflows and alarm permissions.

---

## Credentials List

| Role | Name | Username | Password | Department / Description |
| :--- | :--- | :--- | :--- | :--- |
| **Doctor** | Dr. Ananya Sharma | `ananya.sharma` | `Doctor@2025` | Attending Obstetrician · Full monitoring, OR schedule, STAT calls |
| **Assistant Doctor** | Dr. Rahul Mehta | `rahul.mehta` | `Resident@2025` | Resident on Labour Ward · Clinical monitoring & assistance |
| **Nurse** | Priya Nair | `priya.nair` | `Nurse@2025` | Labour Room Charge Nurse · LR checklist, assistance calls, USG requests |
| **Midwife** | Elena Costa | `elena.costa` | `Midwife@2025` | Birthing Suite Midwife · Patient monitoring & delivery care |
| **Lift Operator** | Suresh Kumar | `suresh.kumar` | `Lift@2025` | Patient Transport · Stretcher / bed shifting requests queue |
| **Wheelchair Attendant** | Amit Patel | `amit.patel` | `Wheelchair@2025` | Patient Transport · Wheelchair transport requests queue |
| **Laboratory** | Meena Rao | `meena.lab` | `Laboratory@2025` | Central Laboratory · Incoming STAT & routine LR lab tests queue |
| **Ultrasound** | Deepa Iyer | `deepa.usg` | `Ultrasound@2025` | Ultrasound Suite · Scan request queue, DICOM report push |

---

## Where Are These Configured In Code?

- **User Accounts Definition**: [`src/data/userAccounts.ts`](./src/data/userAccounts.ts) (defines credentials and authentication logic)
- **Role Profiles & Details**: [`src/data/mockData.ts`](./src/data/mockData.ts) (role profile info)
- **Login Component**: [`src/pages/LoginPage.tsx`](./src/pages/LoginPage.tsx) (handles sign-in flow)

---

## Testing Multi-Role Alarms (Recommended Demo Setup)

Open two browser tabs side-by-side:
1. **Tab 1**: Sign in as `priya.nair` (Nurse)
2. **Tab 2**: Sign in as `ananya.sharma` (Doctor)
3. In the Nurse tab, click **"Call On-Duty Doctor"** (STAT).
4. Watch the Doctor tab receive the audible alarm banner immediately in real-time (alarms only ring for the recipient, not the sender!).
