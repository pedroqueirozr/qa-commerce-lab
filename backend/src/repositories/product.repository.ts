import { pool } from "../database.js";

export async function findAllActiveProducts() {
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

  return result.rows;
}

export async function findProductSuggestions(searchTerm: string) {
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
    [`%${searchTerm}%`]
  );

  return result.rows;
}

export async function searchActiveProducts(searchTerm: string) {
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
    [`%${searchTerm}%`]
  );

  return result.rows;
}

export async function findActiveProductById(productId: number) {
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

  return result.rows[0] ?? null;
}

export async function insertProduct(
  name: string,
  description: string | null,
  price: number,
  stock: number,
  sku: string
) {
  const result = await pool.query(
    `
      INSERT INTO products (
        name,
        description,
        price,
        stock,
        sku
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [name, description, price, stock, sku]
  );

  return result.rows[0];
}