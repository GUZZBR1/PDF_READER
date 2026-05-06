"use client";

import { useEffect, useRef, useState } from "react";

import FileUpload from "@/components/FileUpload";
import PageHeader from "@/components/PageHeader";
import { apiEndpoint, downloadBlob, readApiErrorMessage } from "@/lib/api";
import { formatFileSize, isPdfBlob } from "@/lib/files";

const ACCEPTED_IMAGE_TYPES = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

export default function ImageToPdfPage() {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const imagesRef = useRef<SelectedImage[]>([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, []);

  function addFiles(selectedFiles: File[]) {
    setError("");
    setSuccess("");

    if (!selectedFiles.length) {
      return;
    }

    const invalidFile = selectedFiles.find((file) => !isAllowedImageFile(file));

    if (invalidFile) {
      setError("Only JPG, PNG, and WEBP images can be selected.");
      return;
    }

    const nextImages = selectedFiles.map((file) => ({
      id: createImageId(file),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((currentImages) => [...currentImages, ...nextImages]);
  }

  function removeImage(index: number) {
    setError("");
    setSuccess("");
    setImages((currentImages) => {
      const imageToRemove = currentImages[index];

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return currentImages.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  function moveImage(index: number, direction: -1 | 1) {
    setError("");
    setSuccess("");
    setImages((currentImages) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= currentImages.length) {
        return currentImages;
      }

      const reorderedImages = [...currentImages];
      const currentImage = reorderedImages[index];

      reorderedImages[index] = reorderedImages[targetIndex];
      reorderedImages[targetIndex] = currentImage;

      return reorderedImages;
    });
  }

  async function convertImagesToPdf() {
    setError("");
    setSuccess("");

    if (!images.length) {
      setError("Select at least one image to convert.");
      return;
    }

    const invalidImage = images.find((image) => !isAllowedImageFile(image.file));

    if (invalidImage) {
      setError("Only JPG, PNG, and WEBP images can be converted.");
      return;
    }

    setIsConverting(true);

    try {
      const formData = new FormData();

      for (const image of images) {
        formData.append("files", image.file);
      }

      const response = await fetch(apiEndpoint("/image/to-pdf"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "The backend could not convert the selected images.",
          ),
        );
      }

      const pdf = await response.blob();

      if (!isPdfBlob(pdf)) {
        throw new Error("The backend did not return a valid PDF file.");
      }

      downloadBlob(pdf, "images.pdf");
      setSuccess("PDF downloaded.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not convert images. Try again.",
      );
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <main className="app-shell">
      <PageHeader
        title="Image to PDF"
        description="Turn one or more images into a single PDF."
        showBackLink
      />
      <div className="tool-layout">
        <div className="tool-workflow">
          <FileUpload
            accept={ACCEPTED_IMAGE_TYPES}
            buttonLabel="Choose images"
            disabled={isConverting}
            files={images.map((image) => image.file)}
            helperText="Drag JPG, PNG, or WEBP images here, or choose them from your device."
            iconLabel="IMG"
            label="Select images"
            multiple
            onFilesAdded={addFiles}
            onRemoveFile={removeImage}
            selectedFilesLabel="Selected images"
            showSelectedFiles={false}
          />
          {images.length > 0 ? (
            <section className="image-list-panel" aria-label="Selected images">
              <div className="selected-files-header">
                <h2>Selected images</h2>
                <span>{images.length} total</span>
              </div>
              <ul className="image-preview-list">
                {images.map((image, index) => (
                  <li className="image-preview-item" key={image.id}>
                    <div className="image-preview-frame">
                      <img
                        alt=""
                        className="image-preview"
                        src={image.previewUrl}
                      />
                    </div>
                    <div className="image-preview-meta">
                      <span className="file-name">{image.file.name}</span>
                      <span className="file-size">
                        {formatFileSize(image.file.size)}
                      </span>
                    </div>
                    <div className="image-actions" aria-label="Image order controls">
                      <button
                        className="remove-file-button"
                        disabled={isConverting || index === 0}
                        onClick={() => moveImage(index, -1)}
                        type="button"
                      >
                        Up
                      </button>
                      <button
                        className="remove-file-button"
                        disabled={isConverting || index === images.length - 1}
                        onClick={() => moveImage(index, 1)}
                        type="button"
                      >
                        Down
                      </button>
                      <button
                        className="remove-file-button"
                        disabled={isConverting}
                        onClick={() => removeImage(index)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <aside className="status-panel">
          <span className="status-label is-connected">Backend connected</span>
          <p>Convert selected images into a single PDF in the order shown.</p>
          {isConverting ? (
            <p className="status-info">Converting images to PDF...</p>
          ) : null}
          {error ? <p className="status-error">{error}</p> : null}
          {success ? <p className="status-success">{success}</p> : null}
          <button
            className="primary-button"
            disabled={isConverting || images.length < 1}
            onClick={convertImagesToPdf}
            type="button"
          >
            {isConverting ? "Converting images to PDF..." : "Convert to PDF"}
          </button>
        </aside>
      </div>
    </main>
  );
}

function isAllowedImageFile(file: File) {
  const extension = getFileExtension(file.name);

  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return false;
  }

  return !file.type || ALLOWED_IMAGE_MIME_TYPES.has(file.type);
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

function createImageId(file: File) {
  return `${file.name}-${file.lastModified}-${file.size}-${crypto.randomUUID()}`;
}
