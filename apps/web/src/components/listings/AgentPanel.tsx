"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Property } from "@/types/property";
import EnquiryForm from "./EnquiryForm";
import EnquirySuccess from "./EnquirySuccess";

type AgentPanelProps = {
  property: Property;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AgentPanel({ property }: AgentPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => setSubmitted(false), 400);
  };

  return (
    <>
      <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-6">
        {property.verified && (
          <div
            className="mb-5 flex items-center gap-2 rounded-xl p-3 text-sm font-medium"
            style={{
              backgroundColor: "var(--kunda-green-light)",
              color: "var(--kunda-green)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Verified listing
          </div>
        )}

        <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-5">
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            style={{
              backgroundColor: "var(--kunda-green-light)",
              color: "var(--kunda-green)",
            }}
          >
            {property.agentName
              .split(" ")
              .map((name) => name[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {property.agentName}
            </p>
            <p className="text-xs text-gray-500">Verified agent</p>
          </div>
        </div>

        <div className="mb-5 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Listed</span>
            <span className="font-medium text-gray-900">
              {formatDate(property.listedAt)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Reference</span>
            <span className="font-mono text-xs text-gray-900">
              KP-{property.id.slice(0, 6).toUpperCase()}
            </span>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="mb-3 w-full rounded-xl py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--kunda-green)" }}
        >
          Enquire about this property
        </button>

        <a
          href={`https://wa.me/${property.agentPhone
            .replace(/\s+/g, "")
            .replace("+", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.845L.057 23.98l6.305-1.655A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.737.98.998-3.645-.234-.374A9.818 9.818 0 1112 21.818z" />
          </svg>
          WhatsApp agent
        </a>

        <p className="mt-4 text-center text-xs text-gray-400">
          Kunda Properties protects your personal information
        </p>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={submitted ? "Enquiry sent" : "Contact the agent"}
      >
        {submitted ? (
          <EnquirySuccess onClose={closeModal} />
        ) : (
          <EnquiryForm
            property={property}
            onSuccess={() => setSubmitted(true)}
          />
        )}
      </Modal>
    </>
  );
}
