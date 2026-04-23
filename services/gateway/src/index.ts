import * as configModule from "@kunda/config";
import { app } from "./app";

const { logger, SERVICE_PORTS } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

const PORT = SERVICE_PORTS.GATEWAY;

app.listen(PORT, () => {
  logger.info(`API gateway running on port ${PORT}`);
  logger.info("Routing:");
  logger.info(`  /api/auth      -> :${SERVICE_PORTS.AUTH}`);
  logger.info(`  /api/listings  -> :${SERVICE_PORTS.LISTINGS}`);
  logger.info(`  /api/escrow    -> :${SERVICE_PORTS.ESCROW}`);
  logger.info(`  /api/documents -> :${SERVICE_PORTS.DOCUMENTS}`);
});
