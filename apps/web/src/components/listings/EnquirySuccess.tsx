type EnquirySuccessProps = {
  onClose: () => void;
};

export default function EnquirySuccess({ onClose }: EnquirySuccessProps) {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-kunda-forest-soft">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          className="text-kunda-forest"
        >
          <path
            d="M9 12l2 2 4-4"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </div>
      <h3 className="mb-2 font-display text-xl font-semibold text-kunda-ink">
        Enquiry sent!
      </h3>
      <p className="mb-6 text-sm text-kunda-muted">
        The agent will get back to you shortly. You can also track your
        enquiries from your dashboard.
      </p>
      <button onClick={onClose} className="btn-primary">
        Close
      </button>
    </div>
  );
}
