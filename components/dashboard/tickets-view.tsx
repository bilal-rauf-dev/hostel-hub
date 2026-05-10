"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { maintenanceApi } from "@/lib/api";
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

function CreateTicketForm({
  onDone,
  onCancel,
}: {
  onDone: (success: boolean) => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Electrical");
  const [room, setRoom] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setSaving(true);
      setErr(null);
      const res = await maintenanceApi.createTicket(
        description,
        category,
        room,
      );
      if (res.data?.success) {
        onDone(true);
      } else {
        setErr(res.data?.message || "Failed");
        onDone(false);
      }
    } catch (e: any) {
      setErr(e?.message || "Network error");
      onDone(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-black mb-2 block">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your issue"
          className="w-full p-3 rounded-lg border h-24"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-black mb-2 block">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 rounded-lg border"
          >
            <option>Electrical</option>
            <option>Plumbing</option>
            <option>HVAC</option>
            <option>Furniture</option>
            <option>Internet</option>
            <option>Cleaning</option>
            <option>Security</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-black mb-2 block">Room Number</label>
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="e.g. A-101"
            className="w-full p-3 rounded-lg border"
            required
          />
        </div>
      </div>
      {err && <div className="text-red-500 text-sm">{err}</div>}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-[#4D5D53] text-white rounded-xl"
        >
          {saving ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}

interface Props { onToast: (msg: string, type: 'success' | 'error' | 'info') => void }

export function TicketsView({ onToast }: Props) {
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  
  
  const loadTickets = async () => {
    try {
      const res = await maintenanceApi.getTickets();
      if (res.data?.success) setTickets(res.data.data || []);
      else setError(res.data?.message || "Failed to load tickets");
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const activeCount = tickets.filter(
    (t) => t.status && t.status !== "resolved" && t.status !== "closed",
  ).length;
  const resolvedCount = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed",
  ).length;
  const waitingCount = tickets.filter((t) => t.status === "submitted").length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight">
          Support Tickets
        </h3>
        <motion.button
          whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCreating(true)}
          className="px-8 py-4 bg-[#4D5D53] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-[#4D5D53]/20 transition-all border-b-4 border-black/20"
        >
          <Plus className="h-4 w-4" />
          New Request
        </motion.button>
      </div>

      
      {/* Create Ticket Modal */}
      {creating &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="modal-overlay"
              className="fixed inset-0 z-[9999] flex items-center justify-center"
            >
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setCreating(false)}
              />
              <motion.div
                key="modal-content"
                initial={{
                  opacity: 0,
                  y: 20,
                  scale: 0.95,
                  filter: "blur(10px)",
                }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white p-6 rounded-2xl w-full max-w-lg mx-4 shadow-2xl z-10"
              >
                <h4 className="text-lg font-black mb-4">
                  Create Support Ticket
                </h4>
                <CreateTicketForm
                  onDone={async (success) => {
                    if (success) {
                      onToast("Ticket created successfully", "success");
                      setCreating(false);
                      await loadTickets();
                    } else {
                      onToast("Failed to create ticket", "error");
                    }
                  }}
                  onCancel={() => setCreating(false)}
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}

      {/* Ticket List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-6">Loading tickets...</div>
        ) : error ? (
          <div className="p-6 text-red-500">Error: {error}</div>
        ) : tickets.length === 0 ? (
          <div className="p-6 text-sm text-[#9A9A9A]">No tickets yet.</div>
        ) : (
          tickets.map((ticket, idx) => (
            <motion.div
              key={ticket.ticket_id || idx}
              initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{
                delay: idx * 0.1,
                duration: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{
                backgroundColor: "#FAF9F6",
                borderColor: "#D4A373",
              }}
              onClick={() => setSelectedTicket(ticket)}
              className="bg-white p-6 rounded-3xl border border-[#F0F0EE] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group cursor-pointer transition-all duration-300"
            >
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl text-white bg-[#4D5D53] transition-all duration-500 group-hover:rotate-6">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">
                    #{ticket.ticket_id}
                  </span>
                  <h4 className="text-lg font-black text-[#4D5D53] mt-1 group-hover:text-[#D4A373] transition-colors">
                    {ticket.category}
                  </h4>
                  <p className="text-[11px] text-[#9A9A9A] font-bold uppercase tracking-wide">
                    {ticket.room_number} •{" "}
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-[#79837C] mt-1 line-clamp-1">
                    {ticket.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ticket.status === "in_progress"
                          ? "bg-blue-500 animate-pulse"
                          : ticket.status === "resolved" ||
                              ticket.status === "closed"
                            ? "bg-emerald-500"
                            : "bg-orange-500"
                      }`}
                    />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#4D5D53]">
                      {ticket.status}
                    </p>
                  </div>
                  <p className="text-[10px] text-[#9A9A9A] font-bold">
                    Updated{" "}
                    {ticket.updated_at
                      ? new Date(ticket.updated_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#F0F0EE] flex items-center justify-center transition-all group-hover:bg-[#4D5D53] group-hover:text-white group-hover:scale-110">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Ticket Detail Modal — outside the map */}
      {selectedTicket &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="ticket-modal-overlay"
              className="fixed inset-0 z-[9999] flex items-center justify-center"
            >
              <motion.div
                key="ticket-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelectedTicket(null)}
              />
              <motion.div
                key="ticket-modal-content"
                initial={{
                  opacity: 0,
                  y: 20,
                  scale: 0.95,
                  filter: "blur(10px)",
                }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white p-8 rounded-2xl w-full max-w-lg mx-4 shadow-2xl z-10"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-2xl text-white bg-[#4D5D53]">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">
                      Ticket #{selectedTicket.ticket_id}
                    </span>
                    <h4 className="text-xl font-black text-[#4D5D53]">
                      {selectedTicket.category}
                    </h4>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-[#F0F0EE]">
                    <span className="text-sm text-[#9A9A9A]">Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        selectedTicket.status === "resolved" ||
                        selectedTicket.status === "closed"
                          ? "bg-emerald-50 text-emerald-600"
                          : selectedTicket.status === "in_progress"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#F0F0EE]">
                    <span className="text-sm text-[#9A9A9A]">Room</span>
                    <span className="font-bold text-[#4D5D53]">
                      {selectedTicket.room_number}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#F0F0EE]">
                    <span className="text-sm text-[#9A9A9A]">Submitted</span>
                    <span className="font-bold text-[#4D5D53]">
                      {new Date(selectedTicket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#F0F0EE]">
                    <span className="text-sm text-[#9A9A9A]">Last Updated</span>
                    <span className="font-bold text-[#4D5D53]">
                      {selectedTicket.updated_at
                        ? new Date(
                            selectedTicket.updated_at,
                          ).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="py-3">
                    <span className="text-sm text-[#9A9A9A] block mb-2">
                      Description
                    </span>
                    <p className="text-sm text-[#4D5D53] font-medium leading-relaxed">
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "#3D4D43" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedTicket(null)}
                    className="px-4 py-2 bg-[#4D5D53] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#4D5D53]/20"
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        {[
          {
            label: "Active",
            value: activeCount,
            icon: Clock,
            color: "text-blue-500",
          },
          {
            label: "Resolved",
            value: resolvedCount,
            icon: CheckCircle2,
            color: "text-emerald-500",
          },
          {
            label: "Waiting",
            value: waitingCount,
            icon: MessageSquare,
            color: "text-orange-500",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-[#FAF9F6] p-6 rounded-3xl border border-[#F0F0EE] flex flex-col items-center text-center"
          >
            <stat.icon className={`h-6 w-6 ${stat.color} mb-3`} />
            <h5 className="text-2xl font-black text-[#4D5D53]">{stat.value}</h5>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
