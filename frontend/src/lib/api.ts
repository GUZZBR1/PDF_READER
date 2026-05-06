export const BACKEND_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ??
  "http://localhost:8000"
).replace(/\/+$/, "");

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
      const data = (await response.json()) as {
        detail?: unknown;
        message?: unknown;
      };
      const message =
        extractErrorMessage(data.detail) ?? extractErrorMessage(data.message);

      if (message) {
        return message;
      }

      return fallbackMessage;
    }

    const text = (await response.text()).trim();
    return text || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function extractErrorMessage(detail: unknown): string | null {
  if (typeof detail === "string") {
    return detail.trim() || null;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map(extractErrorMessage)
      .filter((message): message is string => Boolean(message));

    return messages.length ? messages.join(" ") : null;
  }

  if (detail && typeof detail === "object") {
    const record = detail as Record<string, unknown>;

    if (typeof record.msg === "string") {
      return record.msg.trim() || null;
    }

    if (typeof record.message === "string") {
      return record.message.trim() || null;
    }
  }

  return null;
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
