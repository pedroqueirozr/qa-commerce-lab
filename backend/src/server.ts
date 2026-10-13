import express from "express";
import type { Request, Response, NextFunction } from "express";
import { logInfo, logWarn } from "./logger";
import productRouter from "./routes/product.routes.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/api/products", productRouter);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok"
  });
});

app.use((
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    err instanceof Error &&
    "type" in err &&
    err.type === "entity.parse.failed"
  ) {
    logWarn("VALIDATION", "Request rejected: malformed JSON payload");
    return res.status(400).json({
      error: "Invalid JSON payload"
    });
  }

  next(err);
});


app.listen(PORT, () => {
  console.log(`QA Commerce API running on port ${PORT}`);
  logInfo("SERVER", `QA Commerce API started on port ${PORT}`);
});