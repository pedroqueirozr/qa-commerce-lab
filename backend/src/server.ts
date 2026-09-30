import express from "express";
import { pool } from "./database.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok"
  });
});

app.get("/api/products", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        description,
        price,
        stock,
        sku,
        active,
        created_at,
        updated_at
      FROM products
      WHERE active = TRUE
      ORDER BY id
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);

    res.status(500).json({
      error: "Internal server error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`QA Commerce API running on port ${PORT}`);
});
