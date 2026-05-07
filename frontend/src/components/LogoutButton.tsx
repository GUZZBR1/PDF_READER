"use client";

import { useRouter } from "next/navigation";

import { clearStoredAppPassword, isAuthEnabled } from "@/lib/auth";

export default function LogoutButton() {
  const router = useRouter();

  if (!isAuthEnabled()) {
    return null;
  }

  function logout() {
    clearStoredAppPassword();
    router.replace("/login");
  }

  return (
    <button className="logout-button" onClick={logout} type="button">
      Logout
    </button>
  );
}
