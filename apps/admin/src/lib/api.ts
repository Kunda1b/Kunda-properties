import { SERVICE_PORTS } from "@kunda/config";

const gatewayBaseUrl = `http://localhost:${SERVICE_PORTS.GATEWAY}`;

export async function adminFetch<T>(path: string, init?: RequestInit) {
  const response = await fetch(
    `${gatewayBaseUrl}${path.startsWith("/") ? path : `/${path}`}`,
    {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Admin API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getGatewayBaseUrl() {
  return gatewayBaseUrl;
}
