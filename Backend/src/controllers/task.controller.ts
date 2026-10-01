import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

function getParamId(param: string | string[] | undefined): number {
  if (!param) return NaN;
  const str = Array.isArray(param) ? param[0] : param;
  return parseInt(str, 10);
}

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  completed: z.boolean().optional().default(false),
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  category: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

// Get user tasks with search, filter (category, status, priority), and pagination
export async function getTasks(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { search, category, completed, priority, page, limit, sortBy, order } =
      req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId: req.user.id,
    };

    // Text search in title or description
    if (search && typeof search === "string" && search.trim().length > 0) {
      where.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }

    // Category filter
    if (category && typeof category === "string" && category.trim().length > 0) {
      where.category = { equals: category.trim() };
    }

    // Completion status filter
    if (completed !== undefined) {
      where.completed = completed === "true" || completed === "1";
    }

    // Priority filter
    if (priority && typeof priority === "string") {
      where.priority = { equals: priority.toUpperCase() };
    }

    // Sort order
    const orderByField = (sortBy as string) || "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";
    const orderBy: any = {};
    if (["createdAt", "updatedAt", "title", "priority"].includes(orderByField)) {
      orderBy[orderByField] = sortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filtersApplied: {
        search: search || null,
        category: category || null,
        completed: completed !== undefined ? completed === "true" : null,
        priority: priority || null,
      },
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
}

// Create a new task
export async function createTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parseResult = createTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const task = await prisma.task.create({
      data: {
        ...parseResult.data,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
}

// Update an existing task
export async function updateTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = getParamId(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid task ID" });
      return;
    }

    const parseResult = updateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const existingTask = await prisma.task.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existingTask) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: parseResult.data,
    });

    res.json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
}

// Delete a task
export async function deleteTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = getParamId(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid task ID" });
      return;
    }

    const existingTask = await prisma.task.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existingTask) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    await prisma.task.delete({ where: { id } });

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
}
