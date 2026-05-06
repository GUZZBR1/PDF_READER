"use client";

import { useState } from "react";

import FileUpload from "@/components/FileUpload";
import PageHeader from "@/components/PageHeader";
import { apiEndpoint, downloadBlob, readApiErrorMessage } from "@/lib/api";
import { isPdfBlob, isPdfFile } from "@/lib/files";

const COMPRESSION_LEVELS = [
  {
    value: "low",
    label: "Low",
    description: "Best quality, larger file",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Balanced compression",
  },
  {
    value: "high",
    label: "High",
    description: "Smaller file, lower quality",
  },
] as const;

type CompressionLevel = (typeof COMPRESSION_LEVELS)[number]["value"];

export default function CompressPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [compressionLevel, setCompressionLevel] =
    useState<CompressionLevel>("medium");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);

  function addFiles(selectedFiles: File[]) {
    setError("");
    setSuccess("");

    if (selectedFiles.length > 1) {
      setError("Select only one PDF file for compression.");
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

  async function compressPdf() {
    setError("");
    setSuccess("");

    if (files.length !== 1) {
      setError("Select one PDF file before compressing.");
      return;
    }

    if (!isValidCompressionLevel(compressionLevel)) {
      setError("Choose low, medium, or high compression.");
      return;
    }

    setIsCompressing(true);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("compression_level", compressionLevel);

      const response = await fetch(apiEndpoint("/pdf/compress"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "The backend could not compress the selected PDF.",
          ),
        );
      }

      const compressedPdf = await response.blob();

      if (!isPdfBlob(compressedPdf)) {
        throw new Error("The backend did not return a valid PDF file.");
      }

      downloadBlob(compressedPdf, "compressed.pdf");
      setSuccess("Compressed PDF downloaded.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not compress PDF. Try again.",
      );
    } finally {
      setIsCompressing(false);
    }
  }

  return (
    <main className="app-shell">
      <PageHeader
        title="Compress PDF"
        description="Reduce PDF file size for easier storage and sharing."
        showBackLink
      />
      <div className="tool-layout">
        <div className="tool-workflow">
          <FileUpload
            accept=".pdf,application/pdf"
            buttonLabel="Choose PDF"
            disabled={isCompressing}
            files={files}
            helperText="Drag one PDF file here, or choose it from your device."
            label="Select one PDF"
            multiple={false}
            onFilesAdded={addFiles}
            onRemoveFile={removeFile}
            selectedFilesLabel="Selected file"
          />
          <section className="form-panel" aria-label="Compression level">
            <span className="field-label">Compression level</span>
            <div
              className="compression-options"
              role="group"
              aria-label="Compression level"
            >
              {COMPRESSION_LEVELS.map((level) => (
                <button
                  className={`compression-option${
                    compressionLevel === level.value ? " is-selected" : ""
                  }`}
                  disabled={isCompressing}
                  key={level.value}
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setCompressionLevel(level.value);
                  }}
                  type="button"
                >
                  <span className="compression-option-title">{level.label}</span>
                  <span className="compression-option-description">
                    {level.description}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
        <aside className="status-panel">
          <span className="status-label is-connected">Backend connected</span>
          <p>Compress one PDF and download the smaller result.</p>
          {isCompressing ? <p className="status-info">Compressing PDF...</p> : null}
          {error ? <p className="status-error">{error}</p> : null}
          {success ? <p className="status-success">{success}</p> : null}
          <button
            className="primary-button"
            disabled={isCompressing || files.length !== 1}
            onClick={compressPdf}
            type="button"
          >
            {isCompressing ? "Compressing PDF..." : "Compress PDF"}
          </button>
        </aside>
      </div>
    </main>
  );
}

function isValidCompressionLevel(value: string): value is CompressionLevel {
  return COMPRESSION_LEVELS.some((level) => level.value === value);
}
