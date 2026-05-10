"use client";

import { motion } from "motion/react";
import {
  Building2,
  Mail,
  Lock,
  ArrowRight,
  Github,
  Calendar,
  Wrench,
  Package,
  Cross,
} from "lucide-react";
import { useState } from "react";
import { authApi } from "@/lib/api";
import { saveTokens, decodeToken } from "@/lib/auth";

interface LoginFormProps {
  onLogin: (role: "student" | "admin") => void;
}

type FormView = "login" | "register" | "register-otp";

export function LoginForm({ onLogin }: LoginFormProps) {
  const [formView, setFormView] = useState<FormView>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerStudentId, setRegisterStudentId] = useState("");
  const [registerRoomNumber, setRegisterRoomNumber] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // Register OTP state
  const [registerOtpEmail, setRegisterOtpEmail] = useState("");
  const [registerOtp, setRegisterOtp] = useState(["", "", "", "", "", ""]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login(loginEmail, loginPassword);
      if (response.data.success) {
        const { access_token, refresh_token, user } = response.data.data;
        saveTokens(access_token, refresh_token);
        console.log("Login response data:", response.data.data);
        console.log("User role:", user.role);
        onLogin(user.role);
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.register({
        display_name: registerFullName,
        email: registerEmail,
        password: registerPassword,
        student_id: registerStudentId,
        room_number: registerRoomNumber,
      });
      if (response.data.success) {
        setRegisterOtpEmail(registerEmail);
        setFormView("register-otp");
      } else {
        setError(response.data.message || "Registration failed");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const otpCode = registerOtp.join("");
      const response = await authApi.verifyOtp(registerOtpEmail, otpCode);
      if (response.data.success) {
        setError(null);
        setFormView("login");
        setLoginEmail(registerOtpEmail);
        setRegisterEmail("");
        setRegisterPassword("");
        setRegisterFullName("");
        setRegisterStudentId("");
        setRegisterRoomNumber("");
        setRegisterOtp(["", "", "", "", "", ""]);
      } else {
        setError(response.data.message || "OTP verification failed");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "OTP verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formView === "login") {
      handleLogin(e);
    } else if (formView === "register") {
      handleRegister(e);
    } else if (formView === "register-otp") {
      handleVerifyOtp(e);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FAF9F6] font-sans text-[#3D3D3D]">
      {/* LEFT PANEL: Brand & Community Splash */}
      <div className="relative hidden lg:flex w-3/5 h-full bg-[#E9EDC9] flex-col justify-center items-center p-16 overflow-hidden">
        {/* Abstract Organic Shapes */}
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#CCD5AE] rounded-full mix-blend-multiply filter blur-3xl opacity-40"
        />
        <motion.div
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 40, -20, 0],
            scale: [1, 0.8, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-[5%] right-[-5%] w-[300px] h-[300px] bg-[#FEFAE0] rounded-full mix-blend-multiply filter blur-3xl opacity-60"
        />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          {/* Stylized Logo */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 bg-[#D4A373] rounded-[2rem] flex items-center justify-center shadow-lg transform">
              <Building2 className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-[#4D5D53]">
                Hostel<span className="text-[#D4A373]">Hub</span>
              </h1>
              <p className="text-[#79837C] font-semibold tracking-widest text-sm">
                COMMUNITY • COMMERCE • CARE
              </p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <h2 className="text-3xl font-semibold leading-tight text-[#4D5D53]">
              Your entire hostel ecosystem, in one digital pocket.
            </h2>
            <p className="text-lg text-[#79837C] leading-relaxed">
              Join 1,200+ students already managing maintenance, marketplace
              finds, and community events through Hostel-Hub.
            </p>

            {/* Social Proof Chips */}
            <div className="flex flex-wrap gap-3 pt-4">
              <div className="px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-white/40 text-xs font-bold text-[#4D5D53] flex items-center gap-2">
                <Calendar className="h-3 w-3 text-[#D4A373]" /> 14 Active Events
              </div>
              <div className="px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-white/40 text-xs font-bold text-[#4D5D53] flex items-center gap-2">
                <Wrench className="h-3 w-3 text-[#D4A373]" /> 98% Fix Rate
              </div>
              <div className="px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-white/40 text-xs font-bold text-[#4D5D53] flex items-center gap-2">
                <Package className="h-3 w-3 text-[#D4A373]" /> 42 New Listings
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Branding */}
        <div className="absolute bottom-10 left-16 text-xs text-[#79837C] font-bold uppercase tracking-widest">
          © 2026 FAST NUCES Residential Services
        </div>
      </div>

      {/* RIGHT PANEL: Login/Register Interface */}
      <div className="w-full lg:w-2/5 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.02)] flex flex-col justify-center px-8 sm:px-16 relative z-20 overflow-y-auto h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-sm mx-auto py-10 h-[stretch]"
        >
          {/* Tab Switcher */}
          {formView !== "register-otp" && (
            <div className="sticky top-0 z-10 flex gap-4 mb-10 border-b border-[#F0F0EE] bg-white">
              <button
                type="button"
                onClick={() => setFormView("login")}
                className={`pb-3 text-sm font-bold uppercase tracking-wide transition-all ${
                  formView === "login"
                    ? "text-[#D4A373] border-b-2 border-[#D4A373]"
                    : "text-[#BDBDBD] hover:text-[#4D5D53]"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setFormView("register")}
                className={`pb-3 text-sm font-bold uppercase tracking-wide transition-all ${
                  formView === "register"
                    ? "text-[#D4A373] border-b-2 border-[#D4A373]"
                    : "text-[#BDBDBD] hover:text-[#4D5D53]"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* LOGIN VIEW */}
          {formView === "login" && (
            <>
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-[#4D5D53] mb-2 uppercase tracking-tight">
                  Welcome Back
                </h3>
                <p className="text-[#9A9A9A] text-sm">
                  Enter your email and password to continue.
                </p>
              </div>

              <form className="space-y-8" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#BDBDBD] mb-4">
                    University Email
                  </label>
                  <div className="relative group/field">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#BDBDBD] group-focus-within/field:text-[#D4A373] transition-colors" />
                    <input
                      type="email"
                      placeholder="name@hostel.edu"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full pl-14 pr-6 py-5 rounded-3xl bg-[#FAF9F6] border-2 border-transparent focus:border-[#D4A373] focus:bg-white focus:ring-8 focus:ring-[#D4A373]/5 outline-none transition-all placeholder:text-[#BDBDBD] text-base font-bold tracking-tight hover:bg-[#FAF9F6]/50 hover:border-2 hover:border-[#D4A373]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#BDBDBD] mb-4">
                    Password
                  </label>
                  <div className="relative group/field">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#BDBDBD] group-focus-within/field:text-[#D4A373] transition-colors" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full pl-14 pr-6 py-5 rounded-3xl bg-[#FAF9F6] border-2 border-transparent focus:border-[#D4A373] focus:bg-white focus:ring-8 focus:ring-[#D4A373]/5 outline-none transition-all placeholder:text-[#BDBDBD] text-base font-bold tracking-tight hover:bg-[#FAF9F6]/50 hover:border-2 hover:border-[#D4A373]/20"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
                    {error}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{
                    backgroundColor: loading ? undefined : "#3D4D43",
                    y: loading ? 0 : -1,
                  }}
                  whileTap={{
                    scale: loading ? 1 : 0.98,
                    backgroundColor: loading ? undefined : "#29332d",
                  }}
                  className="w-full bg-[#404F46] text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-[#4D5D53]/20 transition-all flex items-center justify-center gap-3 group relative overflow-hidden text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  <span className="relative z-10">
                    {loading ? "Logging in..." : "Enter the Hub"}
                  </span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </motion.button>
              </form>
            </>
          )}

          {/* REGISTER VIEW */}
          {formView === "register" && (
            <>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#4D5D53] mb-2 uppercase tracking-tight">
                  Create Account
                </h3>
                <p className="text-[#9A9A9A] text-sm">
                  Fill in your details to get started.
                </p>
              </div>

              <form className="space-y-4 h-[stretch]" onSubmit={handleRegister}>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#BDBDBD] mb-3">
                    Full Name
                  </label>
                  <div className="relative group/field">
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={registerFullName}
                      onChange={(e) => setRegisterFullName(e.target.value)}
                      required
                      className="w-full px-6 py-4 rounded-3xl bg-[#FAF9F6] border-2 border-transparent focus:border-[#D4A373] focus:bg-white focus:ring-8 focus:ring-[#D4A373]/5 outline-none transition-all placeholder:text-[#BDBDBD] text-base font-bold tracking-tight hover:bg-[#FAF9F6]/50 hover:border-2 hover:border-[#D4A373]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#BDBDBD] mb-3">
                    Email Address
                  </label>
                  <div className="relative group/field">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#BDBDBD] group-focus-within/field:text-[#D4A373] transition-colors" />
                    <input
                      type="email"
                      placeholder="name@hostel.edu"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      className="w-full pl-14 pr-6 py-4 rounded-3xl bg-[#FAF9F6] border-2 border-transparent focus:border-[#D4A373] focus:bg-white focus:ring-8 focus:ring-[#D4A373]/5 outline-none transition-all placeholder:text-[#BDBDBD] text-base font-bold tracking-tight hover:bg-[#FAF9F6]/50 hover:border-2 hover:border-[#D4A373]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#BDBDBD] mb-3">
                    Student ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 21-0001"
                    value={registerStudentId}
                    onChange={(e) => setRegisterStudentId(e.target.value)}
                    required
                    className="w-full px-6 py-4 rounded-3xl bg-[#FAF9F6] border-2 border-transparent focus:border-[#D4A373] focus:bg-white focus:ring-8 focus:ring-[#D4A373]/5 outline-none transition-all placeholder:text-[#BDBDBD] text-base font-bold tracking-tight hover:bg-[#FAF9F6]/50 hover:border-2 hover:border-[#D4A373]/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#BDBDBD] mb-3">
                    Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., A-101"
                    value={registerRoomNumber}
                    onChange={(e) => setRegisterRoomNumber(e.target.value)}
                    required
                    className="w-full px-6 py-4 rounded-3xl bg-[#FAF9F6] border-2 border-transparent focus:border-[#D4A373] focus:bg-white focus:ring-8 focus:ring-[#D4A373]/5 outline-none transition-all placeholder:text-[#BDBDBD] text-base font-bold tracking-tight hover:bg-[#FAF9F6]/50 hover:border-2 hover:border-[#D4A373]/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#BDBDBD] mb-3">
                    Password
                  </label>
                  <div className="relative group/field">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#BDBDBD] group-focus-within/field:text-[#D4A373] transition-colors" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      className="w-full pl-14 pr-6 py-4 rounded-3xl bg-[#FAF9F6] border-2 border-transparent focus:border-[#D4A373] focus:bg-white focus:ring-8 focus:ring-[#D4A373]/5 outline-none transition-all placeholder:text-[#BDBDBD] text-base font-bold tracking-tight hover:bg-[#FAF9F6]/50 hover:border-2 hover:border-[#D4A373]/20"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
                    {error}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{
                    backgroundColor: loading ? undefined : "#3D4D43",
                    y: loading ? 0 : -1,
                  }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full bg-[#404F46] text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-[#4D5D53]/20 transition-all flex items-center justify-center gap-3 group relative overflow-hidden text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  <span className="relative z-10">
                    {loading ? "Creating..." : "Create Account"}
                  </span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </motion.button>
              </form>
            </>
          )}

          {/* REGISTER OTP VIEW */}
          {formView === "register-otp" && (
            <>
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-[#4D5D53] mb-2 uppercase tracking-tight">
                  Verify OTP
                </h3>
                <p className="text-[#9A9A9A] text-sm">
                  Enter the 6-digit code to verify your email.
                </p>
              </div>

              <form className="space-y-8" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#BDBDBD] mb-4">
                    Verification Code
                  </label>
                  <div className="flex gap-3">
                    {registerOtp.map((digit, i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength={1}
                        inputMode="numeric"
                        value={digit}
                        onChange={(e) => {
                          const newOtp = [...registerOtp];
                          newOtp[i] = e.target.value.replace(/\D/g, "");
                          setRegisterOtp(newOtp);

                          // Auto-focus next field
                          if (e.target.value && i < 5) {
                            (
                              document.querySelectorAll('input[maxLength="1"]')[
                                i + 1
                              ] as HTMLInputElement
                            )?.focus();
                          }
                        }}
                        placeholder="•"
                        className={`flex-1 w-2 h-16 bg-[#FAF9F6] rounded-2xl text-center font-black text-2xl outline-none border-2 transition-all hover:bg-[#FAF9F6]/50 ${digit ? "border-[#D4A373] bg-white shadow-lg shadow-[#D4A373]/10" : "border-transparent focus:border-[#D4A373] focus:ring-8 focus:ring-[#D4A373]/5"}`}
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
                    {error}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading || registerOtp.join("").length !== 6}
                  whileHover={{
                    backgroundColor:
                      loading || registerOtp.join("").length !== 6
                        ? undefined
                        : "#3D4D43",
                    y: loading || registerOtp.join("").length !== 6 ? 0 : -1,
                  }}
                  whileTap={{
                    scale:
                      loading || registerOtp.join("").length !== 6 ? 1 : 0.98,
                  }}
                  className="w-full bg-[#404F46] text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-[#4D5D53]/20 transition-all flex items-center justify-center gap-3 group relative overflow-hidden text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  <span className="relative z-10">
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </motion.button>

                <button
                  type="button"
                  onClick={() => setFormView("register")}
                  className="w-full text-[#D4A373] font-semibold text-sm hover:underline underline-offset-4 transition-all"
                >
                  ← Back to Registration
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
