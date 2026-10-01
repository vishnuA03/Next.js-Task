import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/auth.routes";
import externalRoutes from "./routes/external.routes";
import taskRoutes from "./routes/task.routes";

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (_req: Request, res: Response) => {
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
app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// Mount modular API routers
app.use("/api/auth", authRoutes);
app.use("/api/external", externalRoutes);
app.use("/api/tasks", taskRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default app;
