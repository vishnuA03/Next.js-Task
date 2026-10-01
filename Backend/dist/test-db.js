"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("./lib/prisma");
async function main() {
    console.log("Testing database connection...");
    const isConnected = await (0, prisma_1.connectDB)();
    if (isConnected) {
        const userCount = await prisma_1.prisma.user.count();
        const taskCount = await prisma_1.prisma.task.count();
        console.log(`Database tables ready. Users: ${userCount}, Tasks: ${taskCount}`);
    }
    await prisma_1.prisma.$disconnect();
}
main().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
