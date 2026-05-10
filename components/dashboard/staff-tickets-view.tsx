"use client";

import { motion } from "motion/react";
import {
  Wrench,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Trash2,
  Inbox,
  RefreshCw
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { maintenanceApi, usersApi } from "@/lib/api";

interface Props { onToast: (msg: string, type: 'success' | 'error' | 'info') => void }

export function StaffTicketsView({ onToast }: Props) {
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [assignMenuId, setAssignMenuId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await maintenanceApi.getAllTickets();
      if (res.data?.success) setTickets(res.data.data || []);
      else setError(res.data?.message || "Failed to load");

      const usersRes = await usersApi.getAllUsers();
      if (usersRes.data?.success) {
        setAdminUsers(
          (usersRes.data.data || []).filter((u: any) => u.role === "admin"),
        );
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu]")) {
        setOpenMenuId(null);
        setAssignMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (ticket_id: number, status: string) => {
    try {
      const res = await maintenanceApi.updateTicketStatus(ticket_id, status);
      if (res.data?.success) {
        setTickets((prev) =>
          prev.map((t) => (t.ticket_id === ticket_id ? { ...t, status } : t)),
        );
      } else {
        onToast(res.data?.message || "Failed to update status", "error");
      }
    } catch (e) {
      console.error(e);
      onToast("Network error", "error");
    }
  };

  const assignTo = async (ticket_id: number, assigned_to: number) => {
    try {
      await maintenanceApi.assignTicket(ticket_id, assigned_to);
      setTickets((prev) =>
        prev.map((t) =>
          t.ticket_id === ticket_id ? { ...t, assigned_to } : t,
        ),
      );
    } catch (e) {
      console.error(e);
      onToast("Network error", "error");
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = 
      (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (t.category?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (t.room_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (t.student_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "All") return true;
    const map: Record<string, string> = {
      Pending: "submitted",
      "In Progress": "in_progress",
      Resolved: "resolved",
      Closed: "closed",
    };
    return t.status === map[filter];
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-[#4D5D53] tracking-tighter">
            Support Tickets
          </h3>
          <p className="text-sm text-[#9A9A9A] font-medium mt-1">
            Manage and resolve resident maintenance requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleRefresh}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={refreshing}
            className="p-2.5 bg-white border border-[#F0F0EE] rounded-xl text-[#79837C] hover:bg-[#FAF9F6] transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#BDBDBD]" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-[#F0F0EE] rounded-xl text-xs focus:border-[#D4A373] outline-none w-64 shadow-sm"
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 bg-white border border-[#F0F0EE] rounded-xl text-[#79837C] hover:bg-[#FAF9F6] transition-all"
          >
            <Filter className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#F0F0EE] pb-2 overflow-x-auto custom-scrollbar">
        {["All", "Pending", "In Progress", "Resolved", "Closed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${filter === tab ? "text-[#4D5D53]" : "text-[#BDBDBD] hover:text-[#79837C]"}`}
          >
            {tab}
            {filter === tab && (
              <motion.div
                layoutId="staff-ticket-tab"
                className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-[#D4A373]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-6 text-sm text-[#9A9A9A] text-center py-20">Loading tickets...</div>
        ) : error ? (
          <div className="p-6 text-red-500 text-center py-20">Error: {error}</div>
        ) : filteredTickets.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 space-y-4 bg-white border border-[#F0F0EE] rounded-[3rem] shadow-sm"
          >
             <div className="w-24 h-24 bg-[#FAF9F6] rounded-full flex items-center justify-center text-[#D4A373]">
                <Inbox className="h-10 w-10 opacity-50" />
             </div>
             <p className="text-lg font-black text-[#4D5D53] tracking-tighter">No tickets found</p>
             <p className="text-sm text-[#9A9A9A]">Try adjusting your search or filters.</p>
          </motion.div>
        ) : (
          filteredTickets.map((ticket, idx) => (
              <motion.div
                key={ticket.ticket_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white p-6 rounded-[2rem] border border-[#F0F0EE] shadow-sm hover:shadow-xl hover:shadow-[#4D5D53]/5 transition-all flex flex-col md:flex-row md:items-center gap-6"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    ticket.priority === "High"
                      ? "bg-red-50 text-red-500"
                      : ticket.priority === "Medium"
                        ? "bg-orange-50 text-orange-500"
                        : "bg-blue-50 text-blue-500"
                  }`}
                >
                  <Wrench className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">
                      Ticket #{ticket.ticket_id}
                    </span>
                    <span className="text-[10px] font-black text-[#BDBDBD] uppercase tracking-widest">
                      • {ticket.category}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-[#4D5D53] truncate">
                    {ticket.description}
                  </h4>
                  <p className="text-xs text-[#9A9A9A] font-bold mt-1">
                    Requested by {ticket.student_name} in{" "}
                    {ticket.room_number}
                  </p>
                </div>

                <div className="flex items-center gap-8 md:px-8 border-l border-r border-[#F0F0EE]/50 h-12">
                  <div>
                    <p className="text-[8px] font-black text-[#BDBDBD] uppercase tracking-widest mb-1">
                      Priority
                    </p>
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                        ticket.priority === "High"
                          ? "bg-red-100 text-red-600"
                          : ticket.priority === "Medium"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-[#BDBDBD] uppercase tracking-widest mb-1">
                      Created
                    </p>
                    <span className="text-xs font-black text-[#4D5D53]">
                      {new Date(ticket.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 min-w-[200px]">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                      ticket.status === "submitted"
                        ? "bg-orange-50 border-orange-100 text-orange-600"
                        : ticket.status === "in_progress"
                          ? "bg-blue-50 border-blue-100 text-blue-600"
                          : "bg-emerald-50 border-emerald-100 text-emerald-600"
                    }`}
                  >
                    {ticket.status === "submitted" ? (
                      <Clock className="h-3 w-3" />
                    ) : ticket.status === "in_progress" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {ticket.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const nextMap: Record<string, string> = {
                          submitted: "assigned",
                          assigned: "in_progress",
                          in_progress: "resolved",
                          resolved: "closed",
                        };
                        const next = nextMap[ticket.status];
                        if (next)
                          updateStatus(ticket.ticket_id, next);
                      }}
                      className="p-3 text-[#BDBDBD] hover:text-[#D4A373] hover:bg-[#FEFAE0] rounded-xl transition-all disabled:opacity-50"
                      disabled={ticket.status === "closed"}
                      title="Advance Status"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </motion.button>
                    <div
                      className="relative"
                      data-menu
                      onClick={(e) => e.stopPropagation()}
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setOpenMenuId(
                            openMenuId === ticket.ticket_id
                              ? null
                              : ticket.ticket_id,
                          );
                          setAssignMenuId(null);
                        }}
                        className="p-3 text-[#BDBDBD] hover:text-[#4D5D53] hover:bg-[#FAF9F6] rounded-xl transition-all"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </motion.button>

                      {openMenuId === ticket.ticket_id && (
                        <div className="absolute right-0 top-12 z-50 bg-white border border-[#F0F0EE] rounded-2xl shadow-xl overflow-hidden w-44">
                          <button
                            onClick={() => {
                              setAssignMenuId(ticket.ticket_id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-[#4D5D53] hover:bg-[#FAF9F6] transition-colors flex items-center gap-2"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{" "}
                            Assign To
                          </button>
                          <button
                            onClick={async () => {
                              setOpenMenuId(null);
                              try {
                                const res = await maintenanceApi.deleteTicket(
                                  ticket.ticket_id,
                                );
                                if (res.data?.success) {
                                  setTickets((prev) =>
                                    prev.filter(
                                      (t) => t.ticket_id !== ticket.ticket_id,
                                    ),
                                  );
                                  onToast("Ticket deleted", "success");
                                } else {
                                  onToast(
                                    res.data?.message || "Failed to delete",
                                    "error",
                                  );
                                }
                              } catch (e: any) {
                                onToast(
                                  e?.message || "Network error",
                                  "error",
                                );
                              }
                            }}
                            className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}

                      {assignMenuId === ticket.ticket_id &&
                        createPortal(
                          <div
                            className="fixed inset-0 z-[9999] flex items-center justify-center"
                            onClick={() => setAssignMenuId(null)}
                          >
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                            <div
                              className="relative bg-white rounded-3xl p-6 w-full max-w-sm mx-4 shadow-2xl z-10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <h4 className="text-sm font-black text-[#4D5D53] uppercase tracking-widest mb-4">
                                Assign Ticket #{ticket.ticket_id}
                              </h4>
                              {adminUsers.length === 0 ? (
                                <p className="text-sm text-[#9A9A9A]">
                                  No admin users found.
                                </p>
                              ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                  {adminUsers.map((admin: any) => (
                                    <button
                                      key={admin.user_id}
                                      onClick={async () => {
                                        await assignTo(
                                          ticket.ticket_id,
                                          admin.user_id,
                                        );
                                        setAssignMenuId(null);
                                        onToast(
                                          `Assigned to ${admin.display_name}`,
                                          "success",
                                        );
                                      }}
                                      className="w-full flex items-center gap-3 p-3 bg-[#FAF9F6] hover:bg-[#E9EDC9] rounded-xl transition-colors text-left"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-[#4D5D53] flex items-center justify-center text-white text-[10px] font-black">
                                        {admin.display_name
                                          ?.substring(0, 2)
                                          .toUpperCase() ?? "AD"}
                                      </div>
                                      <div>
                                        <p className="text-xs font-black text-[#4D5D53]">
                                          {admin.display_name}
                                        </p>
                                        <p className="text-[10px] text-[#9A9A9A]">
                                          {admin.email}
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={() => setAssignMenuId(null)}
                                className="w-full mt-4 py-2.5 border border-[#F0F0EE] rounded-xl text-xs font-black uppercase tracking-widest text-[#9A9A9A] hover:bg-[#FAF9F6] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>,
                          document.body,
                        )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
        )}
      </div>
    </motion.div>
  );
}
