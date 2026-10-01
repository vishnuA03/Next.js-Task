"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public auth endpoints
router.post("/register", auth_controller_1.register);
router.post("/login", auth_controller_1.login);
// Protected auth endpoints
router.get("/me", auth_middleware_1.requireAuth, auth_controller_1.getMe);
router.get("/logs", auth_middleware_1.requireAuth, auth_controller_1.getLoginLogs);
exports.default = router;
