#!/usr/bin/env python3
"""Generate synthetic obstetric ultrasound DICOM demos for the web viewer."""

from __future__ import annotations

import os
from datetime import datetime

import numpy as np
from pydicom.dataset import FileDataset, FileMetaDataset
from pydicom.uid import ExplicitVRLittleEndian, SecondaryCaptureImageStorage, generate_uid

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "dicom", "demo")

FILES = [
    ("obstetric-sagittal.dcm", "Demo^ObstetricSagittal"),
    ("obstetric-transverse.dcm", "Demo^ObstetricTransverse"),
    ("fetal-profile.dcm", "Demo^FetalProfile"),
]


def write_us(path: str, patient_name: str, seed: int) -> None:
    rng = np.random.default_rng(seed)
    rows, cols = 256, 256
    base = rng.exponential(1.0, (rows, cols)).astype(np.float32)
    base = (base / base.max() * 200 + 20).astype(np.uint8)
    y, x = np.ogrid[:rows, :cols]
    cy, cx = rows * 0.55, cols * 0.5
    mask = ((x - cx) ** 2 + (y - cy) ** 2) < (cols * 0.42) ** 2
    arr = np.zeros((rows, cols), dtype=np.uint8)
    arr[mask] = base[mask]

    file_meta = FileMetaDataset()
    file_meta.MediaStorageSOPClassUID = SecondaryCaptureImageStorage
    file_meta.MediaStorageSOPInstanceUID = generate_uid()
    file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
    file_meta.ImplementationClassUID = generate_uid()

    ds = FileDataset(path, {}, file_meta=file_meta, preamble=b"\0" * 128)
    ds.is_little_endian = True
    ds.is_implicit_VR = False

    dt = datetime.now()
    ds.SOPClassUID = SecondaryCaptureImageStorage
    ds.SOPInstanceUID = file_meta.MediaStorageSOPInstanceUID
    ds.StudyInstanceUID = generate_uid()
    ds.SeriesInstanceUID = generate_uid()
    ds.Modality = "US"
    ds.StudyDate = dt.strftime("%Y%m%d")
    ds.StudyTime = dt.strftime("%H%M%S")
    ds.ContentDate = ds.StudyDate
    ds.ContentTime = ds.StudyTime
    ds.PatientName = patient_name
    ds.PatientID = "DEMO001"
    ds.SeriesDescription = "Obstetric ultrasound demo"
    ds.InstanceNumber = 1
    ds.Rows = rows
    ds.Columns = cols
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    ds.BitsAllocated = 8
    ds.BitsStored = 8
    ds.HighBit = 7
    ds.PixelRepresentation = 0
    ds.PixelData = arr.tobytes()
    ds.save_as(path, write_like_original=False)


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for i, (filename, name) in enumerate(FILES, start=1):
        out = os.path.join(OUT_DIR, filename)
        write_us(out, name, seed=10 + i)
        print(f"Wrote {out}")


if __name__ == "__main__":
    main()
