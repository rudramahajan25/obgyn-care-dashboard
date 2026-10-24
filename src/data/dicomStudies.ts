export interface DicomFrame {
  id: string;
  label: string;
  url: string;
}

/** Demo obstetric ultrasound series (generated synthetic US DICOM, Modality US). */
export const demoDicomSeries: DicomFrame[] = [
  {
    id: "sagittal",
    label: "Sagittal",
    url: "/dicom/demo/obstetric-sagittal.dcm",
  },
  {
    id: "transverse",
    label: "Transverse",
    url: "/dicom/demo/obstetric-transverse.dcm",
  },
  {
    id: "profile",
    label: "Fetal profile",
    url: "/dicom/demo/fetal-profile.dcm",
  },
];

export const patientDicomSeries: Record<string, DicomFrame[]> = {
  p1: demoDicomSeries,
  p2: demoDicomSeries.slice(0, 2),
  p5: demoDicomSeries.slice(1, 3),
};

export function getDicomSeriesForPatient(patientId: string): DicomFrame[] {
  return patientDicomSeries[patientId] ?? demoDicomSeries;
}
