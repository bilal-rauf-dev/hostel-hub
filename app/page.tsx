"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SplashScreen } from "@/components/splash-screen";
import { LoginForm } from "@/components/auth/login-form";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { SignInPrompt } from "@/components/offline/sign-in-prompt";
import { ConnectivityProvider } from "@/lib/offline/connectivity";
import { SessionProvider, useSession } from "@/lib/session/session-context";
import { getCurrentUser, isAuthenticated } from "@/lib/auth";
import type { ApiResponse, MaintenanceStatus } from "@/lib/types";

type AppView = "splash" | "login" | "dashboard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function AppShell() {
  const session = useSession();
  const [view, setView] = useState<AppView>("splash");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const splashDone = useRef(false);

  useEffect(() => {
    // Maintenance mode is advisory. If the check itself cannot reach the
    // server we do NOT lock the user out: that is exactly the case where the
    // cached, offline-capable app is most useful.
    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/settings/maintenance`);
        const body: ApiResponse<MaintenanceStatus> = await res.json();
        // The field is `enabled`. Reading `maintenance_mode` here is why this
        // never fired before.
        if (body?.success && body?.data?.enabled) setIsMaintenance(true);
      } catch {
        setIsMaintenance(false);
      }
    };
    void checkMaintenance();

    if (isAuthenticated() && getCurrentUser()) {
      splashDone.current = true;
      setView("dashboard");
    } else {
      setView("splash");
    }
    setIsHydrated(true);
  }, []);

  const handleLogin = () => {
    const user = getCurrentUser();
    if (user) session.adoptUser(user);
    setView("dashboard");
  };

  const handleGuest = () => {
    session.continueAsGuest();
    setView("dashboard");
  };

  const handleLogout = async () => {
    await session.signOut();
    setView("login");
  };

  if (!isHydrated) return null;

  const role = session.user?.role ?? null;

  if (isMaintenance && role !== "admin") {
    return (
      <main className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="w-24 h-24 bg-orange-100 text-orange-500 rounded-[2rem] flex items-center justify-center shadow-inner"
        >
          <svg
            className="w-12 h-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </motion.div>
        <h1 className="text-4xl font-black text-[#4D5D53] tracking-tighter">
          System Maintenance
        </h1>
        <p className="text-sm text-[#9A9A9A] font-medium max-w-sm">
          HostelHub is currently down for scheduled maintenance. Please check
          back later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[#4D5D53] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#3D4D43] transition-all"
        >
          Refresh Page
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] overflow-hidden">
      <AnimatePresence mode="wait">
        {view === "splash" && (
          <SplashScreen
            key="splash"
            onComplete={() => {
              splashDone.current = true;
              setView("login");
            }}
          />
        )}

        {view === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(20px)", scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <LoginForm onLogin={handleLogin} onGuest={handleGuest} />
          </motion.div>
        )}

        {view === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-full h-full"
          >
            <DashboardView userRole={role} onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>

      <SignInPrompt onSignIn={() => setView("login")} />
    </main>
  );
}

export default function Home() {
  return (
    <ConnectivityProvider>
      <SessionProvider>
        <AppShell />
      </SessionProvider>
    </ConnectivityProvider>
  );
}
