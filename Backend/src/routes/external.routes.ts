import { Router } from "express";
import {
  getProducts,
  getCategories,
  getProduct,
  saveItem,
  getSavedItems,
  deleteSavedItem,
} from "../controllers/external.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Public third-party data routes with search, filter, and pagination
router.get("/products", getProducts);
router.get("/categories", getCategories);
router.get("/products/:id", getProduct);

// Protected routes to manage user saved/bookmarked third-party items in DB
router.post("/saved", requireAuth, saveItem);
router.get("/saved", requireAuth, getSavedItems);
router.delete("/saved/:id", requireAuth, deleteSavedItem);

export default router;
