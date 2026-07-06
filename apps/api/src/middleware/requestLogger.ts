import { pinoHttp } from "pino-http";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../lib/logger.js";

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers["x-request-id"] || uuidv4(),
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req: any, res) =>
    `${req.method} ${req.originalUrl || req.url} ${res.statusCode}`,
  customErrorMessage: (req: any, res, err) =>
    `${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${err.message}`,
  serializers: {
    req: () => undefined,
    res: () => undefined,
  },
});
