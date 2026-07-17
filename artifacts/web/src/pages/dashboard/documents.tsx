import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Trash2, ExternalLink, Loader2, X } from "lucide-react";
import { documentsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const DOC_TYPES = [
  { value: "TITLE_DEED", label: "Title Deed" },
  { value: "SURVEY_PLAN", label: "Survey Plan" },
  { value: "BUILDING_PERMIT", label: "Building Permit" },
  { value: "PURCHASE_AGREEMENT", label: "Purchase Agreement" },
  { value: "POWER_OF_ATTORNEY", label: "Power of Attorney" },
  { value: "IDENTITY_DOCUMENT", label: "Identity Document" },
  { value: "PROOF_OF_FUNDS", label: "Proof of Funds" },
  { value: "INSPECTION_REPORT", label: "Inspection Report" },
  { value: "TAX_CLEARANCE", label: "Tax Clearance" },
  { value: "OTHER", label: "Other" },
];

const STATUS_COLOR: Record<string, string> = {
  UPLOADED: "bg-blue-100 text-blue-700",
  VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-gray-100 text-gray-600",
};

function UploadModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ type: "OTHER", title: "", fileUrl: "" });

  const uploadMutation = useMutation({
    mutationFn: () => documentsApi.upload(form),
    onSuccess: () => {
      toast.success("Document uploaded");
      qc.invalidateQueries({ queryKey: ["my-documents"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Upload failed"),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-display text-lg font-bold text-gray-900">Upload Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input className="input-field" placeholder="e.g. Title Deed — Plot 47 Brusubi" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File URL</label>
            <input className="input-field" placeholder="https://…" type="url" value={form.fileUrl}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
            <p className="text-xs text-gray-400 mt-1">Upload your file to Google Drive, Dropbox, or similar, then paste the shareable link here.</p>
          </div>
          <button
            onClick={() => uploadMutation.mutate()}
            disabled={!form.title || !form.fileUrl || uploadMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {uploadMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Upload Document
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-documents"],
    queryFn: () => documentsApi.getAll().then((r) => r.data.data),
    retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => { toast.success("Document deleted"); qc.invalidateQueries({ queryKey: ["my-documents"] }); },
    onError: () => toast.error("Failed to delete"),
  });

  const docs = Array.isArray(data) ? data : [];

  return (
    <div className="max-w-4xl mx-auto">
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Documents</h1>
        <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> Upload
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}</div>
      )}

      {!isLoading && docs.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500 text-sm mb-6">Upload property documents, title deeds, or proof of funds securely.</p>
          <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" /> Upload Your First Document
          </button>
        </div>
      )}

      <div className="space-y-3">
        {docs.map((doc: any) => (
          <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-kunda-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-kunda-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{doc.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{DOC_TYPES.find((t) => t.value === doc.type)?.label || doc.type}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn("badge text-xs", STATUS_COLOR[doc.status] || "bg-gray-100 text-gray-600")}>{doc.status}</span>
              {doc.fileUrl && (
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-kunda-700 rounded-lg hover:bg-kunda-50">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button onClick={() => deleteMutation.mutate(doc.id)} disabled={deleteMutation.isPending}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
