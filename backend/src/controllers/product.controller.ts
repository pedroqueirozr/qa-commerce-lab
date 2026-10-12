import type { Request, Response } from "express";
import type { DatabaseError } from "pg";
import { logError, logWarn } from "../logger";
import {
  findAllActiveProducts,
  searchActiveProducts,
  findProductSuggestions,
  findActiveProductById,
  insertProduct
} from "../repositories/product.repository.js";

export async function listProducts(_req: Request, res: Response) {
  try {
    const products = await findAllActiveProducts();

    return res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    logError("DATABASE", "Error fetching products");

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}

export async function searchProducts(req: Request, res: Response) {
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

    const products = await searchActiveProducts(query.trim());

    return res.status(200).json(products);
  } catch (error) {
    console.error("Error searching products:", error);
    logError("DATABASE", "Error searching products");

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}

export async function getProductSuggestions(req: Request, res: Response) {
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

    const suggestions = await findProductSuggestions(query.trim());

    return res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error fetching product suggestions:", error);
    logError("DATABASE", "Error fetching product suggestions");

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}



export async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        error: "Invalid product id"
      });
    }

    const product = await findActiveProductById(productId);

    if (product === null) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    return res.status(200).json(product);
  } catch (error) {
      console.error("Error fetching product:", error);
      logError("DATABASE", "Error fetching product");

      return res.status(500).json({
      error: "Internal server error"
    });
  }
}

export async function createProduct(req: Request, res: Response) {
  const { name, description, price, stock, sku } = req.body;

  let normalizedDescription = null;

  if (typeof name !== "string") {
    logWarn(
      "VALIDATION",
      "Product creation rejected: missing or invalid name"
    );

    return res.status(400).json({
      error: "Product name is required"
    });
  }

  const normalizedName = name.trim();

  if (normalizedName.length === 0) {
    logWarn(
      "VALIDATION",
      "Product creation rejected: empty name"
    );

    return res.status(400).json({
      error: "Product name entered incorrectly"
    });
  }

  if (typeof price !== "number" || price < 0 || Number.isNaN(price)) {
    logWarn(
      "VALIDATION",
      "Product creation rejected: invalid price"
    );

    return res.status(400).json({
      error: "The value cannot be negative or written out in words"
    });
  }

  if (
    typeof stock !== "number" ||
    Number.isNaN(stock) ||
    stock < 0 ||
    !Number.isInteger(stock)
  ) {
    logWarn(
      "VALIDATION",
      "Product creation rejected: invalid stock"
    );

    return res.status(400).json({
      error: "The stock must be a non-negative integer or cannot written out in words"
    });
  }

  if (typeof sku !== "string") {
    logWarn(
      "VALIDATION",
      "Product creation rejected: missing or invalid SKU"
    );

    return res.status(400).json({
      error: "Product SKU is required"
    });
  }

  const normalizedSku = sku.trim();

  if (normalizedSku.length === 0) {
    logWarn(
      "VALIDATION",
      "Product creation rejected: empty SKU"
    );

    return res.status(400).json({
      error: "SKU entered incorrectly"
    });
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      logWarn(
        "VALIDATION",
        "Product creation rejected: invalid description"
      );

      return res.status(400).json({
        error: "Invalid description format"
      });
    }

    if (description.trim().length >= 1) {
      normalizedDescription = description.trim();
    }
  }
  try {
    const product = await insertProduct(
      normalizedName,
      normalizedDescription,
      price,
      stock,
      normalizedSku
    );

    return res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);

    const dbError = error as DatabaseError;

    if (
      dbError.code === "23505" &&
      dbError.constraint === "products_sku_key"
    ) {
      logWarn(
        "PRODUCT",
        "Product creation rejected: duplicate SKU"
      );

      return res.status(409).json({
        error: "Product SKU already exists"
      });
    }

    logError("DATABASE", "Error creating product");

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}