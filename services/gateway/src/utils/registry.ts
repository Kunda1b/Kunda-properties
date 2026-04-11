export type ServiceConfig = {
  healthPath: string;
  name: string;
  pathPrefix: string;
  target: string;
};

export const SERVICE_REGISTRY: ServiceConfig[] = [
  {
    name: "auth",
    target: "http://localhost:4001",
    pathPrefix: "/api/auth",
    healthPath: "/health",
  },
  {
    name: "listings",
    target: "http://localhost:4002",
    pathPrefix: "/api/listings",
    healthPath: "/health",
  },
  {
    name: "escrow",
    target: "http://localhost:4003",
    pathPrefix: "/api/escrow",
    healthPath: "/health",
  },
  {
    name: "documents",
    target: "http://localhost:4004",
    pathPrefix: "/api/documents",
    healthPath: "/health",
  },
];

export function findService(path: string): ServiceConfig | undefined {
  return SERVICE_REGISTRY.find((service) => path.startsWith(service.pathPrefix));
}
