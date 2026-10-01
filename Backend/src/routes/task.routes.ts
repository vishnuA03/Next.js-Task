import { Router } from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/task.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// All task routes require authentication
router.use(requireAuth);

router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
