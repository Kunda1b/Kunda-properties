import { useMemo } from "react";

export function useCameraAccess() {
  return useMemo(
    () => ({
      granted: false,
      label: "Camera permission will be requested when media capture is connected.",
    }),
    [],
  );
}
