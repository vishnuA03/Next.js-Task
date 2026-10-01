"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const external_controller_1 = require("../controllers/external.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public third-party data routes with search, filter, and pagination
router.get("/products", external_controller_1.getProducts);
router.get("/categories", external_controller_1.getCategories);
router.get("/products/:id", external_controller_1.getProduct);
// Protected routes to manage user saved/bookmarked third-party items in DB
router.post("/saved", auth_middleware_1.requireAuth, external_controller_1.saveItem);
router.get("/saved", auth_middleware_1.requireAuth, external_controller_1.getSavedItems);
router.delete("/saved/:id", auth_middleware_1.requireAuth, external_controller_1.deleteSavedItem);
exports.default = router;
