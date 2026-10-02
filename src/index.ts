require("dotenv").config();
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { BaseError } from "./shared/classes/base-error";
import { buildErrorMessage } from "./shared/classes/error-handler";
import { initializeMongo } from "./shared/database/mongodb";
import { router } from "./api/router";
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swager';
import { startVacationBalanceReminderSchedule } from "./api/vacation_balances/vacationBalanceRemindersService";

const app = express();
const port = process.env.PORT || 3000;

const allowedCorsOrigins = getAllowedCorsOrigins();
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: getPositiveIntegerEnv("API_RATE_LIMIT_MAX", 1200),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: {
    status: 429,
    message: "Demasiadas solicitudes. Intenta de nuevo más tarde.",
  },
});

const apiSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'none'"],
    },
  },
});
const documentationSecurityHeaders = helmet({ contentSecurityPolicy: false });

const trustProxyHops = process.env.TRUST_PROXY_HOPS;
if (trustProxyHops !== undefined && trustProxyHops.trim() !== "") {
  const parsedHops = Number(trustProxyHops);
  if (!Number.isInteger(parsedHops) || parsedHops < 0) {
    throw new Error("TRUST_PROXY_HOPS debe ser un entero mayor o igual a cero.");
  }
  if (parsedHops > 0) app.set("trust proxy", parsedHops);
}

app.use((req, res, next) => {
  const headers = req.path.startsWith("/api-docs")
    ? documentationSecurityHeaders
    : apiSecurityHeaders;
  headers(req, res, next);
});
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedCorsOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
}));
app.use("/api", apiRateLimit);
app.use((req, res, next) => {
  // La importación de asistencia instala su parser después de validar token y rol.
  if (req.method === "POST" && req.path === "/api/attendance-records/import-weeks") {
    next();
    return;
  }
  bodyParser.json({ limit: "2mb" })(req, res, next);
});
app.use(bodyParser.urlencoded({ limit: "100kb", extended: true }));
app.use(initializeMongo);
app.use("/api", router);
app.use(errorMiddleware);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, function () {
  console.log(`listening on http://localhost:${port}`);
  startVacationBalanceReminderSchedule();
});

function getAllowedCorsOrigins() {
  const configuredOrigins = process.env.CORS_ORIGINS;
  const originValues = configuredOrigins === undefined
    ? process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:4200", "http://127.0.0.1:4200"]
    : configuredOrigins.split(",").map((origin) => origin.trim()).filter(Boolean);

  return new Set(originValues.map((origin) => {
    let parsedOrigin: URL;
    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error(`Origen inválido en CORS_ORIGINS: ${origin}`);
    }

    if (parsedOrigin.origin !== origin) {
      throw new Error(`CORS_ORIGINS debe contener orígenes exactos, sin rutas: ${origin}`);
    }

    return origin;
  }));
}

function getPositiveIntegerEnv(name: string, fallback: number) {
  const value = process.env[name];
  if (!value) return fallback;

  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${name} debe ser un entero positivo.`);
  }

  return parsedValue;
}

async function errorMiddleware(
  err: unknown,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  console.log("CATCH BY ERROR MIDDLEWARE");
  console.log(err);
  if (err instanceof BaseError) {
    const errorResponse = buildErrorMessage(err);
    res.status(errorResponse.status || 500).send(errorResponse);
    return;
  }
  res.status(500).send(buildErrorMessage(err));
}
