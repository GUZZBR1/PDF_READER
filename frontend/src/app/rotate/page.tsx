"use client";

import { useState } from "react";

import FileUpload from "@/components/FileUpload";
import PageHeader from "@/components/PageHeader";
import { apiEndpoint, downloadBlob, readApiErrorMessage } from "@/lib/api";

const ROTATION_ANGLES = [90, 180, 270] as const;

type RotationAngle = (typeof ROTATION_ANGLES)[number];

export default function RotatePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pagesToRotate, setPagesToRotate] = useState("all");
  const [angle, setAngle] = useState<RotationAngle>(90);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRotating, setIsRotating] = useState(false);

  function addFiles(selectedFiles: File[]) {
    setError("");
    setSuccess("");

    if (selectedFiles.length > 1) {
      setError("Select only one PDF file for rotation.");
      return;
    }

    const selectedFile = selectedFiles[0];

    if (!selectedFile) {
      return;
    }

    if (!isPdfFile(selectedFile)) {
      setError("Only PDF files can be selected.");
      return;
    }

    setFiles([selectedFile]);
  }

  function removeFile() {
    setError("");
    setSuccess("");
    setFiles([]);
  }

  async function rotatePdf() {
    setError("");
    setSuccess("");

    if (files.length !== 1) {
      setError("Select one PDF file before rotating pages.");
      return;
    }

    const pageValidationError = validatePagesToRotate(pagesToRotate);

    if (pageValidationError) {
      setError(pageValidationError);
      return;
    }

    if (!isValidAngle(angle)) {
      setError("Choose a rotation angle of 90, 180, or 270 degrees.");
      return;
    }

    setIsRotating(true);

    try {
      const normalizedPages =
        pagesToRotate.trim().toLowerCase() === "all" ? "all" : pagesToRotate.trim();
      const formData = new FormData();

      formData.append("file", files[0]);
      formData.append("pages_to_rotate", normalizedPages);
      formData.append("angle", String(angle));

      const response = await fetch(apiEndpoint("/pdf/rotate"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "The backend could not rotate the selected pages.",
          ),
        );
      }

      const rotatedPdf = await response.blob();

      if (!rotatedPdf.size || rotatedPdf.type !== "application/pdf") {
        throw new Error("The backend did not return a valid PDF file.");
      }

      downloadBlob(rotatedPdf, "rotated.pdf");
      setSuccess("Rotated PDF downloaded.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not rotate PDF. Try again.",
      );
    } finally {
      setIsRotating(false);
    }
  }

  return (
    <main className="app-shell">
      <PageHeader
        title="Rotate PDF"
        description="Rotate all pages or selected page ranges."
        showBackLink
      />
      <div className="tool-layout">
        <div className="tool-workflow">
          <FileUpload
            accept=".pdf,application/pdf"
            buttonLabel="Choose PDF"
            disabled={isRotating}
            files={files}
            helperText="Drag one PDF file here, or choose it from your device."
            label="Select one PDF"
            multiple={false}
            onFilesAdded={addFiles}
            onRemoveFile={removeFile}
            selectedFilesLabel="Selected file"
          />
          <section className="form-panel" aria-label="Pages to rotate">
            <label className="field-label" htmlFor="pages-to-rotate">
              Pages to rotate
            </label>
            <input
              className="text-input"
              disabled={isRotating}
              id="pages-to-rotate"
              onChange={(event) => {
                setError("");
                setSuccess("");
                setPagesToRotate(event.target.value);
              }}
              placeholder="all or 1-3,5,8-10"
              type="text"
              value={pagesToRotate}
            />
            <p className="field-help">
              Use all to rotate every page, or formats like 1, 1-3, 1-3,5,
              or 1-3,5,8-10.
            </p>
          </section>
          <section className="form-panel" aria-label="Rotation angle">
            <span className="field-label">Rotation angle</span>
            <div className="angle-options" role="group" aria-label="Rotation angle">
              {ROTATION_ANGLES.map((rotationAngle) => (
                <button
                  className={`angle-option${
                    angle === rotationAngle ? " is-selected" : ""
                  }`}
                  disabled={isRotating}
                  key={rotationAngle}
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setAngle(rotationAngle);
                  }}
                  type="button"
                >
                  {rotationAngle}°
                </button>
              ))}
            </div>
          </section>
        </div>
        <aside className="status-panel">
          <span className="status-label is-connected">Backend connected</span>
          <p>Rotate all pages or selected ranges from one PDF.</p>
          {isRotating ? <p className="status-info">Rotating PDF...</p> : null}
          {error ? <p className="status-error">{error}</p> : null}
          {success ? <p className="status-success">{success}</p> : null}
          <button
            className="primary-button"
            disabled={isRotating || files.length !== 1 || !pagesToRotate.trim()}
            onClick={rotatePdf}
            type="button"
          >
            {isRotating ? "Rotating PDF..." : "Rotate PDF"}
          </button>
        </aside>
      </div>
    </main>
  );
}

function isPdfFile(file: File) {
  return file.name.toLowerCase().endsWith(".pdf");
}

function isValidAngle(value: number): value is RotationAngle {
  return ROTATION_ANGLES.includes(value as RotationAngle);
}

function validatePagesToRotate(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "Enter the pages you want to rotate.";
  }

  if (normalizedValue.toLowerCase() === "all") {
    return "";
  }

  const parts = normalizedValue.split(",");

  for (const rawPart of parts) {
    const part = rawPart.trim();

    if (!part) {
      return "Page ranges cannot contain empty entries.";
    }

    if (!/^\d+(?:-\d+)?$/.test(part)) {
      return "Use all, or page ranges like 1, 1-3, or 1-3,5,8-10.";
    }

    const [startPage, endPage = startPage] = part.split("-").map(Number);

    if (startPage < 1 || endPage < 1) {
      return "Page numbers must be positive.";
    }

    if (startPage > endPage) {
      return "Range start cannot be greater than range end.";
    }
  }

  return "";
}
