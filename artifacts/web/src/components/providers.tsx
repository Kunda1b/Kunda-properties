import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";

function IdleGuard({ children }: { children: React.ReactNode }) {
  useIdleTimeout();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60000, retry: 1, refetchOnWindowFocus: false } }
  }));
  return (
    <QueryClientProvider client={qc}>
      <IdleGuard>{children}</IdleGuard>
    </QueryClientProvider>
  );
}
