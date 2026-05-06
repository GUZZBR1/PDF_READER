export const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:8000";

export function apiEndpoint(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_BASE_URL}${normalizedPath}`;
}

export async function readApiErrorMessage(
  response: Response,
  fallbackMessage: string,
) {
  try {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = (await response.json()) as { detail?: unknown };

      if (typeof data.detail === "string") {
        return data.detail;
      }
    }

    const text = await response.text();
    return text || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
