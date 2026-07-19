import { useState } from "react";
import { Bell, Loader2, Users } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { notificationsAdminApi } from "@/lib/api";
import toast from "react-hot-toast";

const ROLE_OPTIONS = [
  { value: "ALL",    label: "All Users" },
  { value: "BUYER",  label: "Buyers only" },
  { value: "SELLER", label: "Sellers only" },
  { value: "AGENT",  label: "Agents only" },
];

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("INFO");
  const [targetRole, setTargetRole] = useState("ALL");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSending(true);
    setLastResult(null);
    try {
      const res = await notificationsAdminApi.send({
        title: title.trim(),
        body: message.trim(),
        type,
        targetRole: targetRole === "ALL" ? undefined : targetRole,
      });
      const sentMsg = res.data?.message || "Notification sent";
      toast.success(sentMsg);
      setLastResult(sentMsg);
      setTitle("");
      setMessage("");
    } catch {
      toast.error("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <AdminHeader title="Notifications" subtitle="Send platform-wide notifications" />
      <div className="max-w-xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-kunda-50">
              <Bell className="w-5 h-5 text-kunda-700" />
            </div>
            <h2 className="font-semibold text-gray-900">Send Broadcast Notification</h2>
          </div>

          <div className="space-y-4">
            {/* Recipients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Send to
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                      targetRole === opt.value
                        ? "border-kunda-700 bg-kunda-50 text-kunda-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetRole"
                      value={opt.value}
                      checked={targetRole === opt.value}
                      onChange={() => setTargetRole(opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
                <option value="INFO">Info</option>
                <option value="SUCCESS">Success</option>
                <option value="WARNING">Warning</option>
                <option value="ANNOUNCEMENT">Announcement</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g. New listings in Banjul…"
                maxLength={100}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/100</p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-field resize-none"
                rows={4}
                placeholder="Notification message…"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/500</p>
            </div>

            {lastResult && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                ✓ {lastResult}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              {sending ? "Sending…" : `Send to ${ROLE_OPTIONS.find((o) => o.value === targetRole)?.label}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
