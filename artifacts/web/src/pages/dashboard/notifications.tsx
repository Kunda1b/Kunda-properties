import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { notificationsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getAll({ limit: 50 }).then((r) => r.data.data),
    retry: 1,
  });

  const markReadMutation = useMutation({
    mutationFn: (ids: string[] | "all") => notificationsApi.markRead(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["notif-count"] }); },
    onError: () => toast.error("Failed to mark as read"),
  });

  const notifications = data?.notifications || [];
  const unread = notifications.filter((n: any) => n.status === "SENT");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Notifications</h1>
        {unread.length > 0 && (
          <button
            onClick={() => markReadMutation.mutate("all")}
            disabled={markReadMutation.isPending}
            className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            {markReadMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
            Mark all read
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}</div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold text-gray-900 mb-2">All caught up</h3>
          <p className="text-gray-500 text-sm">You have no notifications yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n: any) => {
          const isUnread = n.status === "SENT";
          return (
            <div
              key={n.id}
              onClick={() => isUnread && markReadMutation.mutate([n.id])}
              className={cn(
                "bg-white rounded-xl border p-4 cursor-pointer transition-colors",
                isUnread ? "border-kunda-200 bg-kunda-50/30 hover:bg-kunda-50/60" : "border-gray-100 hover:bg-gray-50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", isUnread ? "bg-kunda-600" : "bg-gray-300")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", isUnread ? "text-gray-900" : "text-gray-600")}>{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
