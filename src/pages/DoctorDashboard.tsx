import { AlarmBanner } from "../components/alerts/AlarmBanner";
import { FacilitySidebar } from "../components/facility/FacilitySidebar";
import { PatientRecordsPanel } from "../components/history/PatientRecordsPanel";
import { TopBar } from "../components/layout/TopBar";
import { PatientSidebar } from "../components/layout/PatientSidebar";
import { PatientDetail } from "../components/patient/PatientDetail";

export function DoctorDashboard() {
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <AlarmBanner />
      <div className="flex min-h-0 flex-1">
        <PatientSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border bg-surface px-5 py-3">
            <PatientRecordsPanel />
          </div>
          <PatientDetail showClinicalActions />
        </div>
        <FacilitySidebar showStatCalls showTransportStaff />
      </div>
    </div>
  );
}
