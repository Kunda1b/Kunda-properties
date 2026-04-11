import * as configModule from "@kunda/config";
import { app } from "./app";

const { logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

const PORT = 4000;

app.listen(PORT, () => {
  logger.info(`API gateway running on port ${PORT}`);
  logger.info("Routing:");
  logger.info("  /api/auth      -> :4001");
  logger.info("  /api/listings  -> :4002");
  logger.info("  /api/escrow    -> :4003");
  logger.info("  /api/documents -> :4004");
});
