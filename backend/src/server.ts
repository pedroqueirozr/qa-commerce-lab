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

app.get("/api/products/search", async (req, res) => {

  try {
    const query = req.query.q;

    if (typeof query !== "string" || query.trim().length === 0){
      return res.status(400).json({
        error: "Search query is required"
      });//Ausente / vazio
    }

    const searchTerm = `%${query.trim()}%`;

    const result = await pool.query(
      `
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
          AND name ILIKE $1
        ORDER BY name
      `,
      [searchTerm]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error searching products:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

app.get("/api/products/suggestions", async (req, res) => {
  try {
    const query = req.query.q;

    if (typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        error: "Search query is required"
      });
    }

    if (query.trim().length < 3) {
      return res.status(400).json({
        error: "Search query must contain at least 3 characters"
      });
    }

    const result = await pool.query(
      `
        SELECT
          id,
          name,
          sku
        FROM products
        WHERE active = TRUE
          AND name ILIKE $1
        ORDER BY name
        LIMIT 10
      `,
      [`%${query.trim()}%`]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching product suggestions:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
     return res.status(400).json({
     error: "Invalid product id"
     });
   }

    const result = await pool.query(
      `
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
        WHERE id = $1
          AND active = TRUE
      `,
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching product:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`QA Commerce API running on port ${PORT}`);
});
