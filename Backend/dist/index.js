"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const prisma_1 = require("./lib/prisma");
const PORT = process.env.PORT || 5000;
async function startServer() {
    const dbConnected = await (0, prisma_1.connectDB)();
    if (!dbConnected) {
        console.error("❌ Exiting process because database connection failed.");
        process.exit(1);
    }
    const server = app_1.default.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
    const shutdown = async (signal) => {
        console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
        server.close(async () => {
            await prisma_1.prisma.$disconnect();
            console.log("🔌 Prisma disconnected. Server terminated.");
            process.exit(0);
        });
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}
startServer().catch((err) => {
    console.error("Fatal server error:", err);
    process.exit(1);
});
