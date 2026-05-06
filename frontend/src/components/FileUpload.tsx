"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

import { formatFileSize } from "@/lib/files";

type FileUploadProps = {
  files: File[];
  accept?: string;
  buttonLabel?: string;
  disabled?: boolean;
  helperText?: string;
  iconLabel?: string;
  label?: string;
  multiple?: boolean;
  onFilesAdded: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  selectedFilesLabel?: string;
  showSelectedFiles?: boolean;
};

export default function FileUpload({
  files,
  accept,
  buttonLabel = "Choose PDFs",
  disabled = false,
  helperText = "Drag files here or choose them from your device.",
  iconLabel = "PDF",
  label = "Select PDF files",
  multiple = true,
  onFilesAdded,
  onRemoveFile,
  selectedFilesLabel = "Selected files",
  showSelectedFiles = true,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || disabled) {
      return;
    }

    onFilesAdded(Array.from(fileList));

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (!disabled) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <section className="upload-panel" aria-label="File upload">
      <div
        className={`file-upload-dropzone${isDragging ? " is-dragging" : ""}`}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          accept={accept}
          className="file-input"
          disabled={disabled}
          multiple={multiple}
          onChange={handleChange}
          type="file"
        />
        <div className="upload-placeholder-inner">
          <div className="upload-icon" aria-hidden="true">
            {iconLabel}
          </div>
          <div>
            <h2>{label}</h2>
            <p>{helperText}</p>
          </div>
          <button
            className="primary-button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {buttonLabel}
          </button>
        </div>
      </div>

      {showSelectedFiles && files.length > 0 ? (
        <div className="selected-files">
          <div className="selected-files-header">
            <h2>{selectedFilesLabel}</h2>
            <span>{files.length} total</span>
          </div>
          <ul className="file-list">
            {files.map((file, index) => (
              <li
                className="file-list-item"
                key={`${file.name}-${file.lastModified}-${index}`}
              >
                <div className="file-meta">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  className="remove-file-button"
                  disabled={disabled}
                  onClick={() => onRemoveFile(index)}
                  type="button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
