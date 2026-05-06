"use client";

import { useState } from "react";

import FileUpload from "@/components/FileUpload";
import PageHeader from "@/components/PageHeader";
import { apiEndpoint, downloadBlob, readApiErrorMessage } from "@/lib/api";
import { isPdfFile, isZipBlob } from "@/lib/files";

const IMAGE_FORMATS = ["png", "jpeg"] as const;
const DEFAULT_DPI = "200";
const MIN_DPI = 72;
const MAX_DPI = 300;

type ImageFormat = (typeof IMAGE_FORMATS)[number];

export default function PdfToImagePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [imageFormat, setImageFormat] = useState<ImageFormat>("png");
  const [dpi, setDpi] = useState(DEFAULT_DPI);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  function addFiles(selectedFiles: File[]) {
    setError("");
    setSuccess("");

    if (selectedFiles.length > 1) {
      setError("Select only one PDF file for image conversion.");
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

  async function convertPdfToImages() {
    setError("");
    setSuccess("");

    if (files.length !== 1) {
      setError("Select one PDF file before converting.");
      return;
    }

    if (!isValidImageFormat(imageFormat)) {
      setError("Choose png or jpeg as the image format.");
      return;
    }

    const parsedDpi = Number(dpi);

    if (!Number.isInteger(parsedDpi) || parsedDpi < MIN_DPI || parsedDpi > MAX_DPI) {
      setError("DPI must be a whole number from 72 to 300.");
      return;
    }

    setIsConverting(true);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("image_format", imageFormat);
      formData.append("dpi", String(parsedDpi));

      const response = await fetch(apiEndpoint("/pdf/to-image"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "The backend could not convert the PDF to images.",
          ),
        );
      }

      const contentType = response.headers.get("content-type") ?? "";
      const imageZip = await response.blob();

      if (!isZipBlob(imageZip, contentType)) {
        throw new Error("The backend did not return a valid ZIP file.");
      }

      downloadBlob(imageZip, "pdf-images.zip");
      setSuccess("Image ZIP downloaded.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not convert PDF to images. Try again.",
      );
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <main className="app-shell">
      <PageHeader
        title="PDF to Image"
        description="Export PDF pages as image files."
        showBackLink
      />
      <div className="tool-layout">
        <div className="tool-workflow">
          <FileUpload
            accept=".pdf,application/pdf"
            buttonLabel="Choose PDF"
            disabled={isConverting}
            files={files}
            helperText="Drag one PDF file here, or choose it from your device."
            label="Select one PDF"
            multiple={false}
            onFilesAdded={addFiles}
            onRemoveFile={removeFile}
            selectedFilesLabel="Selected file"
          />
          <section className="form-panel" aria-label="Image format">
            <span className="field-label">Image format</span>
            <div className="format-options" role="group" aria-label="Image format">
              {IMAGE_FORMATS.map((format) => (
                <button
                  className={`format-option${
                    imageFormat === format ? " is-selected" : ""
                  }`}
                  disabled={isConverting}
                  key={format}
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setImageFormat(format);
                  }}
                  type="button"
                >
                  {format}
                </button>
              ))}
            </div>
          </section>
          <section className="form-panel" aria-label="DPI">
            <label className="field-label" htmlFor="dpi">
              DPI
            </label>
            <input
              className="text-input"
              disabled={isConverting}
              id="dpi"
              inputMode="numeric"
              max={MAX_DPI}
              min={MIN_DPI}
              onChange={(event) => {
                setError("");
                setSuccess("");
                setDpi(event.target.value);
              }}
              step="1"
              type="number"
              value={dpi}
            />
            <p className="field-help">
              Higher DPI generates larger and sharper images.
            </p>
          </section>
        </div>
        <aside className="status-panel">
          <span className="status-label is-connected">Backend connected</span>
          <p>Export each PDF page as an image file inside a ZIP archive.</p>
          {isConverting ? (
            <p className="status-info">Converting PDF to images...</p>
          ) : null}
          {error ? <p className="status-error">{error}</p> : null}
          {success ? <p className="status-success">{success}</p> : null}
          <button
            className="primary-button"
            disabled={isConverting || files.length !== 1 || !dpi.trim()}
            onClick={convertPdfToImages}
            type="button"
          >
            {isConverting ? "Converting PDF to images..." : "Convert PDF to Images"}
          </button>
        </aside>
      </div>
    </main>
  );
}

function isValidImageFormat(value: string): value is ImageFormat {
  return IMAGE_FORMATS.includes(value as ImageFormat);
}
