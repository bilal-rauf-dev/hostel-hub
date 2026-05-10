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

  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    setIsMaintenance(false);
    
    // Check maintenance mode immediately
    const checkMaintenance = async () => {
       try {
          // We can use native fetch or apiClient
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/settings/maintenance`);
          const data = await res.json();
          if (data?.success && data?.data?.maintenance_mode) {
             setIsMaintenance(true);
          }
       } catch(e) {
          console.error('Maintenance check failed', e);
       }
    };
    checkMaintenance();

    if (isAuthenticated()) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUserRole(currentUser.role);
        setView("dashboard");
        splashDone.current = true;
        setIsHydrated(true);
        return;
      }
    }
    // Always show splash on fresh load
    setView("splash");
    setIsHydrated(true);
  }, []);

  const handleLogin = (role: "student" | "admin") => {
    setUserRole(role);
    setView("dashboard");
  };

  if (!isHydrated) {
    return null;
  }

  if (isMaintenance && userRole !== 'admin') {
     return (
       <main className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center space-y-6">
          <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ type: "spring" }}
             className="w-24 h-24 bg-orange-100 text-orange-500 rounded-[2rem] flex items-center justify-center shadow-inner"
          >
             <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
          </motion.div>
          <motion.h1 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="text-4xl font-black text-[#4D5D53] tracking-tighter"
          >
             System Maintenance
          </motion.h1>
          <motion.p 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.1 }}
             className="text-sm text-[#9A9A9A] font-medium max-w-sm"
          >
             HostelHub is currently down for scheduled maintenance. Please check back later.
          </motion.p>
          <motion.button 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             onClick={() => window.location.reload()}
             className="px-6 py-3 bg-[#4D5D53] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#3D4D43] transition-all"
          >
             Refresh Page
          </motion.button>
       </main>
     )
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
