import { Router } from "express";
import {
  listProducts,
  searchProducts,
  getProductSuggestions,
  getProductById,
  createProduct
} from "../controllers/product.controller.js";

const router = Router();

router.get("/", listProducts);

router.get("/search", searchProducts);

router.get("/suggestions", getProductSuggestions);

router.get("/:id", getProductById);

router.post("/", createProduct);
export default router;