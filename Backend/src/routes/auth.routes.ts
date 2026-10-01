import { Router } from "express";
import { register, login, getMe, getLoginLogs } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Public auth endpoints
router.post("/register", register);
router.post("/login", login);

// Protected auth endpoints
router.get("/me", requireAuth, getMe);
router.get("/logs", requireAuth, getLoginLogs);

export default router;
