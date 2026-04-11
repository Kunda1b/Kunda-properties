import { pathToFileURL } from "node:url";

export function isDirectExecution(metaUrl: string): boolean {
  const entryPoint = process.argv[1];

  if (!entryPoint) {
    return false;
  }

  return pathToFileURL(entryPoint).href === metaUrl;
}
