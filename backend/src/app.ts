import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { httpLogger } from "./middleware/httpLogger.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { sendSuccess } from "./utils/response.js";
import apiRouter from "./routes/index.js";

const app = express();

app.use(httpLogger);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  sendSuccess(
    res,
    { status: "ok", timestamp: new Date().toISOString() },
    "HotelBook API is running",
  );
});


app.use("/api", apiRouter);



app.use(notFound);
app.use(errorHandler);

export default app;