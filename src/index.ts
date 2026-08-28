require("dotenv").config();
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { BaseError } from "./shared/classes/base-error";
import { buildErrorMessage } from "./shared/classes/error-handler";
import { initializeMongo } from "./shared/database/mongodb";
import { router } from "./api/router";
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swager';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: "70mb" }));
app.use(bodyParser.urlencoded({ limit: "70mb", extended: true }));
app.use(initializeMongo);
app.use("/api", router);
app.use(errorMiddleware);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, function () {
  console.log(`listening on http://localhost:${port}`);
});

async function errorMiddleware(
  err: unknown,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  console.log("CATCH BY ERROR MIDDLEWARE");
  console.log(err);
  if (err instanceof BaseError) {
    res.status(err.httpCode).send(buildErrorMessage(err));
    return;
  }
  res.status(500).send(buildErrorMessage(err));
}
