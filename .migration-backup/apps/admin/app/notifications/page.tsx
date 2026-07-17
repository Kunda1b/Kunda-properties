"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, Bell, Users, UserCheck, User } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { cn } from "@/lib/utils";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Users", icon: Users },
  { value: "buyers", label: "Buyers Only", icon: User },
  { value: "sellers", label: "Sellers & Agents", icon: UserCheck },
];
const CHANNEL_OPTIONS = [
  { value: "IN_APP", label: "In-App", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "EMAIL", label: "Email", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "SMS", label: "SMS", color: "bg-orange-50 text-orange-700 border-orange-200" },
];

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [channels, setChannels] = useState<string[]>(["IN_APP"]);

  const broadcast = useMutation({
    mutationFn: () => adminApi.broadcast({ title, body, audience, channels }),
    onSuccess: (res) => { toast.success(`Sent to ${res.data.data?.recipientCount || 0} users`); setTitle(""); setBody(""); },
    onError: () => toast.error("Broadcast failed"),
  });

  const toggleChannel = (ch: string) => setChannels((p) => p.includes(ch) ? p.filter((c) => c !== ch) : [...p, ch]);
  const canSend = title.trim() && body.trim() && channels.length > 0;

  return (
    <div>
      <AdminHeader title="Notifications" subtitle="Broadcast messages to platform users" />
      <div className="p-6 max-w-2xl space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">Compose Message</h3>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className="input-field"/></div>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Message</label><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={500} className="input-field resize-none"/></div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Audience</label>
            <div className="grid grid-cols-3 gap-2">
              {AUDIENCE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={() => setAudience(value)} className={cn("flex flex-col items-start p-3 rounded-lg border-2 text-left", audience===value ? "border-kunda-700 bg-kunda-50" : "border-gray-200")}>
                  <Icon className={cn("w-4 h-4 mb-1.5", audience===value ? "text-kunda-700" : "text-gray-400")}/>
                  <p className={cn("text-xs font-semibold", audience===value ? "text-kunda-700" : "text-gray-700")}>{label}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Channels</label>
            <div className="flex flex-wrap gap-2">{CHANNEL_OPTIONS.map(({ value, label, color }) => <button key={value} onClick={() => toggleChannel(value)} className={cn("px-3 py-1.5 rounded-lg border text-xs font-semibold", channels.includes(value) ? color : "bg-white border-gray-200 text-gray-400")}>{label}</button>)}</div>
          </div>
          <button onClick={() => broadcast.mutate()} disabled={!canSend || broadcast.isPending} className="btn-primary w-full flex items-center justify-center gap-2"><Send className="w-4 h-4"/> {broadcast.isPending ? "Sending…" : "Send Broadcast"}</button>
        </div>
      </div>
    </div>
  );
}
