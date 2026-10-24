import { Navigate, Route, Routes } from "react-router-dom";
import { Toast } from "./components/ui/Toast";
import { useApp } from "./context/AppContext";
import { DoctorDashboard } from "./pages/DoctorDashboard";
import { LaboratoryDashboard } from "./pages/LaboratoryDashboard";
import { LabourRoomDashboard } from "./pages/LabourRoomDashboard";
import { LoginPage } from "./pages/LoginPage";
import { TransportDashboard } from "./pages/TransportDashboard";
import { UltrasoundDashboard } from "./pages/UltrasoundDashboard";

function DashboardRouter() {
  const { user } = useApp();
  if (!user) return <LoginPage />;

  switch (user.role) {
    case "doctor":
    case "assistant_doctor":
      return <DoctorDashboard />;
    case "nurse":
    case "midwife":
      return <LabourRoomDashboard />;
    case "liftman":
      return <TransportDashboard role="liftman" />;
    case "wheelchair":
      return <TransportDashboard role="wheelchair" />;
    case "laboratory":
      return <LaboratoryDashboard />;
    case "ultrasound":
      return <UltrasoundDashboard />;
    default:
      return <Navigate to="/" replace />;
  }
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<DashboardRouter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  );
}
