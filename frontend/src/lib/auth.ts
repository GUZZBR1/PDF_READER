const AUTH_STORAGE_KEY = "private-pdf-tool-password";

export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "false";

export function isAuthEnabled() {
  return AUTH_ENABLED;
}

export function getStoredAppPassword() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY) ?? "";
}

export function hasStoredAppPassword() {
  return Boolean(getStoredAppPassword());
}

export function storeAppPassword(password: string) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, password);
}

export function clearStoredAppPassword() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
