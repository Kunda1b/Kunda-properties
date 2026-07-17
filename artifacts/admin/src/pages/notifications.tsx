import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { notificationsAdminApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("INFO");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title || !message) { toast.error("Title and message are required"); return; }
    setSending(true);
    try {
      await notificationsAdminApi.send({ title, message, type });
      toast.success("Notification sent");
      setTitle(""); setMessage("");
    } catch { toast.error("Failed to send notification"); }
    finally { setSending(false); }
  };

  return (
    <div>
      <AdminHeader title="Notifications" subtitle="Send platform-wide notifications" />
      <div className="max-w-xl">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-kunda-50">
              <Bell className="w-5 h-5 text-kunda-700" />
            </div>
            <h2 className="font-semibold text-gray-900">Send Broadcast Notification</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
                <option value="INFO">Info</option>
                <option value="SUCCESS">Success</option>
                <option value="WARNING">Warning</option>
                <option value="ANNOUNCEMENT">Announcement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Notification title..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input-field" rows={4} placeholder="Notification message..." />
            </div>
            <button onClick={handleSend} disabled={sending} className="btn-primary flex items-center gap-2">
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              Send to All Users
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
