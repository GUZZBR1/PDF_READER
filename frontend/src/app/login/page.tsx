"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import PageHeader from "@/components/PageHeader";
import {
  hasStoredAppPassword,
  isAuthEnabled,
  storeAppPassword,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!isAuthEnabled() || hasStoredAppPassword()) {
      router.replace("/");
    }
  }, [router]);

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedPassword = password.trim();

    if (!trimmedPassword) {
      setError("Enter the private access password.");
      return;
    }

    setIsLoggingIn(true);
    storeAppPassword(trimmedPassword);
    router.replace("/");
  }

  return (
    <main className="app-shell">
      <PageHeader
        title="Private Access"
        description="Enter the shared password for this private PDF workspace."
      />
      <form className="auth-panel" onSubmit={login}>
        <label className="field-label" htmlFor="app-password">
          Password
        </label>
        <input
          autoComplete="current-password"
          autoFocus
          className="text-input"
          disabled={isLoggingIn}
          id="app-password"
          onChange={(event) => {
            setError("");
            setPassword(event.target.value);
          }}
          type="password"
          value={password}
        />
        {error ? <p className="status-error">{error}</p> : null}
        <button
          className="primary-button"
          disabled={isLoggingIn || !password.trim()}
          type="submit"
        >
          {isLoggingIn ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
