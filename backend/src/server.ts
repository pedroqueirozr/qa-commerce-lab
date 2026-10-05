import express from "express";
import { logInfo } from "./logger";
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

app.listen(PORT, () => {
  console.log(`QA Commerce API running on port ${PORT}`);
  logInfo("SERVER", `QA Commerce API started on port ${PORT}`);
});