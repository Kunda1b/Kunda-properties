import { useQuery } from "@tanstack/react-query";
import { Shield, CheckCircle, Clock, XCircle } from "lucide-react";
import { kycApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";

const STATUS_MAP: Record<string, { icon: any; label: string; color: string; desc: string }> = {
  VERIFIED: { icon: CheckCircle, label: "Verified", color: "text-green-600 bg-green-50", desc: "Your identity has been verified. You can now transact securely." },
  SUBMITTED: { icon: Clock, label: "Under Review", color: "text-yellow-600 bg-yellow-50", desc: "Your documents are being reviewed. This usually takes 1-2 business days." },
  REJECTED: { icon: XCircle, label: "Rejected", color: "text-red-600 bg-red-50", desc: "Your verification was rejected. Please resubmit with correct documents." },
  PENDING: { icon: Shield, label: "Not Started", color: "text-gray-600 bg-gray-50", desc: "Start your identity verification to unlock full platform features." },
};

export default function KycPage() {
  const user = useAuthStore((s) => s.user);
  const kycStatus = user?.kyc?.status || "PENDING";
  const statusInfo = STATUS_MAP[kycStatus] || STATUS_MAP.PENDING;
  const Icon = statusInfo.icon;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Identity Verification</h1>

      <div className={`rounded-2xl p-6 mb-6 flex items-center gap-4 ${statusInfo.color}`}>
        <Icon className="w-8 h-8 flex-shrink-0" />
        <div>
          <p className="font-bold">{statusInfo.label}</p>
          <p className="text-sm mt-0.5 opacity-80">{statusInfo.desc}</p>
        </div>
      </div>

      {(kycStatus === "PENDING" || kycStatus === "REJECTED") && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Start Verification</h2>
          <p className="text-gray-500 text-sm mb-6">
            We partner with Smile Identity to verify your identity. You'll need:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 mb-6">
            <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-kunda-50 text-kunda-700 flex items-center justify-center text-xs font-bold">1</span> A government-issued photo ID</li>
            <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-kunda-50 text-kunda-700 flex items-center justify-center text-xs font-bold">2</span> A selfie or live photo</li>
            <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-kunda-50 text-kunda-700 flex items-center justify-center text-xs font-bold">3</span> Your country of residence</li>
          </ul>
          <button className="btn-primary w-full">Begin Verification</button>
        </div>
      )}
    </div>
  );
}
