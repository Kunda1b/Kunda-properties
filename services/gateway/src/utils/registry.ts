import { SERVICE_PORTS } from "@kunda/config";

export type ServiceConfig = {
  healthPath: string;
  name: string;
  pathPrefix: string;
  target: string;
};

export const SERVICE_REGISTRY: ServiceConfig[] = [
  {
    name: "auth",
    target: `http://localhost:${SERVICE_PORTS.AUTH}`,
    pathPrefix: "/api/auth",
    healthPath: "/health",
  },
  {
    name: "listings",
    target: `http://localhost:${SERVICE_PORTS.LISTINGS}`,
    pathPrefix: "/api/listings",
    healthPath: "/health",
  },
  {
    name: "escrow",
    target: `http://localhost:${SERVICE_PORTS.ESCROW}`,
    pathPrefix: "/api/escrow",
    healthPath: "/health",
  },
  {
    name: "documents",
    target: `http://localhost:${SERVICE_PORTS.DOCUMENTS}`,
    pathPrefix: "/api/documents",
    healthPath: "/health",
  },
];

export function findService(path: string): ServiceConfig | undefined {
  return SERVICE_REGISTRY.find((service) => path.startsWith(service.pathPrefix));
}
