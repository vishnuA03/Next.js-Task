"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTasks = getTasks;
exports.createTask = createTask;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
function getParamId(param) {
    if (!param)
        return NaN;
    const str = Array.isArray(param) ? param[0] : param;
    return parseInt(str, 10);
}
const createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    description: zod_1.z.string().optional(),
    completed: zod_1.z.boolean().optional().default(false),
    category: zod_1.z.string().optional(),
    priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
});
const updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional().nullable(),
    completed: zod_1.z.boolean().optional(),
    category: zod_1.z.string().optional().nullable(),
    priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});
// Get user tasks with search, filter (category, status, priority), and pagination
async function getTasks(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const { search, category, completed, priority, page, limit, sortBy, order } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;
        const where = {
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
        const orderByField = sortBy || "createdAt";
        const sortOrder = order === "asc" ? "asc" : "desc";
        const orderBy = {};
        if (["createdAt", "updatedAt", "title", "priority"].includes(orderByField)) {
            orderBy[orderByField] = sortOrder;
        }
        else {
            orderBy.createdAt = "desc";
        }
        const [total, tasks] = await Promise.all([
            prisma_1.prisma.task.count({ where }),
            prisma_1.prisma.task.findMany({
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
    }
    catch (error) {
        console.error("Get tasks error:", error);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
}
// Create a new task
async function createTask(req, res) {
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
        const task = await prisma_1.prisma.task.create({
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
    }
    catch (error) {
        console.error("Create task error:", error);
        res.status(500).json({ error: "Failed to create task" });
    }
}
// Update an existing task
async function updateTask(req, res) {
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
        const existingTask = await prisma_1.prisma.task.findFirst({
            where: { id, userId: req.user.id },
        });
        if (!existingTask) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        const updatedTask = await prisma_1.prisma.task.update({
            where: { id },
            data: parseResult.data,
        });
        res.json({
            success: true,
            message: "Task updated successfully",
            data: updatedTask,
        });
    }
    catch (error) {
        console.error("Update task error:", error);
        res.status(500).json({ error: "Failed to update task" });
    }
}
// Delete a task
async function deleteTask(req, res) {
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
        const existingTask = await prisma_1.prisma.task.findFirst({
            where: { id, userId: req.user.id },
        });
        if (!existingTask) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        await prisma_1.prisma.task.delete({ where: { id } });
        res.json({
            success: true,
            message: "Task deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete task error:", error);
        res.status(500).json({ error: "Failed to delete task" });
    }
}
