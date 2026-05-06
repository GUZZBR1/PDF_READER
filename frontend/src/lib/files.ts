export function isPdfFile(file: File) {
  return file.name.toLowerCase().endsWith(".pdf");
}

export function isPdfBlob(blob: Blob) {
  return blob.size > 0 && (!blob.type || blob.type === "application/pdf");
}

export function isZipBlob(blob: Blob, contentType: string) {
  if (!blob.size) {
    return false;
  }

  if (!contentType) {
    return true;
  }

  const normalizedContentType = contentType.toLowerCase();
  return (
    normalizedContentType.includes("zip") ||
    normalizedContentType.includes("octet-stream")
  );
}

export function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
