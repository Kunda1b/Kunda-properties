import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { documentsAdminApi } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

export default function DocumentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: () => documentsAdminApi.getAll().then((r) => r.data.data),
    retry: 1,
  });

  const documents = data?.documents || data || [];

  return (
    <div>
      <AdminHeader title="Documents" subtitle="Review and verify uploaded documents" />
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading && <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>}
        {!isLoading && documents.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No documents uploaded yet</p>
          </div>
        )}
        <div className="divide-y divide-gray-100">
          {documents.map((doc: any) => (
            <div key={doc.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{doc.name || doc.filename}</p>
                <p className="text-xs text-gray-500">{doc.type} · {doc.createdAt ? formatRelativeTime(doc.createdAt) : ""}</p>
              </div>
              <span className={`badge ${doc.verified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {doc.verified ? "Verified" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
