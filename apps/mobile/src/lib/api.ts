const GATEWAY_BASE =
  process.env.EXPO_PUBLIC_GATEWAY_URL ?? "http://localhost:4000";

export function gatewayUrl(path: string) {
  return `${GATEWAY_BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function requestWithOfflineFallback<T>(
  path: string,
  init?: RequestInit,
  fallbackData?: T,
) {
  try {
    const response = await fetch(gatewayUrl(path), init);

    if (!response.ok) {
      throw new Error(`Gateway request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (fallbackData !== undefined) {
      return fallbackData;
    }

    throw error;
  }
}
