"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { guidebookApi } from "@/lib/api";
import {
  BookOpen,
  Wifi,
  Trash2,
  Zap,
  MapPin,
  ChefHat,
  Search,
  ChevronRight,
  ShieldCheck,
  PhoneCall,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";

export function GuidebookView() {
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await guidebookApi.getEntries();
        if (!mounted) return;
        if (res.data?.success) setEntries(res.data.data || []);
        else setError(res.data?.message || "Failed to load guidebook");
      } catch (e: any) {
        setError(e?.message || "Network error");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="relative overflow-hidden bg-[#4D5D53] rounded-[2.5rem] p-10 text-white shadow-xl shadow-[#4D5D53]/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-md">
            <h3 className="text-3xl font-black tracking-tight mb-4">
              Resident Guidebook
            </h3>
            <p className="text-emerald-50/70 text-sm leading-relaxed">
              Everything you need to know about living at the Hub. From
              technical setups to community rules, we&apos;ve got you covered.
            </p>
          </div>
        </div>
        <BookOpen className="absolute -right-10 -bottom-10 h-64 w-64 text-white/5 rotate-12" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(entries || []).map((guide, idx) => (
          <motion.div
            key={guide.entry_id || idx}
            onClick={() => setSelectedGuide(guide)}
            initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ backgroundColor: "#FAF9F6", borderColor: "#D4A373" }}
            className="bg-white p-8 rounded-[3rem] border border-[#F0F0EE] shadow-sm hover:shadow-xl hover:shadow-[#D4A373]/20 transition-all duration-250 group cursor-pointer"
          >
            <div
              className={`w-16 h-16 rounded-[1.5rem] bg-blue-50 text-blue-500 flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm`}
            >
              <Wifi className="h-8 w-8" />
            </div>
            <h4 className="text-2xl font-black text-[#4D5D53] tracking-tighter mb-4 group-hover:text-[#D4A373] transition-colors leading-tight">
              {guide.title}
            </h4>
            <p className="text-sm font-medium text-[#79837C] leading-relaxed mb-8 tracking-tight">
              {guide.content || guide.desc || guide.description}
            </p>
            <div className="flex items-center text-[10px] font-black uppercase tracking-[0.25em] text-[#D4A373] group-hover:pl-2 transition-all">
              Comprehensive Guide <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </motion.div>
        ))}
      </div>

      {selectedGuide &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="guide-modal-overlay"
              className="fixed inset-0 z-[9999] flex items-center justify-center"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#4D5D53]/40 backdrop-blur-md"
                onClick={() => setSelectedGuide(null)}
              />
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  y: 20,
                  filter: "blur(10px)",
                }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, y: 20, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white rounded-[3rem] border border-[#F0F0EE] p-10 w-full max-w-lg mx-4 shadow-2xl z-10 max-h-[80vh] overflow-y-auto"
              >
                <button
                  onClick={() => setSelectedGuide(null)}
                  className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF9F6] text-[#9A9A9A] hover:bg-[#F0F0EE] hover:text-[#4D5D53] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="w-14 h-14 rounded-[1.5rem] bg-blue-50 text-blue-500 flex items-center justify-center mb-6 shadow-sm">
                  <Wifi className="h-7 w-7" />
                </div>

                <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">
                  {selectedGuide.category}
                </span>
                <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight mt-1 mb-2 leading-tight">
                  {selectedGuide.title}
                </h3>
                <p className="text-[10px] text-[#BDBDBD] font-bold uppercase tracking-widest mb-6">
                  {selectedGuide.created_at
                    ? new Date(selectedGuide.created_at).toLocaleDateString()
                    : ""}
                </p>

                <div className="text-sm text-[#4D5D53] bg-[#FAF9F6] p-6 rounded-2xl leading-relaxed whitespace-pre-wrap">
                  {selectedGuide.content || "No content available."}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </motion.div>
  );
}
