"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { hasStoredAppPassword, isAuthEnabled } from "@/lib/auth";

type AuthGateProps = {
  children: ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginRoute = pathname === "/login";
  const [isAllowed, setIsAllowed] = useState(
    !isAuthEnabled() || isLoginRoute,
  );

  useEffect(() => {
    if (isLoginRoute) {
      setIsAllowed(true);
      return;
    }

    if (!isAuthEnabled()) {
      setIsAllowed(true);
      return;
    }

    if (!hasStoredAppPassword()) {
      router.replace("/login");
      return;
    }

    setIsAllowed(true);
  }, [isLoginRoute, router]);

  if (!isAllowed) {
    return (
      <main className="app-shell">
        <div className="auth-panel">
          <p className="status-info">Checking private access...</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
