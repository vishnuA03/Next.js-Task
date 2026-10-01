"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const prisma_1 = require("./lib/prisma");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const external_routes_1 = __importDefault(require("./routes/external.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const app = (0, express_1.default)();
// Security and utility middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
}));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Root route
app.get("/", (_req, res) => {
    res.json({
        name: "Next-Task Backend API",
        status: "online",
        endpoints: {
            health: "GET /api/health",
            auth: {
                register: "POST /api/auth/register",
                login: "POST /api/auth/login",
                me: "GET /api/auth/me",
                logs: "GET /api/auth/logs",
            },
            external: {
                products: "GET /api/external/products?search=&category=&page=1&limit=10&sortBy=&order=",
                categories: "GET /api/external/categories",
                productById: "GET /api/external/products/:id",
                savedItems: "GET /api/external/saved (Auth required)",
                saveItem: "POST /api/external/saved (Auth required)",
                deleteSaved: "DELETE /api/external/saved/:id (Auth required)",
            },
            tasks: {
                list: "GET /api/tasks?search=&category=&completed=&priority=&page=1&limit=10",
                create: "POST /api/tasks",
                update: "PUT /api/tasks/:id",
                delete: "DELETE /api/tasks/:id",
            },
        },
    });
});
// Health check endpoint (verifies server and database connection)
app.get("/api/health", async (_req, res) => {
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: "healthy",
            database: "connected",
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(503).json({
            status: "unhealthy",
            database: "disconnected",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
        });
    }
});
// Mount modular API routers
app.use("/api/auth", auth_routes_1.default);
app.use("/api/external", external_routes_1.default);
app.use("/api/tasks", task_routes_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});
// Global error handler
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});
exports.default = app;
