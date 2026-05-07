"use client";

import { useState } from "react";

import FileUpload from "@/components/FileUpload";
import PageHeader from "@/components/PageHeader";
import { apiFetch, downloadBlob, readApiErrorMessage } from "@/lib/api";
import { isPdfBlob, isPdfFile } from "@/lib/files";

export default function MergePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  function addFiles(selectedFiles: File[]) {
    setError("");
    setSuccess("");

    const invalidFiles = selectedFiles.filter((file) => !isPdfFile(file));

    if (invalidFiles.length > 0) {
      setError("Only PDF files can be selected.");
      return;
    }

    setFiles((currentFiles) => [...currentFiles, ...selectedFiles]);
  }

  function removeFile(indexToRemove: number) {
    setError("");
    setSuccess("");
    setFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove),
    );
  }

  async function mergePdfs() {
    setError("");
    setSuccess("");

    if (files.length < 2) {
      setError("Select at least 2 PDF files to merge.");
      return;
    }

    setIsMerging(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await apiFetch("/pdf/merge", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "The backend could not merge the selected PDFs.",
          ),
        );
      }

      const mergedPdf = await response.blob();

      if (!isPdfBlob(mergedPdf)) {
        throw new Error("The backend did not return a valid PDF file.");
      }

      downloadBlob(mergedPdf, "merged.pdf");
      setSuccess("Merged PDF downloaded.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not merge PDFs. Try again.",
      );
    } finally {
      setIsMerging(false);
    }
  }

  return (
    <main className="app-shell">
      <PageHeader
        title="Merge PDFs"
        description="Combine multiple PDF files into one ordered document."
        showBackLink
      />
      <div className="tool-layout">
        <FileUpload
          accept=".pdf,application/pdf"
          buttonLabel="Choose PDFs"
          disabled={isMerging}
          files={files}
          helperText="Drag 2 or more PDF files here, or choose them from your device."
          label="Select PDF files"
          multiple
          onFilesAdded={addFiles}
          onRemoveFile={removeFile}
          selectedFilesLabel="Selected files"
        />
        <aside className="status-panel">
          <span className="status-label">Local backend required</span>
          <p>Send selected PDFs to the private backend and download the merged result.</p>
          {isMerging ? <p className="status-info">Merging PDFs...</p> : null}
          {error ? <p className="status-error">{error}</p> : null}
          {success ? <p className="status-success">{success}</p> : null}
          <button
            className="primary-button"
            disabled={isMerging || files.length < 2}
            onClick={mergePdfs}
            type="button"
          >
            {isMerging ? "Merging PDFs..." : "Merge PDFs"}
          </button>
        </aside>
      </div>
    </main>
  );
}
