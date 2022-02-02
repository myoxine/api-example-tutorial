import logger from "@root/utils/logger";
import { createServer } from "./utils/server";

createServer()
  .then((server) => {
    server.listen(3000, () => {
      logger.info(`Listening on http://localhost:3000`);
    });
  })
  .catch((err) => {
    logger.error(`Error: ${err}`);
  });
