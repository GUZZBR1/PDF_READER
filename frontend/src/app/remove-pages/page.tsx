"use client";

import { useState } from "react";

import FileUpload from "@/components/FileUpload";
import PageHeader from "@/components/PageHeader";
import { apiFetch, downloadBlob, readApiErrorMessage } from "@/lib/api";
import { isPdfBlob, isPdfFile } from "@/lib/files";

export default function RemovePagesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pagesToRemove, setPagesToRemove] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  function addFiles(selectedFiles: File[]) {
    setError("");
    setSuccess("");

    if (selectedFiles.length > 1) {
      setError("Select only one PDF file for page removal.");
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

  async function removePages() {
    setError("");
    setSuccess("");

    if (files.length !== 1) {
      setError("Select one PDF file before removing pages.");
      return;
    }

    const validationError = validatePageRanges(pagesToRemove);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsRemoving(true);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("pages_to_remove", pagesToRemove.trim());

      const response = await apiFetch("/pdf/remove-pages", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "The backend could not remove the selected pages.",
          ),
        );
      }

      const removedPagesPdf = await response.blob();

      if (!isPdfBlob(removedPagesPdf)) {
        throw new Error("The backend did not return a valid PDF file.");
      }

      downloadBlob(removedPagesPdf, "removed-pages.pdf");
      setSuccess("PDF with removed pages downloaded.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not remove pages. Try again.",
      );
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <main className="app-shell">
      <PageHeader
        title="Remove Pages"
        description="Delete unwanted pages while keeping the rest of the document."
        showBackLink
      />
      <div className="tool-layout">
        <div className="tool-workflow">
          <FileUpload
            accept=".pdf,application/pdf"
            buttonLabel="Choose PDF"
            disabled={isRemoving}
            files={files}
            helperText="Drag one PDF file here, or choose it from your device."
            label="Select one PDF"
            multiple={false}
            onFilesAdded={addFiles}
            onRemoveFile={removeFile}
            selectedFilesLabel="Selected file"
          />
          <section className="form-panel" aria-label="Pages to remove">
            <label className="field-label" htmlFor="pages-to-remove">
              Pages to remove
            </label>
            <input
              className="text-input"
              disabled={isRemoving}
              id="pages-to-remove"
              onChange={(event) => {
                setError("");
                setSuccess("");
                setPagesToRemove(event.target.value);
              }}
              placeholder="1-3,5,8-10"
              type="text"
              value={pagesToRemove}
            />
            <p className="field-help">
              Use formats like 1, 1-3, 1-3,5, or 1-3,5,8-10.
            </p>
          </section>
        </div>
        <aside className="status-panel">
          <span className="status-label">Local backend required</span>
          <p>Remove selected pages from one PDF and download the result.</p>
          {isRemoving ? <p className="status-info">Removing pages...</p> : null}
          {error ? <p className="status-error">{error}</p> : null}
          {success ? <p className="status-success">{success}</p> : null}
          <button
            className="primary-button"
            disabled={isRemoving || files.length !== 1 || !pagesToRemove.trim()}
            onClick={removePages}
            type="button"
          >
            {isRemoving ? "Removing pages..." : "Remove Pages"}
          </button>
        </aside>
      </div>
    </main>
  );
}

function validatePageRanges(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "Enter the pages you want to remove.";
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
