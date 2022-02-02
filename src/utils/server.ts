import bodyParser from "body-parser";
import express from "express";
import { Express } from "express-serve-static-core";
import morgan from "morgan";
import morganBody from "morgan-body";
import * as api from "@root/api/controllers";
import { connector, summarise } from "swagger-routes-express";
import YAML from "yamljs";
import path from "path";
import * as OpenApiValidator from "express-openapi-validator";
import swaggerUi from "swagger-ui-express";
import config from "@root/config";
import { expressDevLogger } from "@root/utils/express_dev_logger";
import logger from "@root/utils/logger";
export async function createServer(): Promise<Express> {
  const server = express();
  server.use(bodyParser.json());

  if (config.morganLogger) {
    server.use(
      morgan(":method :url :status :response-time ms - :res[content-length]")
    );
  }

  if (config.morganBodyLogger) {
    morganBody(server);
  }

  if (config.exmplDevLogger) {
    server.use(expressDevLogger);
  }
  const apiSpec = path.join(__dirname, "/../../config/openapi.yml");
  const apiDefinition = YAML.load(apiSpec);
  const apiSummary = summarise(apiDefinition);
  logger.info(apiSummary);
  server.use("/doc/v1", swaggerUi.serve, swaggerUi.setup(apiDefinition));

  const validatorOptions = {
    coerceTypes: false,
    apiSpec: apiSpec,
    validateRequests: true,
    validateResponses: false,
  };
  server.use(OpenApiValidator.middleware(validatorOptions));
  server.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      res.status(err.status).json({
        error: {
          type: "request_validation",
          message: err.message,
          errors: err.errors,
        },
      });
    }
  );

  const connect = connector(api, apiDefinition, {
    onCreateRoute: (method: string, descriptor: any[]) => {
      logger.verbose(
        `${method}: ${descriptor[0]} : ${(descriptor[1] as any).name}`
      );
    },
    security: {
      bearerAuth: api.auth,
    },
  });

  connect(server);

  server.use((req: express.Request, res: express.Response) => {
    res.status(404).send({
      error: {
        type: "page_not_found",
        message: "Your api endpoint not found",
      },
    });
  });
  return server;
}
