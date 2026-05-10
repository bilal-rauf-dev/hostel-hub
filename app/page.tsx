"use client";

import { useState, useEffect, useRef } from "react";
import { SplashScreen } from "@/components/splash-screen";
import { LoginForm } from "@/components/auth/login-form";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { motion, AnimatePresence } from "motion/react";
import { getCurrentUser, isAuthenticated } from "@/lib/auth";

type AppView = "splash" | "login" | "dashboard";

export default function Home() {
  const [view, setView] = useState<AppView>("splash");
  const [userRole, setUserRole] = useState<"student" | "admin" | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const splashDone = useRef(false);

  useEffect(() => {
    setIsHydrated(true);

    if (isAuthenticated()) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUserRole(currentUser.role);
        setView("dashboard");
        splashDone.current = true;
        return;
      }
    }
    // Always show splash on fresh load
    setView("splash");
  }, []);

  const handleLogin = (role: "student" | "admin") => {
    setUserRole(role);
    setView("dashboard");
  };

  if (!isHydrated) {
    return null;
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
            <LoginForm onLogin={handleLogin} />
          </motion.div>
        )}

        {view === "dashboard" && userRole && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{
              duration: 1,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2,
            }}
            className="w-full h-full"
          >
            <DashboardView
              userRole={userRole}
              onLogout={() => {
                setView("login");
                setUserRole(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
