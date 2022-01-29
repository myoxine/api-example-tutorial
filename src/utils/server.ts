import express from "express";
import { Express } from "express-serve-static-core";
import { hello } from "./../api/controllers";
const path = require("path");
import * as OpenApiValidator from "express-openapi-validator";
export async function createServer(): Promise<Express> {
  const server = express();
  const apiSpec = path.join(__dirname, "/../../config/openapi.yml");
  const validatorOptions = {
    coerceTypes: false,
    apiSpec: apiSpec,
    validateRequests: true,
    validateResponses: false,
  };
  server.use(OpenApiValidator.middleware(validatorOptions));

  server.get("/api/v1/hello", hello);
  server.get("/", (req, res) => {
    res.send("Hello world!!! I'm So Excited!!");
  });
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
  return server;
}
