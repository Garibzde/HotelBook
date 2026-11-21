import express from "express";
import cors from "cors";
import helmet from "helmet";
import { sendSuccess } from "./utils/response.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { prisma } from "./lib/prisma.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  sendSuccess(
    res,
    { status: "ok", timestamp: new Date().toISOString() },
    "HotelBook API is running",
  );
});



app.use(notFound);
app.use(errorHandler);

export default app;