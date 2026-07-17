import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { viewingsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";
import { formatRelativeTime } from "@/lib/utils";
import { Calendar, CheckCircle, XCircle, Clock, Loader2, Video, MapPin } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  RESCHEDULED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function ViewingsPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: requests, isLoading, isError } = useQuery({
    queryKey: ["viewings"],
    queryFn: () => viewingsApi.getAll().then((r) => r.data.data),
    retry: 1,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      viewingsApi.respond(id, { status }),
    onSuccess: () => {
      toast.success("Viewing request updated");
      qc.invalidateQueries({ queryKey: ["viewings"] });
    },
    onError: () => toast.error("Failed to update"),
  });

  const list = requests || [];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Viewing Requests</h1>

      {isError && (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Failed to load viewing requests</p>
          <p className="text-xs text-gray-400 mt-2">Please try again later</p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      )}

      {!isLoading && !isError && list.length === 0 && (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No viewing requests</p>
        </div>
      )}

      <div className="space-y-3">
        {list.map((req: any) => {
          const isSeller = req.sellerId === user?.id;
          const isPending = req.status === "PENDING";

          return (
            <div key={req.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">{req.listing?.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isSeller ? `${req.buyer?.profile?.firstName} ${req.buyer?.profile?.lastName}` : "You"} requested
                  </p>
                </div>
                <span className={`badge text-xs ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-600"}`}>
                  {req.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  {req.type === "VIRTUAL" ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                  {req.type === "VIRTUAL" ? "Virtual Tour" : "In Person"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(req.preferredDate).toLocaleDateString()}
                </span>
                {req.preferredTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {req.preferredTime}
                  </span>
                )}
              </div>

              {req.message && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">{req.message}</p>
              )}

              {isSeller && isPending && (
                <div className="flex gap-2">
                  <button
                    onClick={() => respondMutation.mutate({ id: req.id, status: "APPROVED" })}
                    disabled={respondMutation.isPending}
                    className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => respondMutation.mutate({ id: req.id, status: "DECLINED" })}
                    disabled={respondMutation.isPending}
                    className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              )}

              {req.meetingLink && (
                <a href={req.meetingLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-kunda-600 hover:text-kunda-700 mt-2">
                  <Video className="w-3.5 h-3.5" /> Join Meeting
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
