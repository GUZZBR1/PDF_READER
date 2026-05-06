"use client";

import { useState } from "react";

import FileUpload from "@/components/FileUpload";
import PageHeader from "@/components/PageHeader";
import { apiEndpoint, downloadBlob, readApiErrorMessage } from "@/lib/api";
import { isPdfBlob, isPdfFile } from "@/lib/files";

export default function SplitPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageRanges, setPageRanges] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);

  function addFiles(selectedFiles: File[]) {
    setError("");
    setSuccess("");

    if (selectedFiles.length > 1) {
      setError("Select only one PDF file for splitting.");
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

  async function splitPdf() {
    setError("");
    setSuccess("");

    if (files.length !== 1) {
      setError("Select one PDF file to split.");
      return;
    }

    const validationError = validatePageRanges(pageRanges);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSplitting(true);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("page_ranges", pageRanges.trim());

      const response = await fetch(apiEndpoint("/pdf/split"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "The backend could not extract the selected pages.",
          ),
        );
      }

      const splitPdfBlob = await response.blob();

      if (!isPdfBlob(splitPdfBlob)) {
        throw new Error("The backend did not return a valid PDF file.");
      }

      downloadBlob(splitPdfBlob, "split.pdf");
      setSuccess("Split PDF downloaded.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not split PDF. Try again.",
      );
    } finally {
      setIsSplitting(false);
    }
  }

  return (
    <main className="app-shell">
      <PageHeader
        title="Split PDF"
        description="Extract selected pages into a separate PDF file."
        showBackLink
      />
      <div className="tool-layout">
        <div className="split-workflow">
          <FileUpload
            accept=".pdf,application/pdf"
            buttonLabel="Choose PDF"
            disabled={isSplitting}
            files={files}
            helperText="Drag one PDF file here, or choose it from your device."
            label="Select one PDF"
            multiple={false}
            onFilesAdded={addFiles}
            onRemoveFile={removeFile}
            selectedFilesLabel="Selected file"
          />
          <section className="form-panel" aria-label="Page ranges">
            <label className="field-label" htmlFor="page-ranges">
              Page ranges
            </label>
            <input
              className="text-input"
              disabled={isSplitting}
              id="page-ranges"
              onChange={(event) => {
                setError("");
                setSuccess("");
                setPageRanges(event.target.value);
              }}
              placeholder="1-3,5,8-10"
              type="text"
              value={pageRanges}
            />
            <p className="field-help">
              Use formats like 1, 1-3, 1-3,5, or 1-3,5,8-10.
            </p>
          </section>
        </div>
        <aside className="status-panel">
          <span className="status-label">Local backend required</span>
          <p>Extract selected pages from one PDF and download the result.</p>
          {isSplitting ? <p className="status-info">Extracting pages...</p> : null}
          {error ? <p className="status-error">{error}</p> : null}
          {success ? <p className="status-success">{success}</p> : null}
          <button
            className="primary-button"
            disabled={isSplitting || files.length !== 1 || !pageRanges.trim()}
            onClick={splitPdf}
            type="button"
          >
            {isSplitting ? "Extracting pages..." : "Extract Pages"}
          </button>
        </aside>
      </div>
    </main>
  );
}

function validatePageRanges(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "Enter the pages you want to extract.";
  }

  const parts = normalizedValue.split(",");

  for (const rawPart of parts) {
    const part = rawPart.trim();

    if (!part) {
      return "Page ranges cannot contain empty entries.";
    }

    if (!/^\d+(?:-\d+)?$/.test(part)) {
      return "Use page ranges like 1, 1-3, or 1-3,5,8-10.";
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
